import { useEffect, useState } from 'react'
import { formatCents, sentPayouts, type AffiliateDashboard } from '@/lib/affiliate-program'
import { card } from './ui'

// What changed on /affiliate since the Affiliate last opened it in this browser: new referrals,
// commissions earned, amounts taken back and payouts sent, the news affiliate tools send as email
// digests. Only the time of the last visit is stored, and only in this browser.

const SEEN = 'enconvo-affiliate-seen:'

function store(kind: 'localStorage' | 'sessionStorage'): Storage | null {
    try {
        return window[kind]
    } catch {
        return null
    }
}

/**
 * When the Affiliate last opened the page before this browser session, or null for a first visit.
 * Every visit records itself; a reload within the session keeps the same starting point, so the
 * summary doesn't vanish on refresh.
 */
function useLastVisit(code: string): string | null {
    const [since, setSince] = useState<string | null>(null)
    useEffect(() => {
        const key = SEEN + code
        try {
            const session = store('sessionStorage')
            const local = store('localStorage')
            const kept = session?.getItem(key) ?? null
            const last = kept ?? local?.getItem(key) ?? ''
            if (kept === null) session?.setItem(key, last)
            local?.setItem(key, new Date().toISOString())
            setSince(last && !Number.isNaN(Date.parse(last)) ? last : null)
        } catch {
            // Storage is blocked: no summary.
        }
    }, [code])
    return since
}

export interface VisitNews {
    referrals: number
    earned: { count: number; amount: number }
    taken_back: number
    paid_out: { count: number; amount: number }
    /** A list stops at its newest entries and all of them are newer, so there may be more. */
    more: boolean
}

/** What's newer than `since` in the dashboard's lists, or null when nothing is. */
export function visitNews(data: AffiliateDashboard, since: string): VisitNews | null {
    const from = Date.parse(since)
    const after = (value: string) => Date.parse(value) > from
    const referrals = (data.referrals ?? []).filter((row) => after(row.joined_at))
    const entries = (data.commissions ?? []).filter((entry) => after(entry.earned_at))
    const payouts = sentPayouts(data.payouts).filter((payout) => after(payout.paid_at))
    const earned = entries.filter((entry) => entry.amount > 0)
    const news: VisitNews = {
        referrals: referrals.length,
        earned: { count: earned.length, amount: earned.reduce((sum, entry) => sum + entry.amount, 0) },
        taken_back: entries.reduce((sum, entry) => sum + Math.min(0, entry.amount), 0),
        paid_out: { count: payouts.length, amount: payouts.reduce((sum, payout) => sum + payout.amount, 0) },
        more:
            (!!data.referrals_truncated && referrals.length === (data.referrals ?? []).length && referrals.length > 0) ||
            (!!data.commissions_truncated && entries.length === (data.commissions ?? []).length && entries.length > 0),
    }
    return news.referrals || news.earned.count || news.taken_back || news.paid_out.count ? news : null
}

type Item = { key: string; value: string; label: string; tone?: string }

const when = (value: string) => new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function SinceLastVisit({ data }: { data: AffiliateDashboard }) {
    const since = useLastVisit(data.affiliate?.code ?? '')
    const news = since ? visitNews(data, since) : null
    if (!since || !news) return null
    const plus = news.more ? '+' : ''
    const items = (
        [
            news.referrals > 0 && {
                key: 'referrals',
                value: `${news.referrals.toLocaleString('en-US')}${plus}`,
                label: news.referrals === 1 && !plus ? 'new referral' : 'new referrals',
            },
            news.earned.count > 0 && {
                key: 'earned',
                value: `+${formatCents(news.earned.amount)}`,
                label: `from ${news.earned.count.toLocaleString('en-US')}${plus} ${news.earned.count === 1 && !plus ? 'commission' : 'commissions'}`,
                tone: 'text-signal-green',
            },
            news.taken_back < 0 && {
                key: 'taken_back',
                value: `−${formatCents(-news.taken_back)}`,
                label: 'taken back by refunds, disputes or deductions',
                tone: 'text-signal-red',
            },
            news.paid_out.count > 0 && {
                key: 'paid_out',
                value: formatCents(news.paid_out.amount),
                label: news.paid_out.count === 1 ? 'paid out to you' : `paid out in ${news.paid_out.count} payouts`,
            },
        ] as (Item | false)[]
    ).filter((item): item is Item => !!item)
    return (
        <section className={`${card} p-5`} aria-labelledby="since-last-visit">
            <h2 id="since-last-visit" className="text-sm font-medium text-content">
                Since your last visit <span className="font-normal text-content-muted">on {when(since)}</span>
            </h2>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
                {items.map((item) => (
                    <div key={item.key} className="flex items-baseline gap-2">
                        <dd className={`text-lg font-semibold tabular-nums ${item.tone ?? 'text-content'}`}>{item.value}</dd>
                        <dt className="text-sm text-content-muted">{item.label}</dt>
                    </div>
                ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-content-ash">The details are in Referrals, Commissions and Payouts below.</p>
        </section>
    )
}
