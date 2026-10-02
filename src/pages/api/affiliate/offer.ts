import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { affiliateOffer } from '@/lib/affiliate-discount'
import { affiliateCode } from '@/lib/affiliate-journey'
import type { AffiliateOffer } from '@/lib/affiliate-offer'
import { workerRequest } from '@/lib/worker-api'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * GET `?via=<code>`, for the pricing section: `{ offer }`, what a Checkout through that Affiliate
 * link gets applied (ADR 0090), or null. The Worker names the approved Affiliate's promotion code
 * and Stripe says what it takes off; the answer is cached for 5 minutes, so a code an admin
 * changes shows within that. Any failure answers null, uncached, and the section shows nothing.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ offer: AffiliateOffer | null }>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
    }
    const via = affiliateCode(req.query.via)
    if (!via) {
        res.setHeader('Cache-Control', 'no-store')
        return res.status(400).json({ offer: null })
    }
    try {
        const result = await workerRequest<{ promotion_code: string | null }>('/api/affiliate/offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ via }),
            // Nothing waits on this note, so it gets longer than a Checkout's 1.5 seconds.
            signal: AbortSignal.timeout(3000),
        })
        if (!result.ok) throw new Error(`Worker answered ${result.status} ${result.reason}`)
        const code = result.data.promotion_code
        const offer = code ? await affiliateOffer(stripe, code) : null
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
        return res.status(200).json({ offer })
    } catch (error) {
        console.warn('Affiliate offer left out:', (error as Error).message)
        res.setHeader('Cache-Control', 'no-store')
        return res.status(200).json({ offer: null })
    }
}
