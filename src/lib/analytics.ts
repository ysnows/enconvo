// Named GA4 conversion events, so SEO work can be judged by downloads and
// checkouts per landing page instead of by traffic alone.

type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      ...params,
      page_path: window.location.pathname,
      // Beacon transport survives the navigation that usually follows a CTA click.
      transport_type: 'beacon',
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload)
      return
    }
    // gtag.js is loaded afterInteractive and reads Arguments objects from the
    // dataLayer, so queue the event the same way the GA snippet does.
    const dataLayer = (window.dataLayer = window.dataLayer || [])
    const queue = function (..._args: unknown[]) {
      dataLayer.push(arguments)
    }
    queue('event', name, payload)
  } catch {
    // Analytics must never block a download or checkout.
  }
}
