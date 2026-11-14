// The Supabase sign-in cookie, under a __Host- name in production.
//
// Sites published from Enconvo are served at <name>.site.enconvo.com and run their own scripts, so a
// page there could set a cookie for Domain=enconvo.com under the old name and sign a visitor into
// another account here (cookie tossing). Browsers refuse a __Host- cookie that names a Domain, so a
// subdomain can never write this one; the old name is no longer read. Signing in again once after
// the change is expected.

const projectRef = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname.split('.')[0] || 'uihahglfncxadigplxnw'
  } catch {
    return 'uihahglfncxadigplxnw'
  }
})()

/** The cookie name Supabase used before, which only enconvo.com itself is told to forget. */
export const LEGACY_AUTH_COOKIE = `sb-${projectRef}-auth-token`

/** __Host- needs Secure, so a development server over http keeps the plain name. */
const SECURE = process.env.NODE_ENV === 'production'

export const AUTH_COOKIE = SECURE ? `__Host-${LEGACY_AUTH_COOKIE}` : LEGACY_AUTH_COOKIE

/** What every Supabase client here passes as cookieOptions: host-only, Path=/, Secure in production. */
export const authCookieOptions = {
  name: AUTH_COOKIE,
  path: '/',
  sameSite: 'lax' as const,
  secure: SECURE,
  domain: '',
  maxAge: 60 * 60 * 24 * 365,
}

/** Clears the old cookie on this host once, so it stops riding along on every request. */
export function forgetLegacyAuthCookie() {
  if (typeof document === 'undefined' || AUTH_COOKIE === LEGACY_AUTH_COOKIE) return
  if (!document.cookie.split(';').some((part) => part.trim().startsWith(`${LEGACY_AUTH_COOKIE}=`))) return
  document.cookie = `${LEGACY_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}
