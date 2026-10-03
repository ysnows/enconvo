import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { useState } from 'react'
import { type AffiliateVisit } from '@/lib/affiliate-program'
import { card, Pill } from './ui'

// The latest visits through the Affiliate link (ADR 0090), so an Affiliate can open a link it just
// shared and see the visit arrive. Visits keep only the referring host, the landing path and the
// sub ID, never who it was.

const SHOWN = 8

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** "Just now", "12 min ago" or "3 h ago" for the last day, then the date and time. */
function ago(value: string, now: number, locale = 'en') {
  const elapsed = now - new Date(value).getTime()
  if (elapsed < MINUTE) return 'Just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`
  if (elapsed < 24 * HOUR) return `${Math.floor(elapsed / HOUR)} h ago`
  return new Date(value).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const exact = (value: string, locale = 'en') =>
  new Date(value).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

/** The visits, newest first; nothing until the link has one. */
export function LatestVisits({ visits }: { visits: AffiliateVisit[] }) {
  const { t, locale } = useI18n()

  const [all, setAll] = useState(false)
  if (visits.length === 0) return null
  const now = Date.now()
  const shown = all ? visits : visits.slice(0, SHOWN)
  return (
    <section className={`${card} p-6`} aria-labelledby="latest-visits">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="latest-visits" className="text-lg font-semibold text-content">
          {t('Latest visits')}
        </h2>
        <span className="text-xs text-content-muted">{t('Newest first')}</span>
      </div>
      <div
        className="mt-4 hidden grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)_7rem] gap-3 border-b border-hairline pb-2 text-xs font-medium uppercase tracking-[0.08em] text-content-muted sm:grid"
        aria-hidden="true"
      >
        <span>{t('When')}</span>
        <span>{t('Site')}</span>
        <span>{t('Page')}</span>
        <span>{t('Sub ID')}</span>
      </div>
      <ol className="mt-3 divide-y divide-hairline sm:mt-0">
        {shown.map((visit, index) => (
          <li
            key={`${visit.at}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2.5 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)_7rem]"
          >
            <time
              dateTime={visit.at}
              title={exact(visit.at, locale)}
              className="order-2 text-right text-xs text-content-muted sm:order-none sm:text-left sm:text-sm"
            >
              {t(ago(visit.at, now, locale))}
            </time>
            <span className="order-1 flex min-w-0 items-center gap-2 sm:order-none">
              <span
                className={`truncate ${
                  visit.referrer ? 'text-content' : 'text-content-muted'
                }`}
                title={visit.referrer ?? undefined}
              >
                {visit.referrer ?? t('Direct or unknown')}
              </span>
              {visit.returning && <Pill tone="gray">{t('Returning')}</Pill>}
            </span>
            <span
              className="order-3 truncate font-mono text-xs text-content-body sm:order-none sm:text-sm"
              title={visit.path ?? undefined}
            >
              {visit.path ?? t('Unknown page')}
            </span>
            <span className="order-4 min-w-0 max-w-[7rem] justify-self-end text-right sm:order-none sm:max-w-none sm:justify-self-auto sm:text-left">
              {visit.sub ? (
                <span
                  className="block truncate font-mono text-xs text-content-body sm:text-sm"
                  title={visit.sub}
                >
                  {visit.sub}
                </span>
              ) : (
                <span className="text-xs text-content-ash">
                  <span className="sr-only">{t('No sub ID')}</span>
                  <span aria-hidden="true">–</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {visits.length > SHOWN && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          aria-expanded={all}
          className="mt-2 min-h-[32px] text-sm font-medium text-signal-blue hover:underline"
        >
          {all ? t('Show fewer') : t('Show all {p0}', { p0: visits.length })}
        </button>
      )}
      <p className="mt-4 text-xs leading-5 text-content-ash">
        <I18nText
          source={
            'The last {p0} through your link. Open your link yourself and reload this page to check that it works: your own visit shows up here too. Only the site and the page are kept, never who it was.'
          }
          values={{
            p0:
              visits.length === 1
                ? t('visit')
                : t('{p0} visits', { p0: visits.length }),
          }}
        />
      </p>
    </section>
  )
}
