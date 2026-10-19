import dynamic from 'next/dynamic'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { getWelcomeOfferState, subscribeWelcomeOffer } from '@/lib/welcome-offer'

const loadDialog = () => import('@/components/WelcomeOfferDialog')
const WelcomeOfferDialog = dynamic(loadDialog, { ssr: false })

/** A popup that opens on its own waits this long after the page has loaded. */
const SETTLE_MS = 700
/** A page still loading after this long gets the popup anyway. */
const LOAD_LIMIT_MS = 2500

let settled: Promise<void> | null = null

/** Resolves once the page has loaded and sat still for a moment; later calls resolve at once. */
function pageSettled(): Promise<void> {
  settled ??= new Promise<void>((resolve) => {
    const wait = () => {
      const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const since = navigation?.loadEventEnd ? performance.now() - navigation.loadEventEnd : 0
      window.setTimeout(resolve, Math.max(0, SETTLE_MS - since))
    }
    if (document.readyState === 'complete') return wait()
    const loaded = () => {
      window.clearTimeout(limit)
      window.removeEventListener('load', loaded)
      wait()
    }
    const limit = window.setTimeout(loaded, LOAD_LIMIT_MS)
    window.addEventListener('load', loaded)
  })
  return settled
}

/** The Welcome offer popup, mounted once in `_app`; its code loads only when it opens. */
export function WelcomeOffer() {
  const state = useSyncExternalStore(subscribeWelcomeOffer, getWelcomeOfferState, () => null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!state || ready) return
    let live = true
    // Fetch the popup's code while the page settles, so it opens on time.
    void loadDialog()
    void pageSettled().then(() => live && setReady(true))
    return () => {
      live = false
    }
  }, [state, ready])
  return state && ready ? <WelcomeOfferDialog state={state} /> : null
}
