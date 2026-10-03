import { NextResponse, type NextRequest } from 'next/server'
import { getLocale, localizePath } from './i18n/locale'

/** The trial-code Worker uses existing, unprefixed Stripe return paths. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams, locale, search } = request.nextUrl
  const trialReturn =
    pathname === '/pay_success' && searchParams.get('from') === 'trial_code'
  const trialCancel =
    /^\/redeem\/[^/]+$/.test(pathname) &&
    searchParams.get('canceled') === 'true'
  const preferred = getLocale(request.cookies.get('NEXT_LOCALE')?.value)
  if ((trialReturn || trialCancel) && locale === 'en' && preferred !== 'en') {
    return NextResponse.redirect(
      new URL(localizePath(`${pathname}${search}`, preferred), request.url)
    )
  }
  return NextResponse.next()
}

export const config = { matcher: ['/pay_success', '/redeem/:path*'] }
