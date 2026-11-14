// Password sign-in on the website (ADR 0216). It goes through the Worker's `/auth/v1/password/signin`, which also
// takes the extra sign-in email a Hide My Email account linked, an address Supabase doesn't know. The Worker answers
// the account's Supabase tokens, and setSession makes them this browser's session, so everything after it (the
// SIGNED_IN listener on /login, the app handoff, email preferences) runs as it did after signInWithPassword.
// Only when the Worker can't answer (a network error, a 5xx, or a reply that isn't its own, such as a missing route
// or the edge's challenge page) does the sign-in go to Supabase directly, so a Worker outage doesn't stop website
// sign-in. That way can't take a linked email.
//
// Never logged, stored or sent to analytics: the email, the password and the tokens.

import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { WORKER_API_ORIGIN } from '@/lib/worker-api'

const SUPPORT_EMAIL = 'support@enconvo.com'

/** Why a sign-in was refused, from the Worker's `code` or Supabase's error. */
export type PasswordSignInProblem =
  | 'invalid_credentials'
  | 'email_unconfirmed'
  | 'account_blocked'
  | 'account_unavailable'
  | 'too_many_tries'
  | 'invalid_email'
  | 'password_missing'
  | 'failed'

const WORKER_PROBLEMS: Record<string, PasswordSignInProblem> = {
  invalid_credentials: 'invalid_credentials',
  email_unconfirmed: 'email_unconfirmed',
  account_blocked: 'account_blocked',
  account_unavailable: 'account_unavailable',
  too_many_tries: 'too_many_tries',
  invalid_email: 'invalid_email',
  // An empty or overlong password.
  bad_request: 'password_missing',
}

export function passwordSignInProblem(code: unknown): PasswordSignInProblem {
  return typeof code === 'string' && Object.hasOwn(WORKER_PROBLEMS, code)
    ? WORKER_PROBLEMS[code]
    : 'failed'
}

/** The English source of the message for a problem, with its values, for the page's `t()`. */
export function passwordSignInMessage(problem: PasswordSignInProblem): {
  source: string
  values?: Record<string, string>
} {
  switch (problem) {
    case 'invalid_credentials':
      return { source: 'Incorrect email or password.' }
    case 'email_unconfirmed':
      return {
        source:
          'Confirm your email first: open the link in the email we sent you, then log in.',
      }
    case 'account_blocked':
      return {
        source: 'This account can’t sign in. Email {p0} for help.',
        values: { p0: SUPPORT_EMAIL },
      }
    case 'account_unavailable':
      return { source: 'This account has been deleted or is being deleted.' }
    case 'too_many_tries':
      return { source: 'Too many sign-in tries. Try again later.' }
    case 'invalid_email':
      return { source: 'Please enter a valid email' }
    case 'password_missing':
      return { source: 'Enter your password.' }
    default:
      return { source: 'Couldn’t log in. Try again.' }
  }
}

// Both branches list every field so reads type-check without strictNullChecks.
export type WorkerPasswordAnswer =
  | { kind: 'tokens'; accessToken: string; refreshToken: string; problem?: undefined }
  | { kind: 'refused'; problem: PasswordSignInProblem; accessToken?: undefined; refreshToken?: undefined }
  | { kind: 'unreachable'; problem?: undefined; accessToken?: undefined; refreshToken?: undefined }

/** Asks the Worker for the account's tokens. `unreachable` means the Worker gave no answer of its own. */
export async function requestPasswordSignIn(
  email: string,
  password: string,
  analyticsAllowed: boolean
): Promise<WorkerPasswordAnswer> {
  let response: Response
  try {
    response = await fetch(`${WORKER_API_ORIGIN}/auth/v1/password/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(analyticsAllowed ? {} : { analytics: 'off' }),
      },
      body: JSON.stringify({ email, password, platform: 'web' }),
      cache: 'no-store',
    })
  } catch {
    return { kind: 'unreachable' }
  }
  const body = await response.json().catch(() => null)
  if (
    response.ok &&
    typeof body?.accessToken === 'string' &&
    typeof body?.refreshToken === 'string'
  ) {
    return {
      kind: 'tokens',
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    }
  }
  if (response.status >= 500 || typeof body?.code !== 'string')
    return { kind: 'unreachable' }
  return { kind: 'refused', problem: passwordSignInProblem(body.code) }
}

/** Supabase's own refusals that have a message here; any other keeps Supabase's text, as the form showed before. */
function supabaseProblem(error: {
  message?: string
  status?: number
}): PasswordSignInProblem | null {
  if (error.message === 'Invalid login credentials') return 'invalid_credentials'
  if (error.message === 'Email not confirmed') return 'email_unconfirmed'
  if (error.status === 429) return 'too_many_tries'
  return null
}

type AuthClient = {
  auth: Pick<SupabaseClient['auth'], 'setSession' | 'signInWithPassword'>
}

// Both branches list every field so reads type-check without strictNullChecks.
export type PasswordSignInResult =
  | { ok: true; session: Session; user: User; problem?: undefined; message?: undefined }
  | {
      ok: false
      session?: undefined
      user?: undefined
      /** Null for a Supabase error with no message here; `message` is Supabase's text then. */
      problem: PasswordSignInProblem | null
      message: string
    }

/** Signs this browser in with an email (the account's or its linked one) and password. */
export async function signInWithPassword(
  supabase: AuthClient,
  email: string,
  password: string,
  analyticsAllowed: boolean
): Promise<PasswordSignInResult> {
  const answer = await requestPasswordSignIn(email, password, analyticsAllowed)
  if (answer.kind === 'refused')
    return { ok: false, problem: answer.problem, message: '' }
  if (answer.kind === 'tokens') {
    const { data, error } = await supabase.auth.setSession({
      access_token: answer.accessToken,
      refresh_token: answer.refreshToken,
    })
    if (error || !data.session || !data.user)
      return { ok: false, problem: 'failed', message: '' }
    return { ok: true, session: data.session, user: data.user }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.session || !data.user) {
    const problem = error ? supabaseProblem(error) : 'failed'
    return {
      ok: false,
      problem: problem === null && !error?.message ? 'failed' : problem,
      message: error?.message ?? '',
    }
  }
  return { ok: true, session: data.session, user: data.user }
}
