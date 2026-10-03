import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { affiliateCode, affiliateSub, isAppDownloadLink, readAffiliateJourney, recordAffiliateVisit, reportAffiliateDownload, reportAffiliateSignIn, retryPendingAffiliateVisit } from '@/lib/affiliate-journey'

/**
 * The website's Affiliate journey hook, mounted once in `_app`. A page opened with a
 * `?via=` code records the visit, with the link's `?sub=` sub ID if it has one; any other page (or
 * coming back online) sends again a visit that didn't get through. A click on a link that downloads the app
 * records the download step. Once the browser carries a journey, its Supabase
 * session (the existing one, then every SIGNED_IN: password, sign-up, OAuth callback)
 * is reported so the Worker can record the signup or sign-in. Supabase loads only for
 * a browser with a journey.
 */
export function useAffiliateJourney() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    let listening = false
    let unsubscribe: (() => void) | null = null
    let reportSession: (() => Promise<void>) | null = null
    let lastVisit = ''

    const listen = () => {
      if (listening || cancelled || !readAffiliateJourney()) return
      listening = true
      import('@/lib/supabase')
        .then(({ supabase }) => {
          if (cancelled) return
          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') void reportAffiliateSignIn(session?.access_token, session?.user?.id)
          })
          unsubscribe = () => data.subscription.unsubscribe()
          reportSession = () => supabase.auth.getSession().then(({ data: { session } }) => {
            if (!cancelled) void reportAffiliateSignIn(session?.access_token, session?.user?.id)
          })
          return reportSession()
        })
        .catch(() => {})
    }
    // A visit that got through late: report the session again, since the first report found no journey.
    const retry = () => retryPendingAffiliateVisit()
      .then(recorded => (recorded ? reportSession?.() : undefined))
      .catch(() => null)

    const onPage = () => {
      const params = new URLSearchParams(window.location.search)
      const via = affiliateCode(params.get('via'))
      const sub = affiliateSub(params.get('sub'))
      const page = via ? `${window.location.pathname}?via=${via}&sub=${sub ?? ''}` : ''
      // The visit is stored before the session is reported, so the report finds the journey.
      if (!via || page === lastVisit) return void retry().then(listen)
      lastVisit = page
      recordAffiliateVisit(via, sub).catch(() => null).then(listen)
    }
    const onOnline = () => void retry()
    // Every download button on the site is a link to the Worker's `/app/download`; the pricing
    // section's free plan, which navigates from script, reports the step itself.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (link && isAppDownloadLink(link.getAttribute('href'))) reportAffiliateDownload()
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
    // `router.events` is one emitter for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
