import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Download, Loader2 } from 'lucide-react'
import {
    conversionRate,
    downloadCsv,
    earningsPerVisitor,
    formatCents,
    formatDay,
    formatMonth,
    formatUtcDay,
    getAllCommissions,
    PAYOUT_METHOD_LABEL,
    planLabel,
    toCsv,
    type AffiliateCommission,
    type AffiliateDashboard,
    type AffiliateMonth,
    type AffiliatePayout,
    type AffiliateReferral,
    type ReferralPlan,
    type AffiliateSource,
} from '@/lib/affiliate-program'
import { card, Pill, type PillTone } from './ui'

// The dashboard's results per sub ID and promotion code, its monthly statement, and its Referrals, Commissions and
// Payouts tabs, each downloadable as CSV.

type Tab = 'referrals' | 'commissions' | 'payouts'

const REFERRAL_STATUS: Record<AffiliateReferral['status'], { label: string; tone: PillTone }> = {
    customer: { label: 'Customer', tone: 'green' },
    signed_up: { label: 'Signed up', tone: 'gray' },
    refunded: { label: 'Refunded', tone: 'yellow' },
    voided: { label: 'Voided', tone: 'red' },
}

const PLAN_STANDING: Record<ReferralPlan, { label: string; tone: string }> = {
    renewing: { label: 'Renews', tone: 'text-signal-green' },
    cancelling: { label: 'Cancels at period end', tone: 'text-signal-yellow' },
    ended: { label: 'Plan ended', tone: 'text-content-ash' },
    lifetime: { label: 'Lifetime license', tone: 'text-content-muted' },
}

function planStanding(row: AffiliateReferral) {
    if (!row.subscription) return null
    const standing = PLAN_STANDING[row.subscription]
    return row.subscription === 'renewing' && row.billing ? { ...standing, label: `Renews ${row.billing}` } : standing
}

export const KIND_LABEL: Record<AffiliateCommission['kind'], string> = {
    purchase: 'Purchase',
    renewal: 'Renewal',
    upgrade: 'Upgrade',
    reversal: 'Refund',
    chargeback: 'Chargeback',
    reinstatement: 'Dispute won',
    voided: 'Voided',
    adjustment: 'Adjustment',
}

function commissionStatus(entry: AffiliateCommission): { label: string; tone: PillTone } {
    if (entry.in_review && (entry.status === 'pending' || entry.status === 'payable')) return { label: 'In review', tone: 'yellow' }
    switch (entry.status) {
        case 'pending':
            return { label: `Pending until ${formatDay(entry.available_at)}`, tone: 'gray' }
        case 'payable':
            return { label: 'Payable', tone: 'green' }
        case 'paid':
            return { label: 'Paid', tone: 'blue' }
        default:
            return { label: entry.kind === 'adjustment' ? 'Deducted' : 'Taken back', tone: 'yellow' }
    }
}

export const signed = (amount: number) => (amount < 0 ? `−${formatCents(-amount)}` : `+${formatCents(amount)}`)
export const dollars = (amount: number) => ((Number(amount) || 0) / 100).toFixed(2)
export const isoDay = (value: string) => (value ? new Date(value).toISOString().slice(0, 10) : '')

function exportReferrals(code: string, rows: AffiliateReferral[]) {
    downloadCsv(
        `enconvo-affiliate-${code}-referrals.csv`,
        toCsv(
            ['Customer', 'Sub ID', 'Promotion code', 'Joined', 'Signed up', 'Plan', 'Plan status', 'Purchases', 'Paid (USD)', 'Commission (USD)', 'Status', 'Can earn until (UTC)', 'Added by Enconvo'],
            rows.map((row) => [
                row.customer,
                row.sub ?? '',
                row.promotion_code?.toUpperCase() ?? '',
                isoDay(row.joined_at),
                row.signed_up ? 'yes' : 'no',
                row.plan ?? '',
                planStanding(row)?.label ?? '',
                row.purchases,
                dollars(row.paid),
                dollars(row.commission),
                REFERRAL_STATUS[row.status].label,
                creditWindowLabel(row),
                row.added_by_enconvo ? 'yes' : 'no',
            ]),
        ),
    )
}

