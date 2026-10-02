import {
    accountChangeText,
    accountValue,
    formatDay,
    recentPayoutAccountChange,
    SUPPORT_EMAIL,
    type AffiliateAccountChange,
    type AffiliateDashboard,
} from '@/lib/affiliate-program'
import { card, Notice } from './ui'

// The Affiliate's account history on /affiliate: when its status, link code, rate, promotion code,
// payout account or accepted terms changed, and whether it or Enconvo changed them, plus a notice
// while a payout account change is recent, so the account's owner can tell if it wasn't them.

type Group = { day: string; at: string; by: AffiliateAccountChange['by']; changes: AffiliateAccountChange[] }

/** Changes in a row on the same day by the same side as one entry. */
function grouped(changes: AffiliateAccountChange[]): Group[] {
    const groups: Group[] = []
    for (const change of changes) {
        const day = formatDay(change.changed_at)
        const last = groups[groups.length - 1]
        if (last && last.day === day && last.by === change.by) last.changes.push(change)
        else groups.push({ day, at: change.changed_at, by: change.by, changes: [change] })
    }
    return groups
}

export function PayoutAccountNotice({ changes }: { changes: AffiliateAccountChange[] | undefined }) {
    const change = recentPayoutAccountChange(changes)
    if (!change) return null
    const moved = `payouts now go to ${accountValue(change.field, change.new_value)} instead of ${accountValue(change.field, change.old_value)}`
    return (
        <Notice tone="info" title={`Your payout account changed on ${formatDay(change.changed_at)}`}>
            {change.by === 'enconvo' ? `Enconvo changed it: ${moved}. If you didn't ask for this` : `${moved.charAt(0).toUpperCase()}${moved.slice(1)}. If you didn't make this change`},
            email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal-blue hover:underline">{SUPPORT_EMAIL}</a> from this
            account before your next payout.
        </Notice>
    )
}

export function AccountChanges({ data }: { data: AffiliateDashboard }) {
    const changes = data.account_changes
    // A Worker from before the history doesn't send it.
    if (!changes) return null
    const groups = grouped(changes)
    return (
        <section className={card}>
            <div className="px-6 pt-5">
                <h2 className="text-lg font-semibold text-content">Account changes</h2>
                <p className="mt-1 text-sm leading-6 text-content-muted">
                    Your status, link code, commission rate, promotion code, payout account and accepted terms, newest first.
                </p>
            </div>
            {groups.length === 0 ? (
                <p className="px-6 pb-5 pt-3 text-sm leading-6 text-content-muted">
                    No changes yet. We keep them from October 2, 2026 on.
                </p>
            ) : (
                <ol className="mt-3 divide-y divide-hairline border-t border-hairline">
                    {groups.map((group) => (
                        <li key={`${group.at}-${group.by}-${group.changes.length}`} className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:gap-6">
                            <div className="flex-none text-sm text-content-muted sm:w-44">
                                <time dateTime={group.at}>{group.day}</time> · {group.by === 'you' ? 'You' : 'Enconvo'}
                            </div>
                            <ul className="min-w-0 flex-1 space-y-1">
                                {group.changes.map((change, index) => {
                                    const { label, text } = accountChangeText(change)
                                    return (
                                        <li key={index} className="break-words text-sm leading-6 text-content-body">
                                            <span className="text-content">{label}:</span> {text}
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    ))}
                </ol>
            )}
            {data.account_changes_truncated && (
                <p className="border-t border-hairline px-6 py-3 text-xs leading-5 text-content-ash">Showing the latest 20 changes.</p>
            )}
        </section>
    )
}
