import { downloadCsv, formatCents, formatDay, PAYOUT_METHOD_LABEL, planLabel, SUPPORT_EMAIL, toCsv, type AffiliatePayoutStatement } from '@/lib/affiliate-program'
import { dollars, isoDay, KIND_LABEL, signed } from './AffiliateTables'
import { card } from './ui'

// A payout statement: who was paid, how, and every commission, refund and adjustment the payout
// settled. On paper (or a saved PDF) it prints black on white, without the site around it.

const ISSUER = 'THE GREAT LIONHEART PTE. LTD.'

const ink = 'text-content print:text-black'
const body = 'text-content-body print:text-neutral-800'
const muted = 'text-content-muted print:text-neutral-500'
const rule = 'border-hairline print:border-neutral-300'
const th = `whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] ${muted} print:px-2`
const td = `whitespace-nowrap px-4 py-3 text-sm ${body} print:px-2 print:py-2`
const num = 'text-right tabular-nums'

/** `entries` defaults to the statement's own list; pass every entry when that list was cut short. */
export function exportPayoutStatement(data: AffiliatePayoutStatement, entries = data.entries) {
    downloadCsv(
        `enconvo-affiliate-${data.affiliate.code}-payout-${isoDay(data.payout.paid_at)}.csv`,
        toCsv(
            ['Date', 'Kind', 'Customer', 'Sub ID', 'Promotion code', 'Plan', 'Paid before tax (USD)', 'Rate (%)', 'Commission (USD)', 'Note'],
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
            }),
        ),
    )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className={`text-xs font-medium uppercase tracking-[0.08em] ${muted}`}>{label}</dt>
            <dd className={`mt-2 break-words text-sm leading-6 ${body}`}>{children}</dd>
        </div>
    )
}

