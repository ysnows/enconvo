import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { INVITE_REDEEMED_EVENT, readInviteCookie, redeemPendingInvite, type RedeemResult } from '@/lib/invite'

/**
 * The website's one Invite auth hook, mounted once in `_app`. While an Invite
 * link's cookie is waiting it starts once: it redeems for the session that
 * already exists, then again on every Supabase SIGNED_IN (password, sign-up,
 * OAuth callback). Supabase is loaded only then, so pages without a pending
 * Invite stay light; a route change only reads the cookie until it appears
 * (a client-side visit to an Invite link sets it).
 */
export function useInviteAutoRedeem() {
    const router = useRouter()
    useEffect(() => {
        let started = false
        let cancelled = false
        let unsubscribe: (() => void) | null = null

        const start = () => {
            if (started || !readInviteCookie()) return
            started = true
            router.events.off('routeChangeComplete', start)
            import('@/lib/supabase')
                .then(({ supabase }) => {
                    if (cancelled) return
                    const { data } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN') void redeemPendingInvite(session?.access_token)
                    })
                    unsubscribe = () => data.subscription.unsubscribe()
                    return supabase.auth.getSession().then(({ data: { session } }) => {
                        if (!cancelled) void redeemPendingInvite(session?.access_token)
                    })
                })
                .catch(() => {})
        }

        start()
        if (!started) router.events.on('routeChangeComplete', start)
        return () => {
            cancelled = true
            router.events.off('routeChangeComplete', start)
            unsubscribe?.()
        }
        // `router.events` is one emitter for the app's lifetime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}

/** Calls `onOutcome` for every automatic Redemption outcome published while mounted. */
export function useInviteRedeemed(onOutcome: (result: RedeemResult) => void) {
    const handler = useRef(onOutcome)
    handler.current = onOutcome
    useEffect(() => {
        const listener = (event: Event) => handler.current((event as CustomEvent<RedeemResult>).detail)
        window.addEventListener(INVITE_REDEEMED_EVENT, listener)
        return () => window.removeEventListener(INVITE_REDEEMED_EVENT, listener)
    }, [])
}
