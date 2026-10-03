import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Loader2, QrCode } from 'lucide-react'
import {
    acceptAffiliateTerms,
    AFFILIATE_TERMS_VERSION,
    affiliateLink,
    affiliateShortLink,
    affiliateSub,
    conversionRate,
    earningsPerVisitor,
    formatCents,
    formatDay,
    formatUtcDay,
    LINK_PAGES,
    PAYOUT_METHOD_LABEL,
    recentlyCancelledPayout,
    savePayoutMethod,
    sentPayouts,
    SUPPORT_EMAIL,
    type AffiliateApplication,
    type AffiliateDashboard as Dashboard,
    type AffiliateDay,
    type AffiliatePeriod,
    type PayoutMethod,
} from '@/lib/affiliate-program'
import { AccountChanges, PayoutAccountNotice } from './AccountChanges'
import { Announcement, TeamMessage } from './Announcement'
import { ChangeCode } from './ChangeCode'
import { AffiliateKit } from './AffiliateKit'
import { AffiliateMonths, AffiliateSources, AffiliateTables } from './AffiliateTables'
import { AffiliateTraffic } from './AffiliateTraffic'
import { GettingStarted, startSteps } from './GettingStarted'
import { LatestVisits } from './LatestVisits'
import { LinkQr } from './LinkQr'
import { ProfileCard } from './ProfileCard'
import { BillingDetails } from './BillingDetails'
import { SinceLastVisit } from './SinceLastVisit'
import { card, CopyButton, fieldLabel, input, Notice, Pill, toolButton } from './ui'

