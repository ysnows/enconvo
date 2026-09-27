import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
    clearInviteCookie,
    formatRewardUsd,
    getInviteSummary,
    normalizeInviteCode,
    pointsToUsd,
    redeemInvite,
    redeemPendingInvite,
    type InviteSummary,
} from '@/lib/invite'

const STATUS_LABEL = {
    pending: 'Waiting for app sign-in',
    qualified: 'Joined',
    revoked: 'Revoked',
} as const

const STATUS_CLASS = {
    pending: 'text-gray-400',
    qualified: 'text-green-400',
    revoked: 'text-red-400',
} as const

function formatDate(value: string | null) {
    if (!value) return ''
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        const field = document.createElement('textarea')
        field.value = text
        field.setAttribute('readonly', '')
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        const copied = document.execCommand('copy')
        document.body.removeChild(field)
        return copied
    }
}

/** Account page "Invite friends": the user's code and link, results, and code entry. */
export default function InviteFriends({ accessToken }: { accessToken: string }) {
    const [summary, setSummary] = useState<InviteSummary | null>(null)
    const [loadError, setLoadError] = useState('')
    const [copied, setCopied] = useState<'code' | 'link' | null>(null)
    const [codeInput, setCodeInput] = useState('')
    const [redeeming, setRedeeming] = useState(false)
    const [redeemError, setRedeemError] = useState('')
    const loadId = useRef(0)

    const load = useCallback(async () => {
        const id = ++loadId.current
        setLoadError('')
        const result = await getInviteSummary(accessToken)
        if (id !== loadId.current) return
        if (result.ok) setSummary(result.data)
        else setLoadError(result.message)
    }, [accessToken])

    useEffect(() => {
        void load()
        // An Invite link opened before signing in is redeemed here if no sign-in page did it.
        void redeemPendingInvite(accessToken).then((result) => {
            if (result?.ok) void load()
        })
    }, [accessToken, load])

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(null), 2000)
        return () => clearTimeout(timer)
    }, [copied])

    const handleCopy = async (kind: 'code' | 'link', text: string) => {
        if (await copyText(text)) setCopied(kind)
    }

    const handleRedeem = async (event: FormEvent) => {
        event.preventDefault()
        const code = normalizeInviteCode(codeInput)
        if (!code) {
            setRedeemError('Enter a valid invite code.')
            return
        }
        setRedeeming(true)
        setRedeemError('')
        const result = await redeemInvite(accessToken, code, 'code')
        setRedeeming(false)
        if (!result.ok) {
            setRedeemError(result.message)
            return
        }
        clearInviteCookie()
        setCodeInput('')
        await load()
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Invite friends</h3>

            {!summary && !loadError && (
                <div className="animate-pulse space-y-4">
                    <div className="h-4 w-3/4 bg-gray-800 rounded"></div>
                    <div className="h-10 bg-gray-800 rounded"></div>
                    <div className="h-10 bg-gray-800 rounded"></div>
                </div>
            )}

            {!summary && loadError && (
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-red-400" role="status">{loadError}</span>
                    <button
                        onClick={() => void load()}
                        className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md text-gray-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {summary && (() => {
                const reward = formatRewardUsd(summary.reward_usd)
                const { redemption } = summary
                return (
                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-gray-400">
                            Give {reward}, get {reward}. When a friend signs up with your link or code and signs in to
                            the Enconvo app on a device that&apos;s new to Enconvo, you both get {reward} in Cloud points.
                        </p>

                        {summary.code_disabled && (
                            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200" role="status">
                                Your invite code is no longer active, so new friends can&apos;t use it.
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                            <div>
                                <label className="block text-sm text-gray-400">Your invite code</label>
                                <div className="mt-1 flex items-center justify-between gap-2 p-3 bg-gray-800 rounded-md">
                                    <span className={`font-mono tracking-wider ${summary.code_disabled ? 'text-gray-500 line-through' : ''}`}>
                                        {summary.code}
                                    </span>
                                    <button
                                        onClick={() => void handleCopy('code', summary.code)}
                                        disabled={summary.code_disabled}
                                        className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                                    >
                                        {copied === 'code' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Invite link</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className={`min-w-0 flex-1 truncate p-3 bg-gray-800 rounded-md ${summary.code_disabled ? 'text-gray-500' : ''}`}>
                                        {summary.link}
                                    </div>
                                    <button
                                        onClick={() => void handleCopy('link', summary.link)}
                                        disabled={summary.code_disabled}
                                        className="flex-none px-4 py-3 text-sm bg-blue-500 hover:bg-blue-600 rounded-md text-white transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
                                    >
                                        {copied === 'link' ? 'Copied' : 'Copy link'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Invited', value: String(summary.stats.invited) },
                                { label: 'Joined', value: String(summary.stats.qualified) },
                                { label: 'Earned', value: formatRewardUsd(pointsToUsd(summary.stats.points_earned)) },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                                    <div className="text-xs text-gray-500">{stat.label}</div>
                                    <div className="mt-1 text-lg font-semibold">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {summary.invitees.length > 0 && (
                            <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.025]">
                                {summary.invitees.slice(0, 20).map((invitee) => (
                                    <li key={invitee.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                        <span className="min-w-0 truncate text-gray-200">{invitee.email}</span>
                                        <span className="flex-none text-xs">
                                            <span className={STATUS_CLASS[invitee.status]}>{STATUS_LABEL[invitee.status]}</span>
                                            <span className="ml-2 text-gray-500">{formatDate(invitee.qualified_at || invitee.redeemed_at)}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {redemption.redeemed && (
                            <p className="text-sm text-gray-400" role="status">
                                You joined with an invite from {redemption.inviter}.{' '}
                                {redemption.status === 'qualified' && `You both got ${formatRewardUsd(pointsToUsd(redemption.reward_points))} in Cloud points.`}
                                {redemption.status === 'pending' && `Sign in to the Enconvo app on a device that's new to Enconvo to get your ${formatRewardUsd(pointsToUsd(redemption.reward_points))}.`}
                                {redemption.status === 'revoked' && 'This invite was revoked.'}
                            </p>
                        )}

                        {redemption.can_redeem && (
                            <form onSubmit={handleRedeem}>
                                <label htmlFor="invite-code" className="block text-sm text-gray-400">Have an invite code?</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        id="invite-code"
                                        value={codeInput}
                                        onChange={(event) => {
                                            setCodeInput(event.target.value)
                                            setRedeemError('')
                                        }}
                                        placeholder="Enter code"
                                        autoComplete="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        className="min-w-0 flex-1 p-3 bg-gray-800 rounded-md border border-transparent font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={redeeming || !codeInput.trim()}
                                        className="flex-none px-4 py-3 text-sm bg-blue-500 hover:bg-blue-600 rounded-md text-white transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
                                    >
                                        {redeeming ? 'Redeeming…' : 'Redeem'}
                                    </button>
                                </div>
                                {redeemError ? (
                                    <p className="mt-2 text-xs text-red-400" role="status">{redeemError}</p>
                                ) : (
                                    redemption.window_ends_at && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            You can use one invite code until {formatDate(redemption.window_ends_at)}.
                                        </p>
                                    )
                                )}
                            </form>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}
