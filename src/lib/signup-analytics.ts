import { trackEvent } from './analytics'
import { hasConsent } from './cookie-consent'

const INTENT = 'enconvo_google_signup_intent_v1'
const REPORTED = 'enconvo_signup_reported_v1'
const MAX_FLOW_AGE = 30 * 60 * 1000
type SignupUser = { id: string; created_at?: string; identities?: unknown[] }
let memoryIntent = 0
const reported = new Set<string>()

// Google sign-in also creates accounts. Remember when this OAuth flow began so
// an existing account's ordinary sign-in never counts as a new registration.
export function beginGoogleSignupMeasurement() {
  if (!hasConsent('analytics')) return
  memoryIntent = Date.now()
  try { sessionStorage.setItem(INTENT, String(memoryIntent)) } catch {}
}

/** Record an actual new Supabase account, once in this browser, without sending its id. */
export function recordWebsiteSignup(user: SignupUser | null | undefined, method: 'email' | 'google', startedAt: number): boolean {
  // Measured only with the visitor's consent to analytics; this browser storage is analytics too.
  if (!hasConsent('analytics')) return false
  if (!user?.id || user.identities?.length === 0 || !Number.isFinite(startedAt) || startedAt <= 0) return false
  const created = Date.parse(user.created_at || '')
  const age = Date.now() - startedAt
  if (!Number.isFinite(created) || age < 0 || age > MAX_FLOW_AGE || created < startedAt - 5000 || created > Date.now() + 5000) return false
  if (reported.has(user.id)) return false
  let previous: string[] = []
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(REPORTED) || '[]')
    if (Array.isArray(stored)) previous = stored.filter((id): id is string => typeof id === 'string').slice(-20)
  } catch {}
  if (previous.includes(user.id)) return false
  reported.add(user.id)
  // Account ids stay only in local browser storage to prevent duplicate events.
  try { localStorage.setItem(REPORTED, JSON.stringify([...previous, user.id].slice(-20))) } catch {}
  trackEvent('sign_up', { method }, { includePagePath: false })
  return true
}

export function recordGoogleSignup(user: SignupUser | null | undefined): boolean {
  let startedAt = memoryIntent
  try {
    const stored = sessionStorage.getItem(INTENT)
    if (stored) startedAt = Number(stored)
    sessionStorage.removeItem(INTENT)
  } catch {}
  memoryIntent = 0
  return recordWebsiteSignup(user, 'google', startedAt)
}
