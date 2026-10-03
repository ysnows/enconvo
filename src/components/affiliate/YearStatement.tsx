import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import Link from 'next/link'
import {
  downloadCsv,
  formatCents,
  formatDay,
  formatUtcDay,
  PAYOUT_METHOD_LABEL,
  SUPPORT_EMAIL,
  toCsv,
  type AffiliateYearStatement,
} from '@/lib/affiliate-program'
import { dollars, isoDay, signed } from './AffiliateTables'
import { ISSUER } from './PayoutStatement'
import { card } from './ui'

// A year's earnings statement for the Affiliate's books and tax return: what it earned and was paid month by month, the
// payouts, and the unpaid balance at both ends. It prints black on white like a payout statement.

const ink = 'text-content print:text-black'
const body = 'text-content-body print:text-neutral-800'
const muted = 'text-content-muted print:text-neutral-500'
const rule = 'border-hairline print:border-neutral-300'
const th = `whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] ${muted} print:px-2`
const td = `whitespace-nowrap px-4 py-3 text-sm ${body} print:px-2 print:py-2`
const num = 'text-right tabular-nums'

function monthName(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
}

/** The unpaid balance after each month: what the year started with, plus each month's net, less what it paid. */
function runningUnpaid(data: AffiliateYearStatement): number[] {
  let unpaid = data.unpaid_at_start
  return data.months.map((m) => (unpaid += m.net - m.paid))
}

function endLabel(data: AffiliateYearStatement): string {
  return data.complete
    ? `Unpaid on ${formatUtcDay(`${data.year}-12-31`)}`
    : 'Unpaid now'
}

