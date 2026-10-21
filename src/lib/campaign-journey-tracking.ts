import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import { isAppDownloadLink } from '@/lib/affiliate-journey'
import { campaignUtm, readCampaignVisitor, recordCampaignVisit, reportCampaignDownload, reportCampaignPage, reportCampaignSignIn, retryPendingCampaignVisit } from '@/lib/campaign-journey'

// Sign-in, OAuth callback and private links are never where a campaign link lands: their visit
// isn't recorded, though a sign-in on them still is (the app's sign-in opens `/login?from=app`).
const NO_VISIT = /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?(?:auth|login|register|reset_password|device|share)(?:\/|$)/

/**
 * The website's Campaign journey hook, mounted once in `_app`. A page opened with a valid
 * `utm_source` records the visit; any other page of a browser carrying a journey records a page
 * step (and first sends again a visit that didn't get through). A click on a link that downloads
 * the app records the download step. Once the browser carries a journey, its Supabase session
 * (the existing one, then every SIGNED_IN) is reported so the Worker can record the signup or
 * sign-in. Supabase loads only for a browser with a journey.
 */
export function useCampaignJourney() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    let listening = false
    let unsubscribe: (() => void) | null = null
    let reportSession: (() => Promise<void>) | null = null
    let lastVisit = ''

    const listen = () => {
      if (listening || cancelled || !readCampaignVisitor()) return
      listening = true
      import('@/lib/supabase')
        .then(({ supabase }) => {
          if (cancelled) return
          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') void reportCampaignSignIn(session?.access_token, session?.user?.id)
          })
          unsubscribe = () => data.subscription.unsubscribe()
          reportSession = () => supabase.auth.getSession().then(({ data: { session } }) => {
            if (!cancelled) void reportCampaignSignIn(session?.access_token, session?.user?.id)
          })
          return reportSession()
        })
        .catch(() => {})
    }
    // A visit that got through late: report the session again, since the first report found no journey.
    const retry = () => retryPendingCampaignVisit()
      .then(recorded => (recorded ? reportSession?.() : undefined))
      .catch(() => null)

    const onPage = () => {
      const { pathname, search } = window.location
      // A dynamic route reports its pattern: its segment can be an invite, redemption or share code.
      const path = Router.pathname.includes('[') ? Router.pathname : pathname
      const utm = NO_VISIT.test(pathname) ? null : campaignUtm(new URLSearchParams(search))
      const page = utm ? `${pathname}?${Object.values(utm).join('|')}` : ''
      // The visit is stored before the page or session is reported, so they find the journey.
      if (!utm || page === lastVisit) {
        return void retry()
          .then(() => reportCampaignPage(path))
          .then(listen)
      }
      lastVisit = page
      recordCampaignVisit(utm, path).catch(() => null).then(listen)
    }
    const onOnline = () => void retry()
    // Every download button on the site is a link to the Worker's `/app/download`; the pricing
    // section's free plan, which navigates from script, reports the step itself.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (link && isAppDownloadLink(link.getAttribute('href'))) reportCampaignDownload()
    }

    onPage()
    router.events.on('routeChangeComplete', onPage)
    window.addEventListener('online', onOnline)
    document.addEventListener('click', onClick, true)
    return () => {
      cancelled = true
      router.events.off('routeChangeComplete', onPage)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('click', onClick, true)
      unsubscribe?.()
    }
    // `router.events` is one emitter for the app's lifetime; `Router.pathname` is the live route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
