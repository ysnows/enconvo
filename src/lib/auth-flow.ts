type AuthQuery = Record<string, string | string[] | undefined>
const value = (entry: string | string[] | undefined) => Array.isArray(entry) ? entry[0] : entry

export const isCompanionFlow = (query: AuthQuery) => value(query.source) === 'companion'

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
