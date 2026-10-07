import type { NextApiRequest, NextApiResponse } from 'next'
import { WORKER_API_ORIGIN } from '@/lib/worker-api'
import type { AccountPlan } from '@/lib/account-plan'

// The Account page's plan, read from what the Enconvo app's Account settings
// read: the Worker's points balance with entitlements (`?v=2`, docs/adr/0012),
// plus the active device count. /user/devices sends no CORS headers, so the
// page reads both through here. Its `list` action never registers or touches a
// device, but the Worker requires a client id, so the website sends its own.
const WEBSITE_CLIENT_ID = 'enconvo-website'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  const accessToken = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!accessToken) return res.status(401).json({ message: 'Unauthorized' })

  const [balance, devices] = await Promise.all([
    fetch(`${WORKER_API_ORIGIN}/api/points_usage/balance?v=2`, {
      headers: { accessToken },
    })
      .then(async (response) => ({
        status: response.status,
        body: await response.json().catch(() => null),
      }))
      .catch(() => null),
    fetch(`${WORKER_API_ORIGIN}/user/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        client_id: WEBSITE_CLIENT_ID,
      },
      body: '{}',
    })
      .then((response) => response.json())
      .catch(() => null),
  ])

  const data = balance?.body?.data
  if (!data) {
    return res
      .status(balance?.status === 401 ? 401 : 502)
      .json({ message: 'Plan details are unavailable.' })
  }
  const list = devices?.code === 200 ? devices.data?.devices : null
  const plan: AccountPlan = {
    total: typeof data.total === 'number' ? data.total : 0,
    // An account without a subscription row has no entitlements: it's free.
    entitlements: data.entitlements ?? null,
    devicesUsed: Array.isArray(list) ? list.length : null,
  }
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).json(plan)
}
