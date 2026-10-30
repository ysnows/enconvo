type AuthQuery = Record<string, string | string[] | undefined>
const value = (entry: string | string[] | undefined) =>
  Array.isArray(entry) ? entry[0] : entry

/** Only the Affiliate portal's own local destinations opt into its sign-in flow. */
export function affiliateReturnPath(query: AuthQuery): string | null {
  const path = value(query.returnUrl)
  if (!path || /[\\\u0000-\u001f]/.test(path)) return null
  return /^\/affiliate(?:\/dashboard)?(?:[?#]|$)/.test(path) ? path : null
}

/** Keep the native return destination across registration and password reset. */
export function authFlowHref(path: string, query: AuthQuery) {
  const params = new URLSearchParams()
  for (const key of ['from', 'source', 'handoff', 'returnUrl', 'language']) {
    const entry = value(query[key])
    if (entry) params.set(key, entry)
  }
  const encoded = params.toString()
  return `${path}${encoded ? `?${encoded}` : ''}`
}

/** Where Google sends the user back, keeping the native return destination so the app still opens. */
export function oauthCallbackUrl(
  origin: string,
  query: AuthQuery,
  language: string
) {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('language', language)
  // A bare path isn't a valid OAuth redirect, so the callback carries a local returnUrl on.
  const returnUrl = value(query.returnUrl)
  if (returnUrl?.startsWith('/')) url.searchParams.set('returnUrl', returnUrl)
  for (const key of ['from', 'source', 'handoff']) {
    const entry = value(query[key])
    if (entry) url.searchParams.set(key, entry)
  }
  return url.toString()
}

const EMAIL_LINK_KEYS = new Set(['token_hash', 'type', 'redirect_to'])

/**
 * Where an email's /auth/confirm link goes once it has signed in: the redirect the sign-up or
 * password reset asked for (`redirect_to`, the templates' `{{ .RedirectTo }}`), on this site
 * only, else the page for the link's type. Pasted from the email's text, the link arrives with
 * the redirect's own query unescaped and split into ours, so those keys go back onto it.
 */
export function emailLinkDestination(search: string, origin: string) {
  const params = new URLSearchParams(search)
  const fallback =
    params.get('type') === 'recovery' ? '/reset_password' : '/login'
  let target: URL
  try {
    target = new URL(params.get('redirect_to') || fallback, origin)
  } catch {
    target = new URL(fallback, origin)
  }
  // The Site URL stands in for a redirect Supabase didn't allow; it has nothing to continue.
  // A path that starts with `//` would leave the site once it is the only part kept.
  if (
    target.origin !== origin ||
    target.pathname === '/' ||
    target.pathname.startsWith('//')
  )
    target = new URL(fallback, origin)
  params.forEach((value, key) => {
    if (!EMAIL_LINK_KEYS.has(key) && !target.searchParams.has(key))
      target.searchParams.append(key, value)
  })
  return `${target.pathname}${target.search}`
}