function exportCommissions(code: string, rows: AffiliateCommission[]) {
    downloadCsv(
        `enconvo-affiliate-${code}-commissions.csv`,
        toCsv(
            ['Date', 'Kind', 'Customer', 'Sub ID', 'Promotion code', 'Plan', 'Paid before tax (USD)', 'Rate (%)', 'Commission (USD)', 'Status', 'Payable from', 'Note'],
            rows.map((row) => {
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
                    row.in_review && (row.status === 'pending' || row.status === 'payable') ? 'in_review' : row.status,
                    isoDay(row.available_at),
                    row.note ?? '',
                ]
            }),
        ),
    )
}

function exportPayouts(code: string, rows: AffiliatePayout[]) {
    downloadCsv(
        `enconvo-affiliate-${code}-payouts.csv`,
        toCsv(
            ['Paid', 'Amount (USD)', 'Method', 'Reference'],
            rows.map((row) => [isoDay(row.paid_at), dollars(row.amount), PAYOUT_METHOD_LABEL[row.method] ?? row.method, row.reference ?? '']),
        ),
    )
}

function exportSources(code: string, rows: AffiliateSource[]) {
    downloadCsv(
        `enconvo-affiliate-${code}-sub-ids.csv`,
        toCsv(
            ['Sub ID', 'Promotion code', 'Visitors', 'Signed up', 'Customers', 'Visitor to customer', 'Per visitor (USD)', 'Paid (USD)', 'Commission (USD)'],
            rows.map((row) => [
                row.sub ?? '',
                row.promotion_code?.toUpperCase() ?? '',
                row.visitors,
                row.signups,
                row.customers,
                row.promotion_code ? '' : (conversionRate(row.visitors, row.customers) ?? ''),
                row.promotion_code || !(row.visitors > 0) ? '' : (Math.max(0, row.commission) / row.visitors / 100).toFixed(4),
                dollars(row.paid),
                dollars(row.commission),
            ]),
        ),
    )
}

function exportMonths(code: string, rows: AffiliateMonth[]) {
    downloadCsv(
        `enconvo-affiliate-${code}-monthly.csv`,
        toCsv(
            ['Month (UTC)', 'Visitors', 'Purchases', 'Earned (USD)', 'Taken back (USD)', 'Net (USD)', 'Paid out (USD)'],
            rows.map((row) => [row.month, row.visitors, row.purchases, dollars(row.earned), dollars(row.taken_back), dollars(row.net), dollars(row.paid)]),
        ),
    )
}

const th = 'whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-content-muted'
const td = 'whitespace-nowrap px-4 py-3 text-sm text-content-body'
const num = 'text-right tabular-nums'

function Empty({ children }: { children: string }) {
    return <p className="px-4 py-12 text-center text-sm text-content-muted">{children}</p>
}

/** The sub ID the customer came through, or the promotion code they used instead of the link. */
function SourceTag({ sub, promotionCode }: { sub: string | null; promotionCode: string | null }) {
    const label = sub ?? (promotionCode ? `code ${promotionCode.toUpperCase()}` : null)
    return label ? <span className="ml-2 rounded bg-[#1B1E20] px-1.5 py-0.5 text-xs text-content-muted">{label}</span> : null
}

function sourceLabel(row: AffiliateSource): string {
    if (row.sub) return row.sub
    if (row.promotion_code) return `Code ${row.promotion_code.toUpperCase()}`
    return 'No sub ID'
}

const downloadButton =
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-muted transition-colors hover:text-content disabled:opacity-40 disabled:hover:text-content-muted'