export function exportYearStatement(data: AffiliateYearStatement) {
  const unpaid = runningUnpaid(data)
  downloadCsv(
    `enconvo-affiliate-${data.affiliate.code}-${data.year}${
      data.complete ? '' : '-to-date'
    }.csv`,
    toCsv(
      [
        'Month (UTC)',
        'Earned (USD)',
        'Taken back (USD)',
        'Net (USD)',
        'Paid out (USD)',
        'Unpaid after (USD)',
      ],
      [
        ['Unpaid before', '', '', '', '', dollars(data.unpaid_at_start)],
        ...data.months.map((m, i) => [
          m.month,
          dollars(m.earned),
          dollars(m.taken_back),
          dollars(m.net),
          dollars(m.paid),
          dollars(unpaid[i]),
        ]),
        [
          `Total ${data.year}`,
          dollars(data.totals.earned),
          dollars(data.totals.taken_back),
          dollars(data.totals.net),
          dollars(data.totals.paid),
          dollars(data.unpaid_at_end),
        ],
      ]
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

export function YearStatement({ data }: { data: AffiliateYearStatement }) {
  const { t, locale } = useI18n()

  const { affiliate, year, months, payouts, totals } = data
  const unpaid = runningUnpaid(data)
  const big = `text-2xl font-semibold tabular-nums ${ink}`
  return (
    <article
      className={`${card} p-5 print:rounded-none print:border-0 print:bg-transparent print:p-0 sm:p-10`}
    >
      <header
        className={`flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-start sm:justify-between ${rule}`}
      >
        <div>
          <h1 className={`text-2xl font-semibold sm:text-3xl ${ink}`}>
            <I18nText
              source={'Earnings statement {p0}'}
              values={{ p0: year }}
            />
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            {data.complete
              ? t('{p0} to {p1}, UTC', {
                  p0: formatUtcDay(`${year}-01-01`),
                  p1: formatUtcDay(`${year}-12-31`),
                })
              : t('Year to date: {p0} to today, UTC', {
                  p0: formatUtcDay(`${year}-01-01`),
                })}
          </p>
        </div>
        <div className={`text-sm leading-6 sm:text-right ${muted}`}>
          <p className={`font-semibold ${ink}`}>{t('Enconvo')}</p>
          <p>{ISSUER}</p>
          <p>{SUPPORT_EMAIL}</p>
        </div>
      </header>

      <dl
        className={`grid gap-6 border-b py-8 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 ${rule}`}
      >
        <Fact label={t('Paid to you in {p0}', { p0: year })}>
          <span className={big}>
            {formatCents(totals.paid, { ...{}, locale })}
          </span>
          <span className={`ml-1.5 text-xs uppercase ${muted}`}>
            {t('usd')}
          </span>
        </Fact>
        <Fact label={t('Net earned in {p0}', { p0: year })}>
          <span className={big}>
            {formatCents(totals.net, { ...{}, locale })}
          </span>
        </Fact>
        <Fact label={endLabel(data)}>
          <span className={big}>
            {formatCents(data.unpaid_at_end, { ...{}, locale })}
          </span>
        </Fact>
        <Fact label={t('Affiliate')}>
          {affiliate.billing_details ? (
            affiliate.billing_details.split('\n').map((line, i) => (
              <span
                key={i}
                className={`block ${i === 0 ? 'font-medium' : ''} ${ink}`}
              >
                {line || ' '}
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
      </dl>

      <h2 className={`pt-8 text-base font-semibold ${ink}`}>{t('By month')}</h2>
      <div className="-mx-5 overflow-x-auto pt-2 print:mx-0 print:overflow-visible sm:mx-0">
        <table className="w-full min-w-[640px] print:min-w-0">
          <thead className={`border-b ${rule}`}>
            <tr>
              <th className={`${th} pl-5 print:pl-0 sm:pl-0`}>{t('Month')}</th>
              <th className={`${th} ${num}`}>{t('Earned')}</th>
              <th className={`${th} ${num}`}>{t('Taken back')}</th>
              <th className={`${th} ${num}`}>{t('Net')}</th>
              <th className={`${th} ${num}`}>{t('Paid out')}</th>
              <th className={`${th} ${num} pr-5 print:pr-0 sm:pr-0`}>
                {t('Unpaid after')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline print:divide-neutral-200">
            {months.map((m, i) => (
              <tr key={m.month} className="break-inside-avoid">
                <td className={`${td} pl-5 print:pl-0 sm:pl-0 ${ink}`}>
                  {t(monthName(m.month))}
                  {!data.complete && i === months.length - 1 && (
                    <span className={`ml-2 text-xs ${muted}`}>
                      {t('so far')}
                    </span>
                  )}
                </td>
                <td className={`${td} ${num}`}>
                  {m.earned ? formatCents(m.earned, { ...{}, locale }) : '—'}
                </td>
                <td className={`${td} ${num}`}>
                  {m.taken_back
                    ? formatCents(-m.taken_back, { ...{}, locale })
                    : '—'}
                </td>
                <td className={`${td} ${num} font-medium ${ink}`}>
                  {formatCents(m.net, { ...{}, locale })}
                </td>
                <td className={`${td} ${num}`}>
                  {m.paid ? formatCents(m.paid, { ...{}, locale }) : '—'}
                </td>
                <td className={`${td} ${num} pr-5 print:pr-0 sm:pr-0`}>
                  {formatCents(unpaid[i], { ...{}, locale })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className={`border-t ${rule}`}>
            <tr>
              <td
                className={`${td} pl-5 font-semibold print:pl-0 sm:pl-0 ${ink}`}
              >
                {t('Total')}
              </td>
              <td className={`${td} ${num} font-semibold ${ink}`}>
                {formatCents(totals.earned, { ...{}, locale })}
              </td>
              <td className={`${td} ${num} font-semibold ${ink}`}>
                {formatCents(-totals.taken_back, { ...{}, locale })}
              </td>
              <td className={`${td} ${num} font-semibold ${ink}`}>
                {formatCents(totals.net, { ...{}, locale })}
              </td>
              <td className={`${td} ${num} font-semibold ${ink}`}>
                {formatCents(totals.paid, { ...{}, locale })}
              </td>
              <td
                className={`${td} ${num} pr-5 font-semibold print:pr-0 sm:pr-0 ${ink}`}
              >
                {formatCents(data.unpaid_at_end, { ...{}, locale })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2 className={`pt-10 text-base font-semibold ${ink}`}>{t('Payouts')}</h2>
      {payouts.length === 0 ? (
        <p className={`py-4 text-sm leading-6 ${muted}`}>
          <I18nText source={'No payouts in {p0}.'} values={{ p0: year }} />
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto pt-2 print:mx-0 print:overflow-visible sm:mx-0">
          <table className="w-full min-w-[520px] print:min-w-0">
            <thead className={`border-b ${rule}`}>
              <tr>
                <th className={`${th} pl-5 print:pl-0 sm:pl-0`}>{t('Paid')}</th>
                <th className={th}>{t('Method')}</th>
                <th className={th}>{t('Reference')}</th>
                <th className={`${th} ${num} pr-5 print:pr-0 sm:pr-0`}>
                  {t('Amount')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline print:divide-neutral-200">
              {payouts.map((payout) => (
                <tr key={payout.id} className="break-inside-avoid">
                  <td className={`${td} pl-5 print:pl-0 sm:pl-0`}>
                    <Link
                      href={`/affiliate/payouts/${encodeURIComponent(
                        payout.id
                      )}`}
                      className="text-signal-blue hover:underline print:text-black print:no-underline"
                    >
                      {formatDay(payout.paid_at, locale)}
                    </Link>
                  </td>
                  <td className={td}>
                    {PAYOUT_METHOD_LABEL[payout.method] ?? payout.method}
                  </td>
                  <td className={`${td} font-mono`}>
                    {payout.reference || '—'}
                  </td>
                  <td
                    className={`${td} ${num} pr-5 font-medium print:pr-0 sm:pr-0 ${ink}`}
                  >
                    {formatCents(payout.amount, { ...{}, locale })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl
        className={`ml-auto mt-6 w-full max-w-sm border-t pt-4 text-sm sm:max-w-md ${rule}`}
      >
        <div className="flex justify-between gap-6 py-1.5">
          <dt className={body}>
            {t('Unpaid on ')}
            {formatUtcDay(`${year}-01-01`, locale)}
          </dt>
          <dd className={`whitespace-nowrap tabular-nums ${ink}`}>
            {formatCents(data.unpaid_at_start, { ...{}, locale })}
          </dd>
        </div>
        <div className="flex justify-between gap-6 py-1.5">
          <dt className={body}>{t('Net earned')}</dt>
          <dd className={`whitespace-nowrap tabular-nums ${ink}`}>
            {totals.net !== 0
              ? signed(totals.net)
              : formatCents(0, { ...{}, locale })}
          </dd>
        </div>
        <div className="flex justify-between gap-6 py-1.5">
          <dt className={body}>{t('Paid out')}</dt>
          <dd className={`whitespace-nowrap tabular-nums ${ink}`}>
            {totals.paid !== 0
              ? signed(-totals.paid)
              : formatCents(0, { ...{}, locale })}
          </dd>
        </div>
        <div
          className={`mt-2 flex justify-between gap-6 border-t pt-3 ${rule}`}
        >
          <dt className={`font-semibold ${ink}`}>{t(endLabel(data))}</dt>
          <dd
            className={`whitespace-nowrap text-base font-semibold tabular-nums ${ink}`}
          >
            {formatCents(data.unpaid_at_end, { ...{}, locale })}
          </dd>
        </div>
      </dl>

      <footer
        className={`mt-10 space-y-1.5 border-t pt-6 text-xs leading-5 ${rule} ${muted}`}
      >
        <p>
          {t(
            "Amounts are in US dollars and months in UTC. A commission counts in the month of the payment, and a refund, chargeback or adjustment in the month it happened, so a month's net can be negative. A payout counts on the day we sent it; a cancelled payout never reached you and isn't counted."
          )}
        </p>
        <p>
          {t(
            "The unpaid balance includes commissions still in their refund window. Each payout's own statement lists the commissions it covered."
          )}
        </p>
        <p>
          <I18nText
            source={
              'Declaring and paying tax on your earnings is up to you, as the program terms say. This statement is a summary for your records, not a tax form. Questions: {p0}.'
            }
            values={{ p0: SUPPORT_EMAIL }}
          />
        </p>
      </footer>
    </article>
  )
}

/** For the statement's file name, e.g. when it is saved as a PDF. */
export function yearStatementTitle(data: AffiliateYearStatement): string {
  return `Enconvo earnings statement ${data.year}${
    data.complete ? '' : ` to ${isoDay(new Date().toISOString())}`
  }`
}
