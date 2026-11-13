import { useEffect } from 'react'
import { isAppDownloadLink } from '@/lib/affiliate-journey'
import { hasConsent } from '@/lib/cookie-consent'

// The X (Twitter) conversion pixel for the X Ads account. It counts landing-page visits and app
// download clicks as conversions of the ads that brought the visitor. It is advertising tracking,
// so it loads only after the visitor allows marketing cookies (lib/cookie-consent), and records
// nothing once they withdraw.

export const X_PIXEL_ID = 'riq3w'
/** The "Download click" event in the X Events manager. */
const X_DOWNLOAD_EVENT = 'tw-riq3w-rj009'

declare global {
  interface Window {
    twq?: (...args: unknown[]) => void
  }
}

/** The pixel's base code, as X's Events manager gives it. */
export const X_PIXEL_SNIPPET = `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${X_PIXEL_ID}');`

/** Report an app download click to X, when the visitor allows marketing and the pixel loaded. */
export function trackXDownload() {
  if (typeof window === 'undefined' || !hasConsent('marketing')) return
  try {
    window.twq?.('event', X_DOWNLOAD_EVENT, {})
  } catch {
    // Never block a download on the pixel.
  }
}

/** While marketing is allowed, every click on a link that downloads the app reports to X. */
export function useXPixelDownloads(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (link && isAppDownloadLink(link.getAttribute('href'))) trackXDownload()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [enabled])
}
