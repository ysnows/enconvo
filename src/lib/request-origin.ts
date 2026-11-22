import type { NextApiRequest } from 'next'

// Sites published from Enconvo are served at <name>.site.enconvo.com, which browsers count as the same
// site as enconvo.com, so the SameSite=Lax sign-in cookie rides along on a POST a page there sends here.
// A route that signs the visitor in from that cookie answers only requests that come from enconvo.com
// itself: the site's two addresses, or the address the request was sent to (a preview or a local server).

const SITE_ORIGINS = new Set(
  [
    'https://www.enconvo.com',
    'https://enconvo.com',
    (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').origin
      } catch {
        return null
      }
    })(),
  ].filter(Boolean)
)

/** Methods that change nothing: a page elsewhere can't read their answers, so they need no check. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/**
 * Whether a request that changes something came from a page outside enconvo.com. Only routes that
 * read the sign-in cookie need it: a request carrying its own Authorization header can't be forged
 * by another page.
 */
export function isForeignOrigin(req: NextApiRequest): boolean {
  if (SAFE_METHODS.has((req.method ?? 'GET').toUpperCase())) return false
  const origin = first(req.headers.origin)
  if (origin === undefined) {
    // Browsers send Origin with every POST. Without one, Fetch Metadata still names a page's request;
    // a client with neither is no browser, so it holds no visitor's cookie to misuse.
    const site = first(req.headers['sec-fetch-site'])
    return site !== undefined && site !== 'same-origin' && site !== 'none'
  }
  if (SITE_ORIGINS.has(origin)) return false
  let host: string
  try {
    // "null" (a sandboxed frame, a redirect across sites) and malformed values throw here.
    host = new URL(origin).host.toLowerCase()
  } catch {
    return true
  }
  return ![req.headers.host, first(req.headers['x-forwarded-host'])].some(
    (own) => own?.toLowerCase() === host
  )
}
