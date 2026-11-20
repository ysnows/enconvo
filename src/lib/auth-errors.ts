// Readable messages for the Supabase Auth refusals the sign-up, password and email forms can meet. Each is the
// English source for the page's `t()`. This supabase-js passes on only Auth's message and status, so the
// messages are matched by their text.

import { CaptchaError } from '@/components/Turnstile'

/** Auth's shortest password (Supabase › Authentication › Policies). */
export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_TOO_SHORT = 'Use a password of at least {p0} characters.'
export const CAPTCHA_UNAVAILABLE =
  'Couldn’t complete the security check. Reload the page and try again.'
export const CAPTCHA_REJECTED = 'The security check didn’t go through. Try again.'
export const INVALID_EMAIL = 'Please enter a valid email'
export const EMAIL_TAKEN = 'An account with this email already exists.'
export const TEMPORARY_EMAIL =
  'Sign-ups with temporary email addresses aren’t allowed. Use a permanent email address.'
export const PASSWORD_BREACHED =
  'This password has appeared in a data breach. Choose a different one.'
export const PASSWORD_WEAK = 'Choose a stronger password.'
export const RATE_LIMIT_WAIT = 'Wait {p0} seconds, then try again.'
export const EMAIL_RATE_LIMIT = 'Too many emails were sent recently. Try again later.'
export const RATE_LIMITED = 'Too many tries. Wait a moment, then try again.'

/** The message source and its values, for `t(source, values)`. */
export type AuthMessage = { source: string; values?: Record<string, string> }

export function passwordTooShort(): AuthMessage {
  return {
    source: PASSWORD_TOO_SHORT,
    values: { p0: String(MIN_PASSWORD_LENGTH) },
  }
}

/** The message for a Turnstile widget that gave no token. */
export function captchaMessage(error: unknown): AuthMessage {
  return {
    source:
      error instanceof CaptchaError ? CAPTCHA_UNAVAILABLE : CAPTCHA_REJECTED,
  }
}

/** True when Auth refused the request's CAPTCHA token (a missing, spent or forged one). */
export function isCaptchaRefusal(error: { message?: string } | null | undefined) {
  return /captcha/i.test(error?.message ?? '')
}

/**
 * The seconds Auth asks to wait before it sends this address another email ("For security purposes,
 * you can only request this after 42 seconds."), or null.
 */
export function retryAfterSeconds(
  error: { message?: string } | null | undefined
): number | null {
  const match = /request this (?:after|once every) (\d+) seconds?/i.exec(
    error?.message ?? ''
  )
  return match ? Number(match[1]) : null
}

/** A readable message for an Auth error, or null to keep Auth's own text. */
export function authErrorMessage(
  error: { message?: string; status?: number } | null | undefined
): AuthMessage | null {
  const message = error?.message ?? ''
  if (isCaptchaRefusal(error)) return { source: CAPTCHA_REJECTED }
  const wait = retryAfterSeconds(error)
  if (wait !== null)
    return { source: RATE_LIMIT_WAIT, values: { p0: String(wait) } }
  // The project's hourly cap on the emails Auth sends.
  if (/email rate limit/i.test(message)) return { source: EMAIL_RATE_LIMIT }
  if (error?.status === 429 || /rate limit/i.test(message))
    return { source: RATE_LIMITED }
  // The sign-up hook's refusal of a disposable inbox.
  if (/temporary email/i.test(message)) return { source: TEMPORARY_EMAIL }
  // "Unable to validate email address: invalid format".
  if (/validate email address|invalid format/i.test(message))
    return { source: INVALID_EMAIL }
  // Only with email confirmation off; with it on, Auth answers a taken address without an error.
  if (/already (been )?registered|already exists/i.test(message))
    return { source: EMAIL_TAKEN }
  // HaveIBeenPwned: "Password is known to be weak and easy to guess, please choose a different one."
  if (/known to be weak|pwned|breach|leaked/i.test(message))
    return { source: PASSWORD_BREACHED }
  if (/password should be at least \d+ characters/i.test(message))
    return passwordTooShort()
  if (/weak_password|password should contain|password is too weak/i.test(message))
    return { source: PASSWORD_WEAK }
  return null
}

/** The sign-up field a message is about, or null for one about the whole form. */
export function authMessageField(
  message: AuthMessage
): 'email' | 'password' | null {
  if ([INVALID_EMAIL, EMAIL_TAKEN, TEMPORARY_EMAIL].includes(message.source))
    return 'email'
  if ([PASSWORD_TOO_SHORT, PASSWORD_BREACHED, PASSWORD_WEAK].includes(message.source))
    return 'password'
  return null
}