// /affiliate for an approved (or suspended) Affiliate: the program's announcement, the first steps
// until its link earns, what changed since its last visit, its link (and changing its code), link
// builder and QR code, balances and when pending money becomes payable, link results overall and
// per sub ID, payout method, monthly statement, its referrals, commissions and payouts, its
// profile, the changes to its account, and the promotion kit. An Affiliate that hasn't accepted the
// current program terms is asked to first.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LinkCard({
    code,
    formerCodes,
    promotionCode,
    paused,
    accessToken,
    codeChangeableAt,
    onChanged,
}: {
    code: string
    formerCodes: string[]
    promotionCode: string | null
    paused: boolean
    accessToken: string
    codeChangeableAt: string | null
    onChanged: (affiliate: AffiliateApplication) => void
}) {
    const [path, setPath] = useState<string>('/')
    const [subInput, setSubInput] = useState('')
    const [qrOpen, setQrOpen] = useState(false)
    const sub = affiliateSub(subInput)
    const subInvalid = subInput.trim() !== '' && !sub
    const link = affiliateLink(code)
    const built = affiliateLink(code, path, sub)
    const shortLink = affiliateShortLink(code)
    return (
        <section className={`${card} p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="text-sm text-content-muted">Your link</div>
                    <div className={`mt-1 break-words font-mono text-lg sm:truncate ${paused ? 'text-content-muted line-through' : 'text-content'}`}>
                        {/* On phones the link wraps before "?via=" so the code stays in one piece. */}
                        {link.split('?')[0]}
                        <wbr />?{link.split('?').slice(1).join('?')}
                    </div>
                </div>
                {!paused && <CopyButton text={link} />}
            </div>
            {!paused && <ChangeCode code={code} accessToken={accessToken} changeableAt={codeChangeableAt} onChanged={onChanged} />}
            {formerCodes.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-content-muted">
                    Links you already shared with{' '}
                    {formerCodes.map((former, i) => (
                        <span key={former}>
                            {i > 0 && ', '}
                            <span className="font-mono text-content-body">?via={former}</span>
                        </span>
                    ))}{' '}
                    still count as yours.
                </p>
            )}
            <div className="mt-5 flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="text-sm text-content-muted">Short link</div>
                    <div className={`mt-1 break-all font-mono text-lg ${paused ? 'text-content-muted line-through' : 'text-content'}`}>
                        {shortLink.replace(/^https:\/\//, '')}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-content-muted">
                        Easy to say out loud or print. It opens the home page and counts the same as your link. Add a sub ID after it, such as{' '}
                        <span className="break-all font-mono text-content-body">/go/{code}/podcast</span>.
                    </p>
                </div>
                {!paused && <CopyButton text={shortLink} />}
            </div>
            {promotionCode && (
                <div className="mt-5 flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm text-content-muted">Your promotion code</div>
                        <div className={`mt-1 font-mono text-lg ${paused ? 'text-content-muted line-through' : 'text-content'}`}>{promotionCode.toUpperCase()}</div>
                        <p className="mt-1 text-xs leading-5 text-content-muted">
                            Customers who enter it at checkout count as yours, even if they never opened your link. Handy for podcasts and videos.
                        </p>
                    </div>
                    {!paused && <CopyButton text={promotionCode.toUpperCase()} label="Copy" />}
                </div>
            )}
            {!paused && (
                <div className="mt-6 border-t border-hairline pt-5">
                    <h3 className="text-sm font-medium text-content">Build a link</h3>
                    <p className="mt-1 text-xs leading-5 text-content-muted">
                        Adding <span className="font-mono text-content-body">?via={code}</span> to any enconvo.com page works the same way. A
                        sub ID such as <span className="font-mono text-content-body">youtube</span> or{' '}
                        <span className="font-mono text-content-body">newsletter</span> shows which of your channels brings customers.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[13rem_minmax(0,16rem)]">
                        <label className="block">
                            <span className="text-xs text-content-muted">Page</span>
                            <select
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#2C3033] bg-[#0B0C0D] px-3 text-sm text-content focus:border-signal-green focus:outline-none"
                            >
                                {LINK_PAGES.map((page) => (
                                    <option key={page.path} value={page.path}>
                                        {page.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-content-muted">Sub ID (optional)</span>
                            <input
                                value={subInput}
                                onChange={(e) => setSubInput(e.target.value)}
                                maxLength={64}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                placeholder="youtube"
                                aria-invalid={subInvalid}
                                aria-describedby={subInvalid ? 'affiliate-sub-error' : undefined}
                                className={`mt-1.5 h-10 w-full rounded-lg border bg-[#0B0C0D] px-3 font-mono text-sm text-content placeholder:text-content-ash focus:outline-none ${subInvalid ? 'border-signal-red' : 'border-[#2C3033] focus:border-signal-green'}`}
                            />
                        </label>
                    </div>
                    {subInvalid && (
                        <p id="affiliate-sub-error" className="mt-2 text-xs text-signal-red">
                            Use letters, digits, dots, dashes or underscores, starting with a letter or digit. It&apos;s left out of the link until then.
                        </p>
                    )}
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-[#141617] px-3">
                            <span className="min-w-0 flex-1 truncate py-2.5 font-mono text-sm text-content-body">{built}</span>
                        </div>
                        <CopyButton text={built} label="Copy" />
                        <button
                            type="button"
                            onClick={() => setQrOpen(!qrOpen)}
                            aria-expanded={qrOpen}
                            aria-controls="affiliate-qr"
                            className={toolButton}
                        >
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                            QR code
                        </button>
                    </div>
                    {qrOpen && (
                        <LinkQr
                            id="affiliate-qr"
                            link={built}
                            sub={sub}
                            fileName={['enconvo', code, path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-'), sub, 'qr'].filter(Boolean).join('-')}
                        />
                    )}
                </div>
            )}
        </section>
    )
}

/** Referrals in review: why a commission says so, and whether it holds up the payout. Never which referral looked like what. */
function Review({ data }: { data: Dashboard }) {
    const review = data.review
    if (!review || review.referrals <= 0) return null
    const referrals = review.referrals === 1 ? '1 referral' : `${review.referrals} referrals`
    return (
        <Notice tone={review.holds_payout ? 'warn' : 'info'} title={`${referrals} in review`}>
            We review referrals that look like your own purchases, as the{' '}
            <Link href="/affiliate/terms" className="text-signal-blue hover:underline">
                program terms
            </Link>{' '}
            say. {formatCents(review.amount)} of commission waits for that review
            {review.holds_payout ? ', and your next payout goes out once it is done' : ''}. A referral we clear is paid as usual; one
            we void is taken back.
        </Notice>
    )
}

/** A payout Enconvo cancelled lately: the money never arrived, so the Affiliate should check where it goes. */
export function CancelledPayoutNotice({ data }: { data: Dashboard }) {
    const payout = recentlyCancelledPayout(data.payouts)
    if (!payout) return null
    return (
        <Notice
            tone="warn"
            title={`We cancelled your ${formatCents(payout.amount)} payout of ${formatDay(payout.paid_at)}`}
            action={
                <a href="#payout" className="flex-none text-sm font-medium text-signal-blue hover:underline">
                    Check payout method
                </a>
            }
        >
            {payout.cancel_reason && <span className="block text-content-body">{payout.cancel_reason}</span>}
            The commissions it covered are back in your balance, and a later payout sends them. Check that your payout method is right;
            questions go to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal-blue hover:underline">{SUPPORT_EMAIL}</a>.
        </Notice>
    )
}

function Balances({ data, payoutMethodSet }: { data: Dashboard; payoutMethodSet: boolean }) {
    const b = data.balances
    const minimum = data.program.minimum_payout
    const last = sentPayouts(data.payouts)[0]
    const net = b.earned - b.reversed
    const short = minimum - b.payable
    const tiles = [
        {
            label: 'Payable now',
            value: b.payable,
            accent: true,
            note:
                b.payable <= 0
                    ? 'Nothing past the refund window yet'
                    : data.review?.holds_payout
                      ? 'On hold until we finish a review'
                      : short > 0
                      ? `${formatCents(short)} more to reach the ${formatCents(minimum, { cents: false })} minimum`
                      : payoutMethodSet
                        ? 'In the next monthly payout'
                        : 'Add a payout method to get paid',
        },
        { label: 'Pending', value: b.pending, note: `Inside the ${data.program.hold_days}-day refund window` },
        {
            label: 'Paid out',
            value: b.paid,
            note: last ? `Last payout ${formatDay(last.paid_at)} by ${PAYOUT_METHOD_LABEL[last.method] ?? last.method}` : 'No payouts yet',
        },
        {
            label: 'Earned all time',
            value: net,
            note: b.reversed > 0 ? `After ${formatCents(b.reversed)} taken back by refunds, disputes, voids and deductions` : b.earned > 0 ? 'No refunds so far' : 'Every commission adds up here',
        },
    ]
    return (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {tiles.map((tile) => (
                <div key={tile.label} className={`${card} p-4 sm:p-5`}>
                    <div className="text-sm text-content-muted">{tile.label}</div>
                    <div className={`mt-2 text-2xl font-semibold tabular-nums sm:text-3xl ${tile.accent && tile.value > 0 ? 'text-signal-green' : 'text-content'}`}>
                        {formatCents(tile.value)}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-content-muted">{tile.note}</div>
                    {tile.accent && short > 0 && b.payable > 0 && (
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1B1E20]" aria-hidden="true">
                            <div className="h-full rounded-full bg-signal-green" style={{ width: `${Math.min(100, (b.payable / minimum) * 100)}%` }} />
                        </div>
                    )}
                </div>
            ))}
        </section>
    )
}

const utcDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

const RELEASES_SHOWN = 5

function Releases({ data }: { data: Dashboard }) {
    const [expanded, setExpanded] = useState(false)
    const releases = data.releases ?? []
    const b = data.balances
    if (!b || releases.length === 0) return null
    const minimum = data.program.minimum_payout
    let payable = b.payable
    const rows = releases.map((release) => ({ ...release, payable: (payable += release.amount) }))
    // Mark the day the balance reaches the minimum for good, not one a later deduction undoes.
    let from = rows.length
    while (from > 0 && rows[from - 1].payable >= minimum) from--
    const reaches = from < rows.length && (from > 0 || b.payable < minimum) ? rows[from].day : null
    const shown = expanded ? rows : rows.slice(0, RELEASES_SHOWN)
    const short = minimum - payable
    return (
        <section className={card}>
            <div className="px-6 pt-5">
                <h2 className="text-lg font-semibold text-content">Coming up</h2>
                <p className="mt-1 text-sm leading-6 text-content-muted">
                    Pending money becomes payable when its {data.program.hold_days}-day refund window ends. A refund before then still lowers it.
                </p>
            </div>
            <ol className="mt-3 divide-y divide-hairline border-t border-hairline">
                {shown.map((row) => (
                    <li key={row.day} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 text-sm sm:gap-x-4">
                        <span className="w-14 flex-none text-content-body sm:w-16">{utcDay(row.day)}</span>
                        <span className={`w-20 flex-none text-right font-medium tabular-nums sm:w-24 ${row.amount < 0 ? 'text-signal-yellow' : 'text-signal-green'}`}>
                            {row.amount < 0 ? `−${formatCents(-row.amount)}` : `+${formatCents(row.amount)}`}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-nowrap text-content-muted">
                            Payable then <span className="tabular-nums text-content-body">{formatCents(row.payable)}</span>
                        </span>
                        {row.day === reaches && <Pill tone="green">Reaches the {formatCents(minimum, { cents: false })} minimum</Pill>}
                    </li>
                ))}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-6 py-4 text-xs leading-5 text-content-muted">
                <span>
                    {short > 0
                        ? `Even with all of it, your balance stays ${formatCents(short)} short of the ${formatCents(minimum, { cents: false })} minimum. It carries over until it gets there.`
                        : 'We pay early each month, once your payable balance is at the minimum.'}
                </span>
                {rows.length > RELEASES_SHOWN && (
                    <button type="button" onClick={() => setExpanded(!expanded)} className="font-medium text-signal-blue hover:underline">
                        {expanded ? 'Show fewer' : `Show all ${rows.length} days`}
                    </button>
                )}
            </div>
        </section>
    )
}

function Activity({ data }: { data: Dashboard }) {
    const periods: AffiliatePeriod[] = data.periods ?? []
    // Days of the period shown, 0 for all time: the last 30 days, or all time from a Worker without periods.
    const [shown, setShown] = useState(() => (periods.some((p) => p.days === 30) ? 30 : 0))
    const period = periods.find((p) => p.days === shown) ?? null
    const daily: AffiliateDay[] = data.daily ?? []
    // The chart shows the period's days, and every day there is (the last 90) for all time.
    const days = period ? daily.slice(-period.days) : daily
    const totals = data.totals ?? { visitors: 0, signups: 0, customers: 0 }
    const results = period ?? totals
    const sums = days.reduce((sum, d) => ({ visitors: sum.visitors + d.visitors, signups: sum.signups + d.signups, purchases: sum.purchases + d.purchases }), {
        visitors: 0,
        signups: 0,
        purchases: 0,
    })
    const max = Math.max(1, ...days.map((d) => d.visitors))
    const stats = [
        { label: 'Visitors', value: results.visitors.toLocaleString('en-US') },
        { label: 'Signed up', value: results.signups.toLocaleString('en-US') },
        {
            label: 'Customers',
            value: results.customers.toLocaleString('en-US'),
            hint: period ? `People who bought through your link in the last ${period.days} days.` : undefined,
        },
        {
            label: 'Visitor → customer',
            value: (period ? conversionRate(period.visitors, period.converted) : conversionRate(totals.visitors, totals.customers)) ?? '—',
            hint: period ? `Of the people who opened your link in the last ${period.days} days, the share who have bought.` : undefined,
        },
        { label: 'Earned per visitor', value: earningsPerVisitor(results.visitors, results.commission) ?? '—' },
        period
            ? {
                  label: 'Commission',
                  value: formatCents(period.commission),
                  hint: `What your link earned in the last ${period.days} days, net of refunds. Customers of your promotion code alone and adjustments are left out.`,
              }
            : {
                  label: 'From renewals a month',
                  value: totals.recurring ? `≈${formatCents(totals.recurring)}` : '—',
                  hint: totals.recurring
                      ? `About what the Cloud plans that renew earn you each month: each customer's latest payment at your current rate, a yearly plan spread over 12 months. Discounts, upgrades and cancellations change it.`
                      : 'Customers whose Cloud plan renews earn you commission on every renewal; about how much a month shows here.',
              },
    ]
    return (
        <section className={`${card} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-content">Your link&apos;s results</h2>
                {periods.length > 0 ? (
                    <div role="group" aria-label="Period" className="flex rounded-lg border border-hairline p-0.5 text-xs">
                        {[...periods.map((p) => p.days), 0].map((option) => (
                            <button
                                key={option}
                                type="button"
                                aria-pressed={shown === option}
                                onClick={() => setShown(option)}
                                className={`min-h-[28px] whitespace-nowrap rounded-md px-2.5 font-medium transition-colors ${
                                    shown === option ? 'bg-white/[0.08] text-content' : 'text-content-muted hover:text-content'
                                }`}
                            >
                                {option ? `${option} days` : 'All time'}
                            </button>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-content-muted">All time</span>
                )}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => (
                    <div key={stat.label} title={stat.hint}>
                        <dd className="text-2xl font-semibold tabular-nums text-content">{stat.value}</dd>
                        <dt className="mt-1 text-xs text-content-muted">{stat.label}</dt>
                    </div>
                ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-content">Last {days.length} days</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 whitespace-nowrap text-xs text-content-muted">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-[#2E4A5C]" aria-hidden="true" />
                        Visitors
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-signal-blue" aria-hidden="true" />
                        Sign-ups
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-signal-green" aria-hidden="true" />
                        Purchases
                    </span>
                </div>
            </div>
            <div
                className={`relative mt-4 flex h-32 items-end ${days.length > 31 ? 'gap-px' : 'gap-0.5 sm:gap-1'}`}
                role="img"
                aria-label={`Last ${days.length} days: ${sums.visitors} visits, ${sums.signups} sign-ups, ${sums.purchases} purchases.`}
            >
                {sums.visitors === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-content-muted">
                        No visits in the last {days.length} days. Share your link and visits appear here as they happen.
                    </p>
                )}
                {days.map((d) => (
                    <div
                        key={d.day}
                        className="relative flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${utcDay(d.day)}: ${d.visitors} visitors, ${d.signups} sign-ups, ${d.purchases} purchases`}
                    >
                        {d.purchases > 0 && <span className="mx-auto mb-1 h-1.5 w-1.5 flex-none rounded-full bg-signal-green" aria-hidden="true" />}
                        <div className="relative w-full rounded-t-sm bg-[#2E4A5C]" style={{ height: `${Math.max(d.visitors > 0 ? 3 : 1, (d.visitors / max) * 100)}%` }}>
                            {d.signups > 0 && (
                                <div
                                    className="absolute inset-x-0 bottom-0 rounded-t-sm bg-signal-blue"
                                    style={{ height: `${Math.min(100, Math.max(8, (d.signups / Math.max(1, d.visitors)) * 100))}%` }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {days.length > 0 && (
                <div className="mt-2 flex justify-between text-xs text-content-ash">
                    <span>{utcDay(days[0].day)}</span>
                    <span>{utcDay(days[days.length - 1].day)}</span>
                </div>
            )}
        </section>
    )
}

/**
 * Whether the account accepted the program terms as they are now: a version on or after
 * AFFILIATE_TERMS_VERSION, or, from a page that didn't say which version, a day on or after it.
 * Unknown (true) from a Worker that doesn't report acceptance.
 */
function acceptedCurrentTerms(affiliate: AffiliateApplication): boolean {
    if (affiliate.terms_accepted_at === undefined) return true
    if (!affiliate.terms_accepted_at) return false
    const accepted = affiliate.terms_version ?? new Date(affiliate.terms_accepted_at).toISOString().slice(0, 10)
    return accepted >= AFFILIATE_TERMS_VERSION
}

function TermsNotice({
    affiliate,
    accessToken,
    onAccepted,
}: {
    affiliate: AffiliateApplication
    accessToken: string
    onAccepted: (affiliate: AffiliateApplication) => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const never = !affiliate.terms_accepted_at

    async function accept() {
        if (saving) return
        setSaving(true)
        setError(null)
        const result = await acceptAffiliateTerms(accessToken)
        setSaving(false)
        if (result.ok) onAccepted(result.data)
        else setError(result.message)
    }

    const terms = (
        <Link href="/affiliate/terms" className="text-signal-blue hover:underline">
            Affiliate program terms
        </Link>
    )
    return (
        <Notice
            tone="warn"
            title={never ? 'Accept the program terms' : 'The program terms changed'}
            action={
                <button
                    type="button"
                    onClick={accept}
                    disabled={saving}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    I accept the terms
                </button>
            }
        >
            {never ? (
                <>
                    You joined the program without accepting the {terms} on this site, so your account has no record of it. Read
                    them, then accept them. Your link keeps earning either way, but we ask for this before we send a payout.
                </>
            ) : (
                <>
                    We updated the {terms} on {formatUtcDay(AFFILIATE_TERMS_VERSION)}. Read them, then accept them to keep your record
                    current. Commissions already recorded are paid under the terms in place when they were earned.
                </>
            )}
            {error && (
                <span role="alert" className="mt-2 block text-xs text-signal-red">
                    {error}
                </span>
            )}
        </Notice>
    )
}

function PayoutMethodCard({
    affiliate,
    accessToken,
    minimum,
    onSaved,
}: {
    affiliate: AffiliateApplication
    accessToken: string
    minimum: number
    onSaved: (affiliate: AffiliateApplication) => void
}) {
    const [method, setMethod] = useState<PayoutMethod>(affiliate.payout_method ?? 'paypal')
    const [account, setAccount] = useState(affiliate.payout_account ?? '')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
    const unchanged = method === affiliate.payout_method && account.trim() === (affiliate.payout_account ?? '')
    const valid = EMAIL.test(account.trim())

    async function save(event: FormEvent) {
        event.preventDefault()
        if (!valid || unchanged || saving) return
        setSaving(true)
        setMessage(null)
        const result = await savePayoutMethod(accessToken, method, account.trim())
        setSaving(false)
        if (result.ok) {
            onSaved(result.data)
            setMessage({ error: false, text: 'Saved. Future payouts go here.' })
        } else {
            setMessage({ error: true, text: result.message })
        }
    }

    return (
        <form id="payout" onSubmit={save} className={`scroll-mt-28 ${card} p-6`}>
            <h2 className="text-lg font-semibold text-content">Payout method</h2>
            <div role="radiogroup" aria-label="Payout method" className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-hairline bg-[#0B0C0D] p-1">
                {(['paypal', 'wise'] as PayoutMethod[]).map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={method === key}
                        onClick={() => {
                            setMethod(key)
                            setMessage(null)
                        }}
                        className={`min-h-[40px] rounded-lg text-sm font-medium transition-colors ${method === key ? 'bg-content text-canvas' : 'text-content-body hover:text-content'}`}
                    >
                        {PAYOUT_METHOD_LABEL[key]}
                    </button>
                ))}
            </div>
            <label className="mt-4 block">
                <span className={fieldLabel}>{PAYOUT_METHOD_LABEL[method]} account email</span>
                <input
                    className={`${input} mt-2`}
                    type="email"
                    value={account}
                    onChange={(e) => {
                        setAccount(e.target.value)
                        setMessage(null)
                    }}
                    maxLength={200}
                    autoComplete="email"
                    placeholder="you@example.com"
                />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={!valid || unchanged || saving}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Save payout method
                </button>
                {message && (
                    <span role="status" className={`text-xs ${message.error ? 'text-signal-red' : 'text-signal-green'}`}>
                        {message.text}
                    </span>
                )}
            </div>
            <p className="mt-4 text-xs leading-5 text-content-muted">
                We pay early each month, in USD, once your payable balance is {formatCents(minimum, { cents: false })} or more. Smaller
                balances carry over. {PAYOUT_METHOD_LABEL[method]} may charge its own fees on receipt. If you change the account after a
                payout, we may confirm the change with you before paying the new one.
            </p>
        </form>
    )
}

export function AffiliateDashboard({
    data,
    accessToken,
    email,
    onAffiliateChanged,
}: {
    data: Dashboard
    accessToken: string
    email: string | null
    onAffiliateChanged: (affiliate: AffiliateApplication) => void
}) {
    const affiliate = data.affiliate
    const suspended = affiliate.status === 'suspended'
    const payoutMethodSet = !!(affiliate.payout_method && affiliate.payout_account)
    const termsAccepted = acceptedCurrentTerms(affiliate)
    // A new Affiliate's steps cover the payout method, so the warning waits until the link earns.
    const starting = !suspended && startSteps(data, termsAccepted) !== null

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-content sm:text-4xl">Affiliate dashboard</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-content-muted">
                        {suspended ? <Pill tone="red">Paused</Pill> : <Pill tone="green">Approved</Pill>}
                        <span>{affiliate.commission_rate}% commission</span>
                        {affiliate.approved_at && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>Approved {formatDay(affiliate.approved_at)}</span>
                            </>
                        )}
                        {email && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{email}</span>
                            </>
                        )}
                    </div>
                </div>
                <Link href="/affiliate/terms" className="text-sm text-signal-blue hover:underline">
                    Program terms
                </Link>
            </header>

            {suspended && (
                <Notice tone="error" title="Your Affiliate link is paused">
                    New payments through your link don&apos;t earn commissions right now. Your existing balance and records stay
                    here. Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal-blue hover:underline">{SUPPORT_EMAIL}</a> from
                    this account if you have questions.
                </Notice>
            )}
            <TeamMessage message={affiliate.message} />
            {!termsAccepted && <TermsNotice affiliate={affiliate} accessToken={accessToken} onAccepted={onAffiliateChanged} />}
            {!suspended && !starting && !payoutMethodSet && (
                <Notice
                    tone="warn"
                    title="Add where we should send your payouts"
                    action={
                        <a href="#payout" className="flex-none text-sm font-medium text-signal-blue hover:underline">
                            Add payout method
                        </a>
                    }
                >
                    We can&apos;t pay commissions until you add a PayPal or Wise account.
                </Notice>
            )}
            <PayoutAccountNotice changes={data.account_changes} />
            <CancelledPayoutNotice data={data} />
            <Announcement announcement={data.announcement} />
            {starting && <GettingStarted data={data} termsAccepted={termsAccepted} />}
            <SinceLastVisit data={data} />

            <LinkCard
                code={affiliate.code}
                formerCodes={data.former_codes ?? []}
                promotionCode={affiliate.promotion_code ?? null}
                paused={suspended}
                accessToken={accessToken}
                codeChangeableAt={data.code_changeable_at ?? null}
                onChanged={onAffiliateChanged}
            />
            <Review data={data} />
            <Balances data={data} payoutMethodSet={payoutMethodSet} />
            <Releases data={data} />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Activity data={data} />
                <PayoutMethodCard affiliate={affiliate} accessToken={accessToken} minimum={data.program.minimum_payout} onSaved={onAffiliateChanged} />
            </div>
            <AffiliateSources data={data} />
            <AffiliateTraffic data={data} />
            <LatestVisits visits={data.recent_visits ?? []} />
            <AffiliateMonths data={data} />
            <AffiliateTables data={data} accessToken={accessToken} />
            <ProfileCard affiliate={affiliate} accessToken={accessToken} onSaved={onAffiliateChanged} />
            <BillingDetails affiliate={affiliate} accessToken={accessToken} onSaved={onAffiliateChanged} />
            <AccountChanges data={data} />
            {!suspended && <AffiliateKit code={affiliate.code} />}
        </div>
    )
}