/** Results per sub ID and promotion code, the most commission first; until the Affiliate uses either, how to start. */
export function AffiliateSources({ data }: { data: AffiliateDashboard }) {
    const sources = data.sources ?? []
    const code = data.affiliate?.code ?? 'affiliate'
    const byCode = sources.some((row) => row.promotion_code !== null)
    if (!byCode && !sources.some((row) => row.sub !== null)) {
        return (
            <section className={`${card} px-6 py-5`}>
                <h2 className="text-lg font-semibold text-content">Results by sub ID</h2>
                <p className="mt-1 text-sm leading-6 text-content-muted">
                    Add a sub ID in the link builder above, for example one per video, post or newsletter, and each one&apos;s visitors,
                    customers and commission show up here.
                </p>
            </section>
        )
    }
    return (
        <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
                <h2 className="text-lg font-semibold text-content">{byCode ? 'Results by sub ID and code' : 'Results by sub ID'}</h2>
                <button type="button" onClick={() => exportSources(code, sources)} className={downloadButton}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download CSV
                </button>
            </div>
            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px]">
                    <thead className="border-y border-hairline">
                        <tr>
                            <th className={`${th} pl-6`}>{byCode ? 'Source' : 'Sub ID'}</th>
                            <th className={`${th} ${num}`}>Visitors</th>
                            <th className={`${th} ${num}`}>Signed up</th>
                            <th className={`${th} ${num}`}>Customers</th>
                            <th className={`${th} ${num}`}>Visitor → customer</th>
                            <th className={`${th} ${num}`} title="Commission per visitor (EPC)">
                                Per visitor
                            </th>
                            <th className={`${th} ${num}`}>Paid</th>
                            <th className={`${th} ${num} pr-6`}>Your commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                        {sources.map((row) => (
                            <tr key={`${row.sub ?? ''}|${row.promotion_code ?? ''}`}>
                                <td className={`${td} pl-6 ${row.sub || row.promotion_code ? 'font-mono text-content' : 'text-content-muted'}`}>{sourceLabel(row)}</td>
                                <td className={`${td} ${num}`}>{row.visitors.toLocaleString('en-US')}</td>
                                <td className={`${td} ${num}`}>{row.signups.toLocaleString('en-US')}</td>
                                <td className={`${td} ${num}`}>{row.customers.toLocaleString('en-US')}</td>
                                <td className={`${td} ${num}`}>{(!row.promotion_code && conversionRate(row.visitors, row.customers)) || '—'}</td>
                                <td className={`${td} ${num}`}>{(!row.promotion_code && earningsPerVisitor(row.visitors, row.commission)) || '—'}</td>
                                <td className={`${td} ${num}`}>{formatCents(row.paid)}</td>
                                <td className={`${td} ${num} pr-6 font-medium text-content`}>{formatCents(row.commission)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="px-6 pb-5 pt-3 text-xs leading-5 text-content-ash">
                {data.sources_truncated ? `Showing the top ${sources.length} sub IDs. ` : ''}
                Each customer counts under the sub ID of the link they bought through
                {byCode ? ', or under your code when they entered it at checkout without the link' : ''}. Paid and commission are after refunds;
                per visitor is the commission divided by visitors.
            </p>
        </section>
    )
}

/** A signed correction: what was taken back shows as a minus, a dispute won that outweighs it as a plus. */
function takenBack(amount: number): string {
    if (amount === 0) return formatCents(0)
    return amount < 0 ? `+${formatCents(-amount)}` : formatCents(-amount)
}

export function AffiliateMonths({ data }: { data: AffiliateDashboard }) {
    const months = data.months ?? []
    const code = data.affiliate?.code ?? 'affiliate'
    const active = months.some((m) => m.visitors || m.purchases || m.earned || m.taken_back || m.paid)
    if (!active) {
        return (
            <section className={`${card} px-6 py-5`}>
                <h2 className="text-lg font-semibold text-content">Earnings by month</h2>
                <p className="mt-1 text-sm leading-6 text-content-muted">
                    Your monthly statement starts with your link&apos;s first visit: visitors, purchases, what you earned and what
                    we paid out, month by month.
                </p>
            </section>
        )
    }
    const total = months.reduce(
        (sum, m) => ({
            visitors: sum.visitors + m.visitors,
            purchases: sum.purchases + m.purchases,
            earned: sum.earned + m.earned,
            taken_back: sum.taken_back + m.taken_back,
            net: sum.net + m.net,
            paid: sum.paid + m.paid,
        }),
        { visitors: 0, purchases: 0, earned: 0, taken_back: 0, net: 0, paid: 0 },
    )
    const tfoot = 'whitespace-nowrap px-4 py-3 text-sm font-medium text-content'
    return (
        <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
                <h2 className="text-lg font-semibold text-content">Earnings by month</h2>
                <button type="button" onClick={() => exportMonths(code, months)} className={downloadButton}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download CSV
                </button>
            </div>
            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    <thead className="border-y border-hairline">
                        <tr>
                            <th className={`${th} pl-6`}>Month</th>
                            <th className={`${th} ${num}`}>Visitors</th>
                            <th className={`${th} ${num}`}>Purchases</th>
                            <th className={`${th} ${num}`}>Earned</th>
                            <th className={`${th} ${num}`}>Taken back</th>
                            <th className={`${th} ${num}`}>Net</th>
                            <th className={`${th} ${num} pr-6`}>Paid out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                        {months.map((m, index) => (
                            <tr key={m.month}>
                                <td className={`${td} pl-6 text-content`}>
                                    {formatMonth(m.month)}
                                    {index === 0 && <span className="ml-2 text-xs text-content-muted">so far</span>}
                                </td>
                                <td className={`${td} ${num}`}>{m.visitors.toLocaleString('en-US')}</td>
                                <td className={`${td} ${num}`}>{m.purchases.toLocaleString('en-US')}</td>
                                <td className={`${td} ${num}`}>{formatCents(m.earned)}</td>
                                <td className={`${td} ${num} ${m.taken_back > 0 ? 'text-signal-red' : ''}`}>{takenBack(m.taken_back)}</td>
                                <td className={`${td} ${num} font-medium text-content`}>{formatCents(m.net)}</td>
                                <td className={`${td} ${num} pr-6`}>{m.paid ? formatCents(m.paid) : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                    {months.length > 1 && (
                        <tfoot className="border-t border-hairline">
                            <tr>
                                <td className={`${tfoot} pl-6`}>{months.length} months</td>
                                <td className={`${tfoot} ${num}`}>{total.visitors.toLocaleString('en-US')}</td>
                                <td className={`${tfoot} ${num}`}>{total.purchases.toLocaleString('en-US')}</td>
                                <td className={`${tfoot} ${num}`}>{formatCents(total.earned)}</td>
                                <td className={`${tfoot} ${num}`}>{takenBack(total.taken_back)}</td>
                                <td className={`${tfoot} ${num}`}>{formatCents(total.net)}</td>
                                <td className={`${tfoot} ${num} pr-6`}>{formatCents(total.paid)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
            <p className="px-6 pb-5 pt-3 text-xs leading-5 text-content-ash">
                Months are in UTC. A commission counts in the month of the payment, and a refund, dispute, voided referral or
                adjustment in the month it happened, so a month&apos;s net can be negative. Purchases count every checkout, a customer&apos;s later ones
                included; renewals and bonuses add to earned.
            </p>
        </section>
    )
}

function PlanStanding({ row }: { row: AffiliateReferral }) {
    const standing = planStanding(row)
    if (!standing) return null
    return (
        <span className={`mt-0.5 flex items-center gap-1.5 text-xs ${standing.tone}`}>
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-current" aria-hidden="true" />
            {standing.label}
        </span>
    )
}

function CreditWindow({ row }: { row: AffiliateReferral }) {
    if (row.status !== 'signed_up' || !row.credit_window) return null
    return row.credit_window === 'open' && row.credit_until ? (
        <span className="mt-1 block text-xs text-content-muted" title="A purchase by the end of this day (UTC) earns you commission, unless they come through another Affiliate's link first.">
            Can earn until {formatUtcDay(row.credit_until)}
        </span>
    ) : (
        <span className="mt-1 block text-xs text-content-ash" title="More than 90 days have passed since they last came through your link, or they came through another link since.">
            Window ended
        </span>
    )
}

/** A customer Enconvo credited to the Affiliate by hand, since no link or promotion code did. */
function AddedByEnconvo({ row }: { row: AffiliateReferral }) {
    if (!row.added_by_enconvo) return null
    return (
        <span className="mt-1 block font-sans text-xs text-content-muted" title="Enconvo credited this customer's subscription to you by hand. Its payments from that day on earn you commission.">
            Added by Enconvo
        </span>
    )
}

const creditWindowLabel = (row: AffiliateReferral) =>
    row.status !== 'signed_up' || !row.credit_window ? '' : row.credit_window === 'open' ? row.credit_until ?? '' : 'ended'

const openWindowsNote = (count: number) =>
    count > 0
        ? `${count === 1 ? 'One sign-up' : `${count.toLocaleString('en-US')} sign-ups`} can still earn you commission if they buy by the day shown, unless they come through another Affiliate's link first. `
        : ''

const renewingNote = (count: number) =>
    count > 0
        ? `${count === 1 ? 'One customer has a Cloud plan that renews' : `${count.toLocaleString('en-US')} customers have a Cloud plan that renews`}; each renewal of a plan bought through you earns commission. `
        : ''

export function AffiliateTables({ data, accessToken }: { data: AffiliateDashboard; accessToken: string }) {
    const [tab, setTab] = useState<Tab>('referrals')
    const [exporting, setExporting] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)
    const code = data.affiliate?.code ?? 'affiliate'
    const referrals = data.referrals ?? []
    const commissions = data.commissions ?? []
    const payouts = data.payouts ?? []
    const counts: Record<Tab, number> = { referrals: referrals.length, commissions: commissions.length, payouts: payouts.length }
    const labels: Record<Tab, string> = { referrals: 'Referrals', commissions: 'Commissions', payouts: 'Payouts' }

    const download = async () => {
        setExportError(null)
        if (tab === 'referrals') exportReferrals(code, referrals)
        else if (tab === 'payouts') exportPayouts(code, payouts)
        else if (!data.commissions_truncated) exportCommissions(code, commissions)
        else {
            // The tab lists only the newest entries; the CSV is for bookkeeping, so it holds them all.
            setExporting(true)
            const result = await getAllCommissions(accessToken)
            setExporting(false)
            if (result.ok) exportCommissions(code, result.data)
            else setExportError(`We couldn't prepare the CSV. ${result.message}`)
        }
    }

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Affiliate records" className="flex w-full rounded-xl border border-hairline bg-surface-card p-1 sm:inline-flex sm:w-auto">
                    {(Object.keys(labels) as Tab[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            onClick={() => {
                                setTab(key)
                                setExportError(null)
                            }}
                            className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${tab === key ? 'bg-[#1B1E20] text-content' : 'text-content-muted hover:text-content'}`}
                        >
                            {labels[key]}
                            <span className="ml-1.5 text-xs text-content-ash sm:ml-2">{counts[key]}</span>
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {exportError && (
                        <span role="alert" className="text-xs leading-5 text-signal-red">
                            {exportError}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => void download()}
                        disabled={counts[tab] === 0 || exporting}
                        className={downloadButton}
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                        {exporting ? 'Preparing CSV…' : 'Download CSV'}
                    </button>
                </div>
            </div>

            <div className={`mt-4 overflow-x-auto ${card}`} role="tabpanel">
                {tab === 'referrals' &&
                    (referrals.length === 0 ? (
                        <Empty>No referrals yet. People who sign up or buy after opening your link appear here.</Empty>
                    ) : (
                        <table className="w-full min-w-[720px]">
                            <thead className="border-b border-hairline">
                                <tr>
                                    <th className={th}>Customer</th>
                                    <th className={th}>Joined</th>
                                    <th className={th}>Plan</th>
                                    <th className={`${th} ${num}`}>Paid</th>
                                    <th className={`${th} ${num}`}>Your commission</th>
                                    <th className={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {referrals.map((row, index) => (
                                    <tr key={`${row.customer}-${row.joined_at}-${index}`}>
                                        <td className={`${td} font-mono text-content`}>
                                            {row.customer}
                                            <SourceTag sub={row.sub} promotionCode={row.promotion_code ?? null} />
                                            <AddedByEnconvo row={row} />
                                        </td>
                                        <td className={td}>{formatDay(row.joined_at)}</td>
                                        <td className={td}>
                                            {planLabel(row.plan)}
                                            <PlanStanding row={row} />
                                        </td>
                                        <td className={`${td} ${num}`}>{formatCents(row.paid)}</td>
                                        <td className={`${td} ${num} font-medium text-content`}>{formatCents(row.commission)}</td>
                                        <td className={td}>
                                            <Pill tone={REFERRAL_STATUS[row.status].tone}>{REFERRAL_STATUS[row.status].label}</Pill>
                                            <CreditWindow row={row} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ))}

                {tab === 'commissions' &&
                    (commissions.length === 0 ? (
                        <Empty>No commissions yet. Each payment by someone you referred adds one here.</Empty>
                    ) : (
                        <table className="w-full min-w-[760px]">
                            <thead className="border-b border-hairline">
                                <tr>
                                    <th className={th}>Date</th>
                                    <th className={th}>Customer</th>
                                    <th className={th}>Kind</th>
                                    <th className={`${th} ${num}`}>Paid before tax</th>
                                    <th className={`${th} ${num}`}>Commission</th>
                                    <th className={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {commissions.map((row) => {
                                    const status = commissionStatus(row)
                                    const adjustment = row.kind === 'adjustment'
                                    return (
                                        <tr key={row.id}>
                                            <td className={td}>{formatDay(row.earned_at)}</td>
                                            {adjustment ? (
                                                <td className="min-w-[200px] max-w-[320px] break-words px-4 py-3 text-sm text-content">{row.note || '—'}</td>
                                            ) : (
                                                <td className={`${td} font-mono text-content`}>
                                                    {row.customer}
                                                    <SourceTag sub={row.sub} promotionCode={row.promotion_code ?? null} />
                                                </td>
                                            )}
                                            <td className={td}>
                                                {KIND_LABEL[row.kind] ?? row.kind}
                                                {row.plan && <span className="text-content-ash"> · {planLabel(row.plan)}</span>}
                                            </td>
                                            <td className={`${td} ${num}`}>{adjustment ? '—' : formatCents(Math.abs(row.base_amount))}</td>
                                            <td className={`${td} ${num} font-medium ${row.amount < 0 ? 'text-signal-yellow' : 'text-signal-green'}`}>
                                                {signed(row.amount)}
                                                {!adjustment && <span className="ml-1 text-xs font-normal text-content-ash">{row.rate}%</span>}
                                            </td>
                                            <td className={td}>
                                                <Pill tone={status.tone}>{status.label}</Pill>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ))}

                {tab === 'payouts' &&
                    (payouts.length === 0 ? (
                        <Empty>No payouts yet. We pay early each month once your payable balance reaches the minimum.</Empty>
                    ) : (
                        <table className="w-full min-w-[560px]">
                            <thead className="border-b border-hairline">
                                <tr>
                                    <th className={th}>Paid</th>
                                    <th className={`${th} ${num}`}>Amount</th>
                                    <th className={th}>Method</th>
                                    <th className={th}>Reference</th>
                                    <th className={th}>
                                        <span className="sr-only">Statement</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {payouts.map((row) => (
                                    <tr key={row.id}>
                                        <td className={td}>{formatDay(row.paid_at)}</td>
                                        <td className={`${td} ${num} font-medium text-content`}>{formatCents(row.amount)}</td>
                                        <td className={td}>{PAYOUT_METHOD_LABEL[row.method] ?? row.method}</td>
                                        <td className={`${td} font-mono`}>{row.reference || '—'}</td>
                                        <td className={`${td} text-right`}>
                                            <Link
                                                href={`/affiliate/payouts/${encodeURIComponent(row.id)}`}
                                                className="inline-flex items-center gap-1 font-medium text-signal-blue hover:underline"
                                            >
                                                Statement
                                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-content-ash">
                {tab === 'referrals' &&
                    (data.referrals_truncated
                        ? `Showing the newest ${referrals.length} referrals. `
                        : '') +
                        renewingNote(data.totals?.renewing ?? 0) +
                        openWindowsNote(data.totals?.open_windows ?? 0) +
                        "Emails are masked to protect your referrals' privacy. Sign-ups show up even before they buy."}
                {tab === 'commissions' &&
                    (data.commissions_truncated ? `Showing the newest ${commissions.length} entries; the CSV includes all of them. ` : '') +
                        'Commissions are calculated on what the customer paid after discounts and before tax.'}
                {tab === 'payouts' &&
                    'The reference is the PayPal or Wise transaction we noted for each transfer. Each statement lists the commissions a payout covered and can be printed or saved as a PDF.'}
            </p>
        </section>
    )
}
