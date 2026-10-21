import type { NextApiRequest, NextApiResponse } from 'next'
import { campaignCookie, campaignJourneyFrom } from '@/lib/campaign-journey'

/**
 * POST, right after a page wrote the Campaign journey cookie: sets the same cookie again from
 * this response, as `/api/affiliate/journey` does. Safari caps a cookie a script wrote at 7 days
 * (24 hours after a link from a site it classes as a tracker) but keeps one the site's own server
 * set for its full 90 days. Only a valid visitor is set again, so nothing else is echoed back.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).end()
    }
    res.setHeader('Cache-Control', 'no-store')
    const visitor = campaignJourneyFrom(req.cookies)
    if (visitor) res.setHeader('Set-Cookie', campaignCookie(visitor, req.headers['x-forwarded-proto'] === 'https'))
    res.status(204).end()
}
