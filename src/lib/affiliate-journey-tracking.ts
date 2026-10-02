import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { affiliateCode, readAffiliateJourney, recordAffiliateVisit, reportAffiliateSignIn } from '@/lib/affiliate-journey'

/**
 * The website's Affiliate journey hook, mounted once in `_app`. A page opened with a
 * `?via=` code records the visit. Once the browser carries a journey, its Supabase
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
          return supabase.auth.getSession().then(({ data: { session } }) => {
            if (!cancelled) void reportAffiliateSignIn(session?.access_token, session?.user?.id)
          })
        })
        .catch(() => {})
    }

    const onPage = () => {
      const via = affiliateCode(new URLSearchParams(window.location.search).get('via'))
      const page = via ? `${window.location.pathname}?via=${via}` : ''
      if (!via || page === lastVisit) return listen()
      lastVisit = page
      // The visit is stored before the session is reported, so the report finds the journey.
      recordAffiliateVisit(via).catch(() => null).then(listen)
    }

    onPage()
    router.events.on('routeChangeComplete', onPage)
    return () => {
      cancelled = true
      router.events.off('routeChangeComplete', onPage)
      unsubscribe?.()
    }
    // `router.events` is one emitter for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
