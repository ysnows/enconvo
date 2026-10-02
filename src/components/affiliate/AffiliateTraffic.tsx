import { type AffiliateDashboard, type AffiliateTrafficRow } from '@/lib/affiliate-program'
import { card } from './ui'

// Where the link's visitors came from and which page they landed on (ADR 0090). Visits keep only
// the referring host and the landing path, so this is as much as anyone can see.

function TrafficList({ title, column, unknown, rest, rows }: { title: string; column: string; unknown: string; rest: string; rows: AffiliateTrafficRow[] }) {
    const max = Math.max(1, ...rows.map((row) => row.visitors))
    return (
        <div className="min-w-0">
            <h3 className="text-sm font-medium text-content">{title}</h3>
            <div className="mt-3 flex items-center gap-3 border-b border-hairline pb-2 text-xs font-medium uppercase tracking-[0.08em] text-content-muted">
                <span className="min-w-0 flex-1">{column}</span>
                <span className="w-16 flex-none text-right">Visitors</span>
                <span className="w-20 flex-none text-right">Customers</span>
            </div>
            <ol className="divide-y divide-hairline">
                {rows.map((row) => (
                    <li key={row.value ?? ''} className="flex items-center gap-3 py-2.5 text-sm">
                        <span className="relative min-w-0 flex-1">
                            <span
                                className="absolute inset-y-[-4px] left-[-6px] rounded bg-[#2E4A5C]/40"
                                style={{ width: `calc(${(row.visitors / max) * 100}% + 6px)` }}
                                aria-hidden="true"
                            />
                            <span className={`relative block truncate ${row.value ? 'font-mono text-content' : 'text-content-muted'}`} title={row.value ?? unknown}>
                                {row.value ?? unknown}
                            </span>
                        </span>
                        <span className="w-16 flex-none text-right tabular-nums text-content-body">{row.visitors.toLocaleString('en-US')}</span>
                        <span className={`w-20 flex-none text-right tabular-nums ${row.customers > 0 ? 'font-medium text-signal-green' : 'text-content-ash'}`}>
                            {row.customers.toLocaleString('en-US')}
                        </span>
                    </li>
                ))}
            </ol>
            {rest && <p className="border-t border-hairline pt-2.5 text-xs text-content-muted">{rest}</p>}
        </div>
    )
}

/** Top referring sites and landing pages; nothing until the link has a visitor. */
export function AffiliateTraffic({ data }: { data: AffiliateDashboard }) {
    const traffic = data.traffic
    const visitors = data.totals?.visitors ?? 0
    if (!traffic || visitors === 0 || traffic.referrers.length === 0) return null
    const rest = (rows: AffiliateTrafficRow[], from: string) => {
        const count = visitors - rows.reduce((sum, row) => sum + row.visitors, 0)
        return count > 0 ? `${count.toLocaleString('en-US')} more ${count === 1 ? 'visitor' : 'visitors'} from ${from}` : ''
    }
    return (
        <section className={`${card} p-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-content">Where your visitors come from</h2>
                <span className="text-xs text-content-muted">All time</span>
            </div>
            <div className="mt-5 grid gap-8 lg:grid-cols-2">
                <TrafficList title="Referring sites" column="Site" unknown="Direct or unknown" rest={rest(traffic.referrers, 'other sites')} rows={traffic.referrers} />
                <TrafficList title="Landing pages" column="Page" unknown="Unknown page" rest={rest(traffic.landing_pages, 'other pages')} rows={traffic.landing_pages} />
            </div>
            <p className="mt-5 text-xs leading-5 text-content-ash">
                Each visitor counts once, by the first time they opened your link. Apps, email clients and typed links often don&apos;t say where a
                visitor came from, so they show as direct or unknown. Customers are the visitors who later bought through your link.
            </p>
        </section>
    )
}
