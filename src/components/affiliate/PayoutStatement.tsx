import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import {
  downloadCsv,
  formatCents,
  formatDay,
  PAYOUT_METHOD_LABEL,
  planLabel,
  SUPPORT_EMAIL,
  toCsv,
  type AffiliatePayoutStatement,
} from '@/lib/affiliate-program'
import { dollars, isoDay, KIND_LABEL, signed } from './AffiliateTables'
import { card } from './ui'

// A payout statement: who was paid, how, and every commission, refund and adjustment the payout
// settled. On paper (or a saved PDF) it prints black on white, without the site around it. A payout
// Enconvo cancelled because the money never arrived keeps its statement, which then lists no entries:
// they went back to the balance for a later payout.

export const ISSUER = 'THE GREAT LIONHEART PTE. LTD.'

const ink = 'text-content print:text-black'
const body = 'text-content-body print:text-neutral-800'
const muted = 'text-content-muted print:text-neutral-500'
const rule = 'border-hairline print:border-neutral-300'
const th = `whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] ${muted} print:px-2`
const td = `whitespace-nowrap px-4 py-3 text-sm ${body} print:px-2 print:py-2`
const num = 'text-right tabular-nums'

/** `entries` defaults to the statement's own list; pass every entry when that list was cut short. */
export function exportPayoutStatement(
  data: AffiliatePayoutStatement,
  entries = data.entries
) {
  downloadCsv(
    `enconvo-affiliate-${data.affiliate.code}-payout-${isoDay(
      data.payout.paid_at
    )}.csv`,
    toCsv(
      [
        'Date',
        'Kind',
        'Customer',
        'Sub ID',
        'Promotion code',
        'Plan',
        'Paid before tax (USD)',
        'Rate (%)',
        'Commission (USD)',
        'Note',
      ],
      entries.map((row) => {
        const adjustment = row.kind === 'adjustment'
        return [
          isoDay(row.earned_at),
          KIND_LABEL[row.kind] ?? row.kind,
          row.customer ?? '',
          row.sub ?? '',
          row.promotion_code?.toUpperCase() ?? '',
          row.plan ?? '',
          adjustment ? '' : dollars(row.base_amount),
          adjustment ? '' : row.rate,
          dollars(row.amount),
          row.note ?? '',
        ]
      })
    )
  )
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const { t, locale } = useI18n()

  return (
    <div className="min-w-0">
      <dt
        className={`text-xs font-medium uppercase tracking-[0.08em] ${muted}`}
      >
        {t(label)}
      </dt>
      <dd className={`mt-2 break-words text-sm leading-6 ${body}`}>
        {children}
      </dd>
    </div>
  )
}

