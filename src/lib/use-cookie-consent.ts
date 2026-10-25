import { useEffect, useState } from 'react'
import {
  onCookieConsentChange,
  readCookieConsent,
  type CookieConsent,
} from './cookie-consent'

/**
 * The visitor's choice (lib/cookie-consent), kept current. `ready` is false on the server and the
 * first client render, so nothing optional starts before the cookie is read.
 */
export function useCookieConsent(): {
  ready: boolean
  consent: CookieConsent | null
} {
  const [state, setState] = useState<{
    ready: boolean
    consent: CookieConsent | null
  }>({
    ready: false,
    consent: null,
  })
  useEffect(() => {
    const update = () => setState({ ready: true, consent: readCookieConsent() })
    update()
    return onCookieConsentChange(update)
  }, [])
  return state
}
