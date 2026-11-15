import { useEffect } from 'react'
import { WORKER_API_ORIGIN } from '@/lib/worker-api'

// The Google Ads conversion tag for account 531-033-9462. It counts app download clicks as
// conversions of the ads that brought the visitor, one conversion action per platform so each
// platform's cost per download shows on its own. It is advertising tracking, so it loads only
// after the visitor allows marketing cookies (lib/cookie-consent), through Consent Mode v2, and
// records nothing once they withdraw. Ad personalization (remarketing lists) stays denied.
//
// The actions are "Download - Mac", "Download - Windows", "Download - Linux" and "Download - Android"
// (goal: Sign-up). Without an ID nothing loads; a platform whose label is empty sends nothing.

/** The account's Google tag ID, "AW-" and digits, from Google Ads › Goals › Conversions. */
export const GOOGLE_ADS_ID = 'AW-18575912746'

export type DownloadPlatform = 'mac' | 'windows' | 'linux' | 'android'

/** The conversion label of each platform's "Download" conversion action (the part after the slash). */
const DOWNLOAD_LABELS: Record<DownloadPlatform, string> = {
  mac: 'gjszCKu2zLgdEKre15lF',
  windows: 'lNXlCK62zLgdEKre15lF',
  linux: 'leU7CLG2zLgdEKre15lF',
  android: '36RACLS2zLgdEKre15lF',
}

const GOOGLE_PLAY_APP_ID = 'com.enconvo.companion'

export const googleAdsEnabled = () => /^AW-\d+$/.test(GOOGLE_ADS_ID)

/** Which app a link downloads, or null when it downloads none. */
export function downloadPlatformOf(
  href: string | null | undefined
): DownloadPlatform | null {
  if (!href) return null
  try {
    const url = new URL(href, location.href)
    // The Mac app, from the Worker (the home page, the download page, offers).
    if (url.origin === WORKER_API_ORIGIN && url.pathname === '/app/download') {
      const platform = url.searchParams.get('platform')
      if (!platform || platform === 'darwin') return 'mac'
      if (platform.startsWith('win')) return 'windows'
      if (platform === 'linux') return 'linux'
      return null
    }
    // The Windows and Linux Betas, through this site's newest-Beta redirect.
    if (
      url.origin === location.origin &&
      url.pathname === '/api/desktop-download'
    ) {
      const platform = url.searchParams.get('platform')
      return platform === 'windows' || platform === 'linux' ? platform : null
    }
    // The Android app on Google Play.
    if (
      url.hostname === 'play.google.com' &&
      url.searchParams.get('id') === GOOGLE_PLAY_APP_ID
    )
      return 'android'
  } catch {
    // Not a URL.
  }
  return null
}

function gtagQueue(): (...args: unknown[]) => void {
  const w = window as Window
  w.dataLayer = w.dataLayer || []
  if (typeof w.gtag !== 'function') {
    // The same queue function Google's snippet defines: gtag.js reads Arguments objects.
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    }
  }
  return w.gtag!
}

/** Report an app download click to Google Ads, when the tag is set up and marketing is allowed. */
function trackGoogleAdsDownload(platform: DownloadPlatform) {
  const label = DOWNLOAD_LABELS[platform]
  if (!googleAdsEnabled() || !label) return
  try {
    gtagQueue()('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      transport_type: 'beacon',
    })
  } catch {
    // Never block a download on the tag.
  }
}

let configured = false

/**
 * While marketing is allowed: loads the Google tag (or reuses the one Google Analytics loaded),
 * grants ad storage through Consent Mode, and reports every app download click. When marketing
 * is withdrawn, consent goes back to denied; lib/cookie-consent removes the `_gcl` cookies.
 */
export function useGoogleAdsDownloads(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !googleAdsEnabled()) return
    const gtag = gtagQueue()
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'denied',
    })
    if (!configured) {
      configured = true
      if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`
        document.head.appendChild(script)
        gtag('js', new Date())
      }
      gtag('config', GOOGLE_ADS_ID, { allow_ad_personalization_signals: false })
    }

    const onClick = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest('a[href]') : null
      const platform = link ? downloadPlatformOf(link.getAttribute('href')) : null
      if (platform) trackGoogleAdsDownload(platform)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      try {
        gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied' })
      } catch {
        // Nothing loaded.
      }
    }
  }, [enabled])
}
