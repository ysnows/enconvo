import { useEffect } from 'react'
import Router from 'next/router'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { trackEvent } from '@/lib/analytics'
import {
    claimOffer,
    clearOfferCookie,
    dismissOffer,
    fetchWelcomeOffer,
    getWelcomeOfferState,
    hasClaimOutcome,
    isOfferDismissed,
    isOfferLanding,
    offerFromSearch,
    readOfferCookie,
    setWelcomeOfferState,
    writeOfferCookie,
    type ClaimTrigger,
    type WelcomeOfferInfo,
} from '@/lib/welcome-offer'

type Auth = SupabaseClient['auth']

// Module state, so React strict mode's second mount neither repeats nor loses a step.
let auth: Promise<Auth | null> | null = null
/** The signed-in account as last seen; undefined until the first answer. */
let userId: string | null | undefined
let loadChecked = false
const arrivals = new Set<string>()
/** Slugs whose cookie this page view wrote; any other cookie came from an earlier visit. */
const writtenHere = new Set<string>()
const infos = new Map<string, Promise<WelcomeOfferInfo | null>>()

function loadAuth(): Promise<Auth | null> {
    auth ??= import('@/lib/supabase')
        .then(({ supabase }) => {
            supabase.auth.onAuthStateChange((event, session) => {
                const next = session?.user?.id ?? null
                // supabase-js also sends SIGNED_IN on load and when the tab comes back;
                // only a different account than the one last seen is a sign-in.
                const signedIn = event === 'SIGNED_IN' && !!next && userId !== undefined && next !== userId
                userId = next
                if (signedIn) void claimPending(session, 'auto')
            })
            return supabase.auth
        })
        .catch(() => {
            auth = null
            return null
        })
    return auth
}

async function currentSession(): Promise<Session | null> {
    const client = await loadAuth()
    if (!client) return null
    const { data } = await client.getSession().catch(() => ({ data: { session: null } }))
    if (userId === undefined) userId = data.session?.user?.id ?? null
    return data.session
}

/** The offer's public terms, asked once per page view; null when the Worker can't say. */
function loadInfo(slug: string): Promise<WelcomeOfferInfo | null> {
    if (!infos.has(slug))
        infos.set(
            slug,
            fetchWelcomeOffer(slug).then((result) => {
                if (result.ok) return result.data
                infos.delete(slug)
                return null
            })
        )
    return infos.get(slug)!
}

async function runClaim(session: Session, slug: string, trigger: ClaimTrigger) {
    const [view, info] = await Promise.all([claimOffer(session.access_token, slug, trigger), loadInfo(slug)])
    // A stored session the Worker refuses: wait quietly for a real sign-in.
    if (trigger === 'auto' && view.step === 'failed' && view.signIn) return
    setWelcomeOfferState({ slug, info: info?.valid ? info : null, signedIn: true, email: session.user?.email ?? null, view })
}

function claimPending(session: Session | null, trigger: ClaimTrigger) {
    const slug = readOfferCookie()
    if (!slug || !session?.access_token) return Promise.resolve()
    return runClaim(session, slug, trigger)
}

/** The homepage opened with `?offer=<slug>`. */
async function handleArrival(slug: string) {
    if (arrivals.has(slug)) return
    arrivals.add(slug)
    // Claimed in this tab moments ago (a sign-in on the way here): its popup shows the answer.
    if (hasClaimOutcome(slug)) return
    const earlierCookie = readOfferCookie() === slug && !writtenHere.has(slug)
    const dismissed = isOfferDismissed(slug)
    const keepCookie = () => {
        if (readOfferCookie() !== slug) writtenHere.add(slug)
        writeOfferCookie(slug)
    }
    if (!dismissed) keepCookie()

    const [info, session] = await Promise.all([loadInfo(slug), currentSession()])
    if (info && !info.valid) {
        if ((info.status === 'ended' || info.status === 'not_found') && readOfferCookie() === slug) clearOfferCookie()
        return
    }
    // Back signed in after an earlier signed-out visit: claim without asking again.
    if (session && earlierCookie) return runClaim(session, slug, 'auto')
    // A closed popup stays closed, but a signed-out visitor still gets the claim after sign-up.
    if (dismissed) {
        if (!session) keepCookie()
        return
    }
    if (!info || hasClaimOutcome(slug)) return
    setWelcomeOfferState({ slug, info, signedIn: !!session, email: session?.user?.email ?? null, view: { step: 'offer' } })
    trackEvent('welcome_offer_viewed', { offer: slug, signed_in: !!session }, { includePagePath: false })
}

function check() {
    // Only the homepage (`/` and each language's) takes the link; elsewhere `?offer=` is ignored.
    const slug = isOfferLanding(window.location.pathname) ? offerFromSearch(window.location.search) : ''
    if (slug) {
        void handleArrival(slug)
        return
    }
    // An offer from an earlier visit: claim it for a session that already exists.
    // The auth subscription started here claims it on a later sign-in.
    if (loadChecked || !readOfferCookie()) return
    loadChecked = true
    void currentSession().then((session) => claimPending(session, 'auto'))
}

/**
 * The website's one Welcome offer hook, mounted once in `_app`. The homepage opened with
 * `?offer=<slug>` keeps the slug in a cookie and opens the popup (sign up to claim, or a
 * Claim button for a visitor who is already signed in). While the cookie waits, the offer
 * is claimed automatically on any page for a session that already existed on an earlier
 * visit and on every real Supabase sign-in (password, sign-up, OAuth callback), and the
 * popup opens with the answer. Supabase is loaded only then, so pages without an offer
 * stay light.
 */
export function useWelcomeOfferAutoClaim() {
    useEffect(() => {
        check()
        Router.events.on('routeChangeComplete', check)
        return () => Router.events.off('routeChangeComplete', check)
    }, [])
}

/** The popup's Claim and Try again buttons. */
export async function claimFromPopup() {
    const current = getWelcomeOfferState()
    if (!current || current.view.step === 'claiming') return
    setWelcomeOfferState({ ...current, view: { step: 'claiming' } })
    const session = await currentSession()
    if (!session) {
        setWelcomeOfferState({ ...current, signedIn: false, email: null, view: { step: 'offer' } })
        return
    }
    await runClaim(session, current.slug, 'button')
}

/** Closing the popup: later visits to the link don't open it again. */
export function closeWelcomeOffer() {
    const current = getWelcomeOfferState()
    if (!current || current.view.step === 'claiming') return
    dismissOffer(current.slug)
    // A signed-in visitor turning the offer down: nothing claims it later.
    if (current.signedIn && current.view.step === 'offer' && readOfferCookie() === current.slug) clearOfferCookie()
    setWelcomeOfferState(null)
}

/** Leaving for sign-up or sign-in: the popup closes but isn't dismissed. */
export function leaveWelcomeOffer() {
    setWelcomeOfferState(null)
}
