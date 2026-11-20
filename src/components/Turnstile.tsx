// Cloudflare Turnstile, the human check Supabase Auth asks for on sign-up, password sign-in, password reset
// and resent emails (its CAPTCHA protection). Cloudflare's own script draws the widget; nothing else is
// installed. The widget runs its check as it appears and shows itself only when the visitor has to act
// (`interaction-only`), so most people never see it.
//
// A token works once: call `reset()` after every request that sent one, and the widget fetches the next.
// Without NEXT_PUBLIC_TURNSTILE_SITE_KEY (local builds) the widget draws nothing and `token()` gives
// undefined, so requests go out without a token, as before.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useI18n } from '@/i18n/I18nProvider'

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
// How long a submit waits for the check to finish before saying it couldn't. The wait pauses while
// the widget waits for the visitor to act.
const TOKEN_WAIT_MS = 30_000

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptLoad: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptLoad)
    scriptLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () =>
        window.turnstile
          ? resolve(window.turnstile)
          : reject(new CaptchaError('unavailable'))
      script.onerror = () => {
        // A later widget tries the download again.
        scriptLoad = null
        script.remove()
        reject(new CaptchaError('unavailable'))
      }
      document.head.appendChild(script)
    })
  return scriptLoad
}

/** The check couldn't give a token: Cloudflare unreachable, the check failed, or it took too long. */
export class CaptchaError extends Error {
  constructor(readonly reason: 'unavailable' | 'failed' | 'timeout') {
    super(`captcha ${reason}`)
  }
}

export type CaptchaHandle = {
  /** The current token, waiting for the check if it hasn't finished; undefined when no site key is set. Throws CaptchaError. */
  token(): Promise<string | undefined>
  /** Drops the token (after a request used it) and runs the check again. */
  reset(): void
}

// Turnstile's language codes for the site's locales; any other uses the browser's language.
const TURNSTILE_LANGUAGES: Record<string, string> = {
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  pt: 'pt-br',
}

type Waiter = {
  resolve(token: string): void
  reject(error: CaptchaError): void
  timer?: ReturnType<typeof setTimeout>
}

export const Turnstile = forwardRef<
  CaptchaHandle,
  { action: string; className?: string }
>(function Turnstile({ action, className }, ref) {
  const { t, locale } = useI18n()
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const token = useRef<string | null>(null)
  const failure = useRef<CaptchaError | null>(null)
  const waiters = useRef<Waiter[]>([])
  // The widget shows its checkbox and waits for the visitor.
  const interactive = useRef(false)
  // A submit is waiting on that checkbox: say so under it.
  const [asking, setAsking] = useState(false)

  const showAsking = () =>
    setAsking(interactive.current && waiters.current.length > 0)

  const startTimer = (waiter: Waiter) => {
    clearTimeout(waiter.timer)
    waiter.timer = setTimeout(() => {
      waiters.current = waiters.current.filter((w) => w !== waiter)
      showAsking()
      waiter.reject(new CaptchaError('timeout'))
    }, TOKEN_WAIT_MS)
  }

  const settle = (value: string | CaptchaError) => {
    const pending = waiters.current
    waiters.current = []
    showAsking()
    for (const waiter of pending) {
      clearTimeout(waiter.timer)
      typeof value === 'string' ? waiter.resolve(value) : waiter.reject(value)
    }
  }

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !container.current) return
    let cancelled = false
    loadTurnstile().then(
      (api) => {
        if (cancelled || !container.current) return
        const id = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'dark',
          size: 'flexible',
          appearance: 'interaction-only',
          language: TURNSTILE_LANGUAGES[locale] ?? (locale || 'auto'),
          callback: (value: string) => {
            token.current = value
            failure.current = null
            settle(value)
          },
          'expired-callback': () => {
            token.current = null
          },
          // A person has to tick the box: no time limit while it waits for them.
          'before-interactive-callback': () => {
            interactive.current = true
            for (const waiter of waiters.current) clearTimeout(waiter.timer)
            showAsking()
          },
          'after-interactive-callback': () => {
            interactive.current = false
            for (const waiter of waiters.current) startTimer(waiter)
            showAsking()
          },
          'timeout-callback': () => {
            token.current = null
          },
          'error-callback': () => {
            token.current = null
            interactive.current = false
            failure.current = new CaptchaError('failed')
            settle(failure.current)
            // Handled here, so Turnstile doesn't throw; it retries on its own.
            return true
          },
        })
        widget.current = { api, id }
      },
      (error: CaptchaError) => {
        failure.current = error
        settle(error)
      }
    )
    return () => {
      cancelled = true
      if (widget.current) widget.current.api.remove(widget.current.id)
      widget.current = null
      token.current = null
      interactive.current = false
    }
  }, [action, locale])

  useImperativeHandle(
    ref,
    () => ({
      async token() {
        if (!TURNSTILE_SITE_KEY) return undefined
        if (token.current) return token.current
        if (failure.current) {
          // Try once more for this submit.
          const failed = failure.current
          failure.current = null
          if (!widget.current) throw failed
          interactive.current = false
          widget.current.api.reset(widget.current.id)
        }
        return new Promise<string>((resolve, reject) => {
          const waiter: Waiter = { resolve, reject }
          if (!interactive.current) startTimer(waiter)
          waiters.current.push(waiter)
          showAsking()
        })
      },
      reset() {
        token.current = null
        failure.current = null
        // The check starts over; it says again if it needs the visitor.
        interactive.current = false
        if (widget.current) widget.current.api.reset(widget.current.id)
      },
    }),
    []
  )

  if (!TURNSTILE_SITE_KEY) return null
  // The flexible widget is at least 300px wide; centred, it can reach a little past a narrow form's padding.
  return (
    <>
      <div
        ref={container}
        className={`flex justify-center empty:hidden ${className ?? ''}`}
      />
      {asking && (
        <p
          role="status"
          className="mt-2 text-center text-[12px] leading-4 text-[#AAAAAA]"
        >
          {t('Complete the security check to continue.')}
        </p>
      )}
    </>
  )
})
