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
