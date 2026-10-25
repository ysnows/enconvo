// The sign-up age check (Terms of Use, "Who can use Enconvo"). An Enconvo account needs its
// owner to be at least MINIMUM_AGE. The question is neutral, a month and year of birth with no
// hint of the limit. Only the outcome is kept: `age_confirmed_at` in the account's metadata. The
// birth date itself is never sent or stored.
//
// Email sign-up asks on the form. Google sign-up started on /register asks on the form too, and
// the OAuth callback writes the confirmation it carried. An account Google creates from /login
// was never asked, so the callback sends it to /confirm-age first. A visitor below the age is
// told they can't use Enconvo. An account already created is deleted at once, and this browser
// isn't asked again for a day, so the answer can't simply be changed and resubmitted.
//
// Accounts created before AGE_CHECK_SINCE predate the check and aren't asked.

export const MINIMUM_AGE = 13
export const AGE_CHECK_SINCE = Date.parse('2026-10-25T00:00:00Z')

const REGISTRATION_AGE_KEY = 'enconvo:registration-age'
const REGISTRATION_AGE_TTL_MS = 15 * 60 * 1000
const BLOCK_COOKIE = 'enconvo_age_check'
const BLOCK_MAX_AGE_SECONDS = 24 * 60 * 60

export interface BirthMonth {
  /** 1–12 */
  month: number
  year: number
}

/**
 * Whole years old, today, for someone born in `birth`. Without the day, someone born in the
 * current month counts as not having had their birthday yet.
 */
export function ageFromBirthMonth(birth: BirthMonth, now = new Date()): number {
  const month = now.getMonth() + 1
  const years = now.getFullYear() - birth.year
  return birth.month >= month ? years - 1 : years
}

export function meetsMinimumAge(
  birth: BirthMonth | null,
  now = new Date()
): boolean {
  if (!birth) return false
  const { month, year } = birth
  if (!Number.isInteger(month) || month < 1 || month > 12) return false
  if (!Number.isInteger(year) || year < 1900 || year > now.getFullYear())
    return false
  return ageFromBirthMonth(birth, now) >= MINIMUM_AGE
}

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

/** The metadata a passed check writes onto the account. */
export function ageConfirmationMetadata(now = new Date()) {
  return { age_confirmed_at: now.toISOString(), age_minimum: MINIMUM_AGE }
}

/** Carries a passed check on /register through Google sign-in to the callback. */
export function saveRegistrationAgeConfirmation() {
  try {
    localStorage.setItem(REGISTRATION_AGE_KEY, String(Date.now()))
  } catch {
    // Storage blocked: the callback asks on /confirm-age instead.
  }
}

/** Whether this browser passed the check on /register in the last 15 minutes; read once. */
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

export function markAgeCheckFailed() {
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${BLOCK_COOKIE}=1; Path=/; Max-Age=${BLOCK_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  } catch {
    // Cookies blocked: the check simply asks again.
  }
}

export function ageCheckFailedRecently(): boolean {
  try {
    return document.cookie
      .split(';')
      .some((part) => part.trim() === `${BLOCK_COOKIE}=1`)
  } catch {
    return false
  }
}
