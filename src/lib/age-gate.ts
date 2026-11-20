// The sign-up age check (Terms of Use, "Who can use Enconvo"). An Enconvo account needs its
// owner to be at least MINIMUM_AGE. Sign-up and log-in carry one consent line next to their
// buttons: by continuing, the visitor confirms they are at least that age and agrees to the
// Terms and the Privacy Policy. Only that outcome is kept: `age_confirmed_at` in the account's
// metadata. No birth date is asked for or stored.
//
// Email sign-up writes the confirmation with the account. Apple and Google sign-ins started on
// /register or /login carry it to their callback, which writes it onto an account created since
// AGE_CHECK_SINCE that lacks it. When it can't be carried (browser storage blocked, or the
// visitor took longer than 15 minutes), /confirm-age asks for the same consent once.
//
// Accounts created before AGE_CHECK_SINCE predate the check and aren't asked.

export const MINIMUM_AGE = 13
export const AGE_CHECK_SINCE = Date.parse('2026-10-25T00:00:00Z')

const REGISTRATION_AGE_KEY = 'enconvo:registration-age'
const REGISTRATION_AGE_TTL_MS = 15 * 60 * 1000

type AgeUser = {
  created_at?: string
  user_metadata?: Record<string, unknown> | null
}

/** True for an account created since the check started that hasn't confirmed its owner's age. */
export function needsAgeConfirmation(
  user: AgeUser | null | undefined
): boolean {
  if (!user) return false
  if (typeof user.user_metadata?.age_confirmed_at === 'string') return false
  const created = Date.parse(user.created_at || '')
  return Number.isFinite(created) && created >= AGE_CHECK_SINCE
}

/** The metadata the consent writes onto the account. */
export function ageConfirmationMetadata(now = new Date()) {
  return { age_confirmed_at: now.toISOString(), age_minimum: MINIMUM_AGE }
}

/** Carries the consent given on /register or /login through Apple or Google sign-in to its callback. */
export function saveRegistrationAgeConfirmation() {
  try {
    localStorage.setItem(REGISTRATION_AGE_KEY, String(Date.now()))
  } catch {
    // Storage blocked: a new account is asked on /confirm-age instead.
  }
}

/** Whether this browser gave the consent in the last 15 minutes; read once. */
export function consumeRegistrationAgeConfirmation(): boolean {
  try {
    const stored = localStorage.getItem(REGISTRATION_AGE_KEY)
    if (stored === null) return false
    localStorage.removeItem(REGISTRATION_AGE_KEY)
    const at = Number(stored)
    return (
      Number.isFinite(at) &&
      at <= Date.now() &&
      Date.now() - at < REGISTRATION_AGE_TTL_MS
    )
  } catch {
    return false
  }
}
