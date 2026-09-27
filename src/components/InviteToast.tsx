import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import {
    formatRewardUsd,
    INVITE_REDEEMED_EVENT,
    readInviteCookie,
    redeemPendingInvite,
    type RedeemResult,
} from '@/lib/invite'

const VISIBLE_MS = 8000

/** Site-wide notice for Invites redeemed automatically after sign-in. */
export function InviteToast() {
    const router = useRouter()
    const [result, setResult] = useState<RedeemResult | null>(null)

    // Fallback for sign-ins that finish on a page without its own hook (e.g. Google
    // sign-in with a returnUrl). Loads Supabase only while an Invite cookie is waiting;
    // the landing page redeems and reports on its own.
    useEffect(() => {
        if (router.pathname === '/i/[code]' || !readInviteCookie()) return
        let cancelled = false
        import('@/lib/supabase')
            .then(({ supabase }) => supabase.auth.getSession())
            .then(({ data }) => {
                if (!cancelled) void redeemPendingInvite(data.session?.access_token)
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [router.pathname, router.asPath])

    useEffect(() => {
        const onRedeemed = (event: Event) => setResult((event as CustomEvent<RedeemResult>).detail)
        window.addEventListener(INVITE_REDEEMED_EVENT, onRedeemed)
        return () => window.removeEventListener(INVITE_REDEEMED_EVENT, onRedeemed)
    }, [])

    useEffect(() => {
        if (!result) return
        const timer = setTimeout(() => setResult(null), VISIBLE_MS)
        return () => clearTimeout(timer)
    }, [result])

    if (!result) return null

    let title = 'Invite code not redeemed'
    let body = result.ok ? '' : result.message
    if (result.ok) {
        const reward = formatRewardUsd(result.data.reward_usd)
        title = 'Invite code redeemed'
        body = result.data.qualified
            ? `You and your friend each got ${reward} in Cloud points.`
            : `Sign in to the Enconvo app on a device that's new to Enconvo, and you both get ${reward} in Cloud points.`
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6">
            <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-hairline-strong bg-surface-card/95 py-3 pl-4 pr-1 text-left shadow-2xl backdrop-blur-md"
            >
                {result.ok ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-signal-green" aria-hidden="true" />
                ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-content-muted" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-sm font-medium text-content">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-content-muted">{body}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="-my-1.5 flex h-10 w-10 flex-none items-center justify-center rounded-[10px] text-content-muted transition-colors hover:bg-white/[0.06] hover:text-content"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    )
}
