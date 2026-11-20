import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useI18n } from '@/i18n/I18nProvider'
import { localizePath } from '@/i18n/locale'
import { trackEvent } from '@/lib/analytics'
import { lifetimeSale, type LifetimeSale } from '@/lib/lifetime-pricing'
import sale from '@/styles/Sale.module.css'

const SALE_TIME_ZONE = 'America/Los_Angeles'

/** When the site was built (next.config.js), for pages that don't pass their own render time. */
export const SITE_BUILT_AT = Number(process.env.SITE_BUILT_AT) || 0

/**
 * The lifetime sale running now. The first render judges it at `renderedAt` (the static page's
 * time) so the server and the browser agree; then the visitor's clock, checked each minute. It
 * changes, and re-renders its component, only when a sale starts or ends.
 */
export function useLifetimeSaleNow(renderedAt: number) {
  const [current, setCurrent] = useState(() => lifetimeSale(renderedAt))
  useEffect(() => {
    const check = () => setCurrent(lifetimeSale(Date.now()))
    check()
    const id = window.setInterval(check, 60_000)
    return () => window.clearInterval(id)
  }, [])
  return current
}

/**
 * A ticking clock for a countdown. `live` turns true once the visitor's clock has replaced
 * `renderedAt`, which can be an hour old on a cached page, so a countdown shows no stale figures.
 */
function useSaleClock(renderedAt: number, tickMs: number) {
  const [now, setNow] = useState(renderedAt)
  const [live, setLive] = useState(false)
  useEffect(() => {
    setNow(Date.now())
    setLive(true)
    const id = window.setInterval(() => setNow(Date.now()), tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])
  return { now, live }
}

/** What is left of the sale, in whole days, hours, minutes and seconds. */
export function saleRemaining(sale: LifetimeSale, now: number) {
  const left = Math.max(0, Math.floor((Date.parse(sale.until) - now) / 1000))
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  }
}

/** The sale's last day in Los Angeles, as the locale writes a date ("November 30"). */
export function saleLastDay(
  sale: LifetimeSale,
  locale: string,
  withTime = false
) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    timeZone: SALE_TIME_ZONE,
    ...(withTime
      ? { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }
      : {}),
  } as Intl.DateTimeFormatOptions).format(Date.parse(sale.until) - 60_000)
}

function TagIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14m0 0-5-5m5 5-5 5" />
    </svg>
  )
}

/**
 * The strip above the site nav while a sale runs: what, how long, and a way in. It keeps its
 * own clock (a minute's precision is enough here), so the page around it never re-renders.
 * `data-sale-bar` lets anchor jumps clear it (tailwind.css).
 */
export function SaleBar({
  sale: current,
  renderedAt,
}: {
  sale: LifetimeSale
  renderedAt: number
}) {
  const { t, locale } = useI18n()
  const { now, live } = useSaleClock(renderedAt, 20_000)
  const left = saleRemaining(current, now)
  const ends = t('Ends in {p0}d {p1}h {p2}m', {
    p0: left.days,
    p1: left.hours,
    p2: left.minutes,
  })
  return (
    <div className={sale.bar} data-sale-bar>
      <span className={sale.barLead}>
        <span className={sale.barName}>
          <TagIcon />
          {t('Black Friday')}
        </span>
        <span className={sale.barOffer}>
          {t('{p0}% off Lifetime and Cloud', { p0: current.percentOff })}
        </span>
        <span className={sale.barDot} aria-hidden="true" />
        <span className={clsx(sale.barTime, !live && sale.pending)}>
          {ends}
        </span>
      </span>
      <a
        className={sale.barLink}
        href={localizePath('/#pricing', locale)}
        onClick={() =>
          trackEvent('sale_click', {
            placement: 'bar',
            campaign: current.campaign,
          })
        }
      >
        {t('Get the deal')}
        <ArrowIcon />
      </a>
    </div>
  )
}

/** The pill above the hero headline while a sale runs. */
export function SalePill({ sale: current }: { sale: LifetimeSale }) {
  const { t, locale } = useI18n()
  return (
    <div className={sale.pillRow}>
      <a
        className={sale.pill}
        href={localizePath('/#pricing', locale)}
        onClick={() =>
          trackEvent('sale_click', {
            placement: 'hero',
            campaign: current.campaign,
          })
        }
      >
        <b>{t('Black Friday')}</b>
        <span>
          {t('{p0}% off Lifetime and Cloud', { p0: current.percentOff })}
        </span>
        <ArrowIcon />
      </a>
    </div>
  )
}

/** Days, hours, minutes and seconds to the sale's end, with the end written out. */
export function SaleCountdown({
  sale: current,
  renderedAt,
}: {
  sale: LifetimeSale
  renderedAt: number
}) {
  const { t, locale } = useI18n()
  const { now, live } = useSaleClock(renderedAt, 1000)
  const left = saleRemaining(current, now)
  const units: [number, string][] = [
    [left.days, t('days')],
    [left.hours, t('hours')],
    [left.minutes, t('minutes')],
    [left.seconds, t('seconds')],
  ]
  const endsAt = t('Ends {p0}', { p0: saleLastDay(current, locale, true) })
  return (
    <div className={sale.countdown} data-reveal>
      <div
        className={clsx(sale.boxes, !live && sale.pending)}
        role="timer"
        aria-label={endsAt}
      >
        {units.map(([value, label], i) => (
          <div key={i} className={clsx(sale.box, i === 3 && sale.boxLast)}>
            <b>{String(value).padStart(2, '0')}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {/* Written out after load, so the server's and the browser's time formats never differ. */}
      <p className={sale.endsAt}>{live ? endsAt : ' '}</p>
    </div>
  )
}