export function PayoutStatement({ data }: { data: AffiliatePayoutStatement }) {
    const { affiliate, payout, entries, totals } = data
    return (
        <article className={`${card} p-5 sm:p-10 print:rounded-none print:border-0 print:bg-transparent print:p-0`}>
            <header className={`flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-start sm:justify-between ${rule}`}>
                <div>
                    <h1 className={`text-2xl font-semibold sm:text-3xl ${ink}`}>Payout statement</h1>
                    <p className={`mt-2 text-sm ${muted}`}>
                        Statement <span className="font-mono">{payout.id.slice(0, 8).toUpperCase()}</span> · {formatDay(payout.paid_at)}
                    </p>
                </div>
                <div className={`text-sm leading-6 sm:text-right ${muted}`}>
                    <p className={`font-semibold ${ink}`}>Enconvo</p>
                    <p>{ISSUER}</p>
                    <p>{SUPPORT_EMAIL}</p>
                </div>
            </header>

            <dl className={`grid gap-6 border-b py-8 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 ${rule}`}>
                <Fact label="Amount paid">
                    <span className={`text-2xl font-semibold tabular-nums ${ink}`}>{formatCents(payout.amount)}</span>
                    <span className={`ml-1.5 text-xs uppercase ${muted}`}>{payout.currency}</span>
                </Fact>
                <Fact label="Paid to">
                    {payout.billing_details ? (
                        // The first line is the name, as without billing details; a blank line stays one.
                        payout.billing_details.split('\n').map((line, i) => (
                            <span key={i} className={`block ${i === 0 ? 'font-medium' : ''} ${ink}`}>
                                {line || '\u00a0'}
                            </span>
                        ))
                    ) : (
                        <span className={`block font-medium ${ink}`}>{affiliate.name || affiliate.code}</span>
                    )}
                    <span className={`block ${muted}`}>
                        Affiliate code <span className="font-mono">{affiliate.code}</span>
                    </span>
                </Fact>
                <Fact label="Sent by">
                    <span className={`block font-medium ${ink}`}>{PAYOUT_METHOD_LABEL[payout.method] ?? payout.method}</span>
                    <span className={`block font-mono ${muted}`}>{payout.account}</span>
                </Fact>
                <Fact label="Reference">
                    <span className={`font-mono ${payout.reference ? ink : muted}`}>{payout.reference || 'Not noted'}</span>
                </Fact>
            </dl>

            <div className="-mx-5 overflow-x-auto pt-4 sm:mx-0 print:mx-0 print:overflow-visible">
                <table className="w-full min-w-[640px] print:min-w-0">
                    <thead className={`border-b ${rule}`}>
                        <tr>
                            <th className={`${th} pl-5 sm:pl-0 print:pl-0`}>Date</th>
                            <th className={th}>Customer or note</th>
                            <th className={th}>Kind</th>
                            <th className={`${th} ${num}`}>Paid before tax</th>
                            <th className={`${th} ${num} pr-5 sm:pr-0 print:pr-0`}>Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline print:divide-neutral-200">
                        {entries.map((row) => {
                            const adjustment = row.kind === 'adjustment'
                            return (
                                <tr key={row.id} className="break-inside-avoid">
                                    <td className={`${td} pl-5 sm:pl-0 print:pl-0`}>{formatDay(row.earned_at)}</td>
                                    {adjustment ? (
                                        <td className={`min-w-[200px] max-w-[320px] break-words px-4 py-3 text-sm print:px-2 print:py-2 ${ink}`}>{row.note || '—'}</td>
                                    ) : (
                                        <td className={`${td} font-mono ${ink}`}>{row.customer}</td>
                                    )}
                                    <td className={td}>
                                        {KIND_LABEL[row.kind] ?? row.kind}
                                        {row.plan && <span className={muted}> · {planLabel(row.plan)}</span>}
                                    </td>
                                    <td className={`${td} ${num}`}>{adjustment ? '—' : formatCents(Math.abs(row.base_amount))}</td>
                                    <td
                                        className={`${td} ${num} pr-5 font-medium sm:pr-0 print:pr-0 print:text-black ${row.amount < 0 ? 'text-signal-yellow' : 'text-signal-green'}`}
                                    >
                                        {signed(row.amount)}
                                        {!adjustment && <span className={`ml-1 text-xs font-normal ${muted}`}>{row.rate}%</span>}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <dl className={`ml-auto mt-2 w-full max-w-sm border-t pt-4 text-sm sm:max-w-md ${rule}`}>
                <div className="flex justify-between gap-6 py-1.5">
                    <dt className={body}>Commissions and bonuses</dt>
                    <dd className={`whitespace-nowrap tabular-nums ${ink}`}>{signed(totals.added)}</dd>
                </div>
                <div className="flex justify-between gap-6 py-1.5">
                    <dt className={body}>Refunds, chargebacks and deductions</dt>
                    <dd className={`whitespace-nowrap tabular-nums ${ink}`}>{totals.taken_back < 0 ? signed(totals.taken_back) : formatCents(0)}</dd>
                </div>
                <div className={`mt-2 flex justify-between gap-6 border-t pt-3 ${rule}`}>
                    <dt className={`font-semibold ${ink}`}>Total paid</dt>
                    <dd className={`whitespace-nowrap text-base font-semibold tabular-nums ${ink}`}>{formatCents(payout.amount)}</dd>
                </div>
            </dl>

            <footer className={`mt-10 space-y-1.5 border-t pt-6 text-xs leading-5 ${rule} ${muted}`}>
                {data.entries_truncated && (
                    <p>
                        Showing the newest {entries.length.toLocaleString('en-US')} of {totals.entries.toLocaleString('en-US')} entries. The totals and the CSV download
                        cover all of them.
                    </p>
                )}
                <p>Commissions are calculated on what the customer paid after discounts and before tax. Customer emails are masked to protect their privacy.</p>
                <p>
                    A refund or chargeback of a commission that was already paid comes off a later payout. Questions about this statement: {SUPPORT_EMAIL}.
                </p>
            </footer>
        </article>
    )
}
