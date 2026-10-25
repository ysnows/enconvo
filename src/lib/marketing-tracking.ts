import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { captureMarketingReferral } from './marketing-attribution'
import { trackEvent } from './analytics'

let initialEntryCaptured = false

export function useMarketingTracking(enabled: boolean) {
  const router = useRouter()
  useEffect(() => {
    // Only with the visitor's consent to marketing cookies (lib/cookie-consent).
    if (!enabled || !router.isReady || initialEntryCaptured) return
    initialEntryCaptured = true
    if (captureMarketingReferral()) {
      trackEvent('website_referral_landed', {}, { includePagePath: false })
    }
  }, [enabled, router.isReady])
}
