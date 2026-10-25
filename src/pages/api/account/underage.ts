import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { WORKER_API_ORIGIN } from '@/lib/worker-api'
import { needsAgeConfirmation } from '@/lib/age-gate'

// Deletes an account whose owner just failed the sign-up age check (lib/age-gate), through the
// Worker's account deletion (`/user/account/delete`), which sends no CORS headers for www. Only an
// account still waiting for that check qualifies, so an established account can never be
// deleted here.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  const accessToken = (req.headers.authorization || '').replace(
    /^Bearer\s+/i,
    ''
  )
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const auth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await auth.auth.getUser(accessToken)
  if (error || !data?.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  if (!needsAgeConfirmation(data.user)) {
    return res
      .status(409)
      .json({ message: 'This account is not waiting for an age check.' })
  }

  const response = await fetch(`${WORKER_API_ORIGIN}/user/account/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  }).catch(() => null)
  const body = await response?.json().catch(() => null)
  if (!response?.ok || body?.deleted !== true) {
    return res.status(502).json({ message: 'Deletion could not finish.' })
  }
  res.status(200).json({ deleted: true })
}
