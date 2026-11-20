import { authFlowHref } from '@/lib/auth-flow'
import { offerReturnPath } from '@/lib/welcome-offer'

type Query = Record<string, string | string[] | undefined>

/**
 * Where the link in the confirmation email lands, for the sign-up and for a resent email. Web
 * offer, Welcome offer and Affiliate sign-ups return to their page through /auth/callback rather
 * than opening the app. Every other one lands on /login with the sign-up's query, so only a
 * sign-up the app opened (from=app) hands the account to the app afterwards.
 */
export function signupEmailRedirect(
  origin: string,
  query: Query,
  locale: string
): string {
  const returnUrl = Array.isArray(query.returnUrl)
    ? query.returnUrl[0]
    : query.returnUrl
  if (
    typeof returnUrl === 'string' &&
    (/^\/(?:ltd|affiliate)(?:[?#/]|$)/.test(returnUrl) ||
      !!offerReturnPath(returnUrl))
  )
    return `${origin}/auth/callback?${new URLSearchParams({
      returnUrl,
      language: locale,
    })}`
  return `${origin}${authFlowHref('/login', { ...query, language: locale })}`
}

/** Auth sends a confirmation email to an address at most once a minute. */
export const RESEND_WAIT_SECONDS = 60

/** `0:42` for 42 seconds. */
export function resendCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
