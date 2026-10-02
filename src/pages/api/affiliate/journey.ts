import type { NextApiRequest, NextApiResponse } from 'next'
import { affiliateCookie, affiliateJourneyFrom } from '@/lib/affiliate-journey'

/**
 * POST, right after a page wrote the Affiliate journey cookie: sets the same cookie again from
 * this response. Safari caps a cookie a script wrote at 7 days (24 hours after a link from a
 * site it classes as a tracker) but keeps one the site's own server set for its full 90 days.
 * Only a valid journey is set again, so nothing else a request carries is echoed back.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).end()
    }
    res.setHeader('Cache-Control', 'no-store')
    const journey = affiliateJourneyFrom(req.cookies)
    if (journey) res.setHeader('Set-Cookie', affiliateCookie(journey, req.headers['x-forwarded-proto'] === 'https'))
    res.status(204).end()
}