export function PayoutStatement({ data }: { data: AffiliatePayoutStatement }) {
  const { t, locale } = useI18n()

  const { affiliate, payout, entries, totals } = data
  const cancelled = !!payout.cancelled_at
  return (
    <article
      className={`${card} p-5 print:rounded-none print:border-0 print:bg-transparent print:p-0 sm:p-10`}
    >
      <header
        className={`flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-start sm:justify-between ${rule}`}
      >
        <div>
          <h1 className={`text-2xl font-semibold sm:text-3xl ${ink}`}>
            {t('Payout statement')}
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            <I18nText
              source={'Statement {p0} · {p1}'}
              values={{
                p0: (
                  <span className="font-mono">
                    {payout.id.slice(0, 8).toUpperCase()}
                  </span>
                ),
                p1: formatDay(payout.paid_at, locale),
              }}
            />
          </p>
        </div>
        <div className={`text-sm leading-6 sm:text-right ${muted}`}>
          <p className={`font-semibold ${ink}`}>{t('Enconvo')}</p>
          <p>{ISSUER}</p>
          <p>{SUPPORT_EMAIL}</p>
        </div>
      </header>

      {payout.cancelled_at && (
        <div
          role="status"
          className="mt-8 rounded-lg border border-[#4A3D1C] bg-[#2A2313] p-4 text-sm leading-6 print:border-neutral-400 print:bg-transparent"
        >
          <p className="font-medium text-signal-yellow print:text-black">
            <I18nText
              source={'Cancelled on {p0}: this payout never reached you.'}
              values={{ p0: formatDay(payout.cancelled_at, locale) }}
            />
          </p>
          {payout.cancel_reason && (
            <p className={ink}>{payout.cancel_reason}</p>
          )}
          <p className={body}>
            {t(
              'The commissions it covered went back to your balance, and a later payout sends them. This statement stays for your records.'
            )}
          </p>
        </div>
      )}

      <dl
        className={`grid gap-6 border-b py-8 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 ${rule}`}
      >
        <Fact label={cancelled ? t('Amount, cancelled') : t('Amount paid')}>
          <span
            className={`text-2xl font-semibold tabular-nums ${
              cancelled ? `line-through ${muted}` : ink
            }`}
          >
            {formatCents(payout.amount, { ...{}, locale })}
          </span>
          <span className={`ml-1.5 text-xs uppercase ${muted}`}>
            {payout.currency}
          </span>
        </Fact>
        <Fact label={t('Paid to')}>
          {payout.billing_details ? (
            // The first line is the name, as without billing details; a blank line stays one.
            payout.billing_details.split('\n').map((line, i) => (
              <span
                key={i}
                className={`block ${i === 0 ? 'font-medium' : ''} ${ink}`}
              >
                {line || t(' ')}
              </span>
            ))
          ) : (
            <span className={`block font-medium ${ink}`}>
              {affiliate.name || affiliate.code}
            </span>
          )}
          <span className={`block ${muted}`}>
            <I18nText
              source={'Affiliate code {p0}'}
              values={{
                p0: <span className="font-mono">{affiliate.code}</span>,
              }}
            />
          </span>
        </Fact>
        <Fact label={t('Sent by')}>
          <span className={`block font-medium ${ink}`}>
            {PAYOUT_METHOD_LABEL[payout.method] ?? payout.method}
          </span>
          <span className={`block font-mono ${muted}`}>{payout.account}</span>
        </Fact>
        <Fact label={t('Reference')}>
          <span className={`font-mono ${payout.reference ? ink : muted}`}>
            {payout.reference || t('Not noted')}
          </span>
        </Fact>
      </dl>

      {entries.length === 0 ? (
        <p className={`py-6 text-sm leading-6 ${muted}`}>
          {cancelled
            ? t(
                'No entries: the payout was cancelled and they went back to your balance.'
              )
            : t('No entries.')}
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto pt-4 print:mx-0 print:overflow-visible sm:mx-0">
          <table className="w-full min-w-[640px] print:min-w-0">
            <thead className={`border-b ${rule}`}>
              <tr>
                <th className={`${th} pl-5 print:pl-0 sm:pl-0`}>{t('Date')}</th>
                <th className={th}>{t('Customer or note')}</th>
                <th className={th}>{t('Kind')}</th>
                <th className={`${th} ${num}`}>{t('Paid before tax')}</th>
                <th className={`${th} ${num} pr-5 print:pr-0 sm:pr-0`}>
                  {t('Commission')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline print:divide-neutral-200">
              {entries.map((row) => {
                const adjustment = row.kind === 'adjustment'
                return (
                  <tr key={row.id} className="break-inside-avoid">
                    <td className={`${td} pl-5 print:pl-0 sm:pl-0`}>
                      {formatDay(row.earned_at, locale)}
                    </td>
                    {adjustment ? (
                      <td
                        className={`min-w-[200px] max-w-[320px] break-words px-4 py-3 text-sm print:px-2 print:py-2 ${ink}`}
                      >
                        {row.note || '—'}
                      </td>
                    ) : (
                      <td className={`${td} font-mono ${ink}`}>
                        {row.customer}
                      </td>
                    )}
                    <td className={td}>
                      {KIND_LABEL[row.kind] ?? row.kind}
                      {row.plan && (
                        <span className={muted}>
                          {' '}
                          · {t(planLabel(row.plan))}
                        </span>
                      )}
                    </td>
                    <td className={`${td} ${num}`}>
                      {adjustment
                        ? '—'
                        : formatCents(Math.abs(row.base_amount), {
                            ...{},
                            locale,
                          })}
                    </td>
                    <td
                      className={`${td} ${num} pr-5 font-medium print:pr-0 print:text-black sm:pr-0 ${
                        row.amount < 0
                          ? 'text-signal-yellow'
                          : 'text-signal-green'
                      }`}
                    >
                      {signed(row.amount)}
                      {!adjustment && (
                        <span className={`ml-1 text-xs font-normal ${muted}`}>
                          {row.rate}%
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <dl
        className={`ml-auto mt-2 w-full max-w-sm border-t pt-4 text-sm sm:max-w-md ${rule}`}
      >
        <div className="flex justify-between gap-6 py-1.5">
          <dt className={body}>{t('Commissions and bonuses')}</dt>
          <dd className={`whitespace-nowrap tabular-nums ${ink}`}>
            {totals.added !== 0
              ? signed(totals.added)
              : formatCents(0, { ...{}, locale })}
          </dd>
        </div>
        <div className="flex justify-between gap-6 py-1.5">
          <dt className={body}>{t('Refunds, chargebacks and deductions')}</dt>
          <dd className={`whitespace-nowrap tabular-nums ${ink}`}>
            {totals.taken_back < 0
              ? signed(totals.taken_back)
              : formatCents(0, { ...{}, locale })}
          </dd>
        </div>
        <div
          className={`mt-2 flex justify-between gap-6 border-t pt-3 ${rule}`}
        >
          <dt className={`font-semibold ${ink}`}>{t('Total paid')}</dt>
          <dd
            className={`whitespace-nowrap text-base font-semibold tabular-nums ${ink}`}
          >
            {formatCents(cancelled ? 0 : payout.amount, { ...{}, locale })}
          </dd>
        </div>
      </dl>

      <footer
        className={`mt-10 space-y-1.5 border-t pt-6 text-xs leading-5 ${rule} ${muted}`}
      >
        {data.entries_truncated && (
          <p>
            <I18nText
              source={
                'Showing the newest {p0} of {p1} entries. The totals and the CSV download cover all of them.'
              }
              values={{
                p0: entries.length.toLocaleString(locale),
                p1: totals.entries.toLocaleString(locale),
              }}
            />
          </p>
        )}
        <p>
          {t(
            'Commissions are calculated on what the customer paid after discounts and before tax. Customer emails are masked to protect their privacy.'
          )}
        </p>
        <p>
          <I18nText
            source={
              'A refund or chargeback of a commission that was already paid comes off a later payout. Questions about this statement: {p0}.'
            }
            values={{ p0: SUPPORT_EMAIL }}
          />
        </p>
      </footer>
    </article>
  )
}
