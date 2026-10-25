import { useI18n } from '@/i18n/I18nProvider'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  onCookieSettingsOpen,
  saveCookieConsent,
  type CookieConsent as Consent,
} from '@/lib/cookie-consent'

const OFFSET_VAR = '--cookie-banner-offset'

function Toggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-10 flex-none items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/70 disabled:cursor-not-allowed ${
        checked
          ? 'border-transparent bg-[#2563EB]'
          : 'border-hairline-strong bg-white/[0.06]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

/**
 * The cookie banner (lib/cookie-consent). It asks once, on any page but the private and app
 * hand-off ones, where nothing optional runs without a choice: one line with Reject and Accept,
 * which look the same, and a Settings link to the categories. The footer's and the Cookie
 * Policy's "Cookie settings" open the categories again anywhere. While it shows, the site's
 * toasts move up above it.
 */
export function CookieConsent({
  ready,
  consent,
  hidden,
}: {
  ready: boolean
  consent: Consent | null
  hidden: boolean
}) {
  const { t } = useI18n()
  const [reopened, setReopened] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const card = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      onCookieSettingsOpen(() => {
        const current = consent
        setAnalytics(current?.analytics ?? false)
        setMarketing(current?.marketing ?? false)
        setChoosing(true)
        setReopened(true)
      }),
    [consent]
  )

  const open = ready && (reopened || (!consent && !hidden))

  useEffect(() => {
    const root = document.documentElement
    const element = card.current
    if (!open || !element) {
      root.style.removeProperty(OFFSET_VAR)
      return
    }
    const measure = () =>
      root.style.setProperty(OFFSET_VAR, `${element.offsetHeight + 12}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
      root.style.removeProperty(OFFSET_VAR)
    }
  }, [open, choosing])

  if (!open) return null

  const save = (choice: { analytics: boolean; marketing: boolean }) => {
    saveCookieConsent(choice)
    setReopened(false)
    setChoosing(false)
  }

  const buttonClass =
    'inline-flex h-8 items-center justify-center rounded-[10px] px-3.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/70'
  // Reject and Accept look the same: declining must be as easy as agreeing.
  const decisionClass = `${buttonClass} bg-content text-canvas hover:bg-white`
  const quietClass = `${buttonClass} border border-hairline-strong bg-transparent text-content hover:bg-white/[0.06]`

  if (!choosing) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-center px-4 pb-4 sm:pb-6">
        <div
          ref={card}
          role="region"
          aria-label={t('Cookie consent')}
          className="pointer-events-auto flex w-full max-w-[720px] flex-col gap-3 rounded-[14px] border border-hairline-strong bg-surface-card/95 px-4 py-3 text-left shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-4"
        >
          <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-content-body">
            {t(
              'Optional cookies help us measure visits and credit partners who refer you. They stay off unless you accept.'
            )}{' '}
            <Link
              href="/cookies"
              className="whitespace-nowrap font-medium text-signal-blue hover:underline"
            >
              {t('Cookie Policy')}
            </Link>
          </p>
          <div className="flex flex-none items-center justify-end gap-2">
            <button
              type="button"
              className="mr-1 text-[13px] font-medium text-content-muted underline-offset-2 hover:text-content hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/70"
              onClick={() => {
                setAnalytics(false)
                setMarketing(false)
                setChoosing(true)
              }}
            >
              {t('Settings')}
            </button>
            <button
              type="button"
              className={decisionClass}
              onClick={() => save({ analytics: false, marketing: false })}
            >
              {t('Reject')}
            </button>
            <button
              type="button"
              className={decisionClass}
              onClick={() => save({ analytics: true, marketing: true })}
            >
              {t('Accept')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-center px-4 pb-4 sm:pb-6">
      <div
        ref={card}
        role="region"
        aria-label={t('Cookie consent')}
        className="pointer-events-auto w-full max-w-[560px] rounded-[18px] border border-hairline-strong bg-surface-card/95 p-4 text-left shadow-2xl backdrop-blur-md sm:p-5"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold leading-[22px] text-content">
            {t('Cookie settings')}
          </h2>
          <Link
            href="/cookies"
            className="text-[13px] font-medium text-signal-blue hover:underline"
          >
            {t('Cookie Policy')}
          </Link>
        </div>
        <ul role="list" className="mt-3 space-y-3">
          <li className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-content">
                {t('Strictly necessary')}
              </p>
              <p className="mt-0.5 text-[12px] leading-4 text-content-muted">
                {t(
                  'Sign-in, language, invites and offers you opened, and this choice. Always on.'
                )}
              </p>
            </div>
            <Toggle label={t('Strictly necessary')} checked disabled />
          </li>
          <li className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-content">
                {t('Analytics')}
              </p>
              <p className="mt-0.5 text-[12px] leading-4 text-content-muted">
                {t(
                  'Google Analytics counts visits, downloads and sign-ups, so we can tell which pages help. Google receives your IP address and a browser identifier.'
                )}
              </p>
            </div>
            <Toggle
              label={t('Analytics')}
              checked={analytics}
              onChange={setAnalytics}
            />
          </li>
          <li className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-content">
                {t('Marketing')}
              </p>
              <p className="mt-0.5 text-[12px] leading-4 text-content-muted">
                {t(
                  'Remembers which campaign or partner link brought you, for up to 90 days, so we can credit the partner and judge our campaigns.'
                )}
              </p>
            </div>
            <Toggle
              label={t('Marketing')}
              checked={marketing}
              onChange={setMarketing}
            />
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={quietClass}
            onClick={() => save({ analytics, marketing })}
          >
            {t('Save choices')}
          </button>
          <button
            type="button"
            className={decisionClass}
            onClick={() => save({ analytics: false, marketing: false })}
          >
            {t('Reject all')}
          </button>
          <button
            type="button"
            className={decisionClass}
            onClick={() => save({ analytics: true, marketing: true })}
          >
            {t('Accept all')}
          </button>
        </div>
      </div>
    </div>
  )
}
