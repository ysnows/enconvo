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
    onOfferLink,
    readOfferCookie,
    setWelcomeOfferState,
    writeOfferCookie,
    type ClaimTrigger,
    type ClaimView,
    type WelcomeOfferInfo,
    type WelcomeOfferState,
} from '@/lib/welcome-offer'

type Auth = SupabaseClient['auth']

// Module state, so React strict mode's second mount neither repeats nor loses a step.
let auth: Promise<Auth | null> | null = null
/** The signed-in account as last seen; undefined until the first answer. */
let userId: string | null | undefined
/** The access token the Worker last refused; the same session coming back is no new sign-in. */
let refusedToken: string | null = null
let loadChecked = false
const arrivals = new Set<string>()
const infos = new Map<string, Promise<WelcomeOfferInfo | null>>()

function tabHidden() {
    return typeof document !== 'undefined' && document.visibilityState !== 'visible'
}

/** Resolves once this tab is in view: of the tabs a sign-in reaches, the one in view claims. */
function whenVisible(): Promise<void> {
    if (!tabHidden()) return Promise.resolve()
    return new Promise((resolve) => {
        const changed = () => {
            if (tabHidden()) return
            document.removeEventListener('visibilitychange', changed)
            resolve()
        }
        document.addEventListener('visibilitychange', changed)
    })
}

function loadAuth(): Promise<Auth | null> {
    auth ??= import('@/lib/supabase')
        .then(({ supabase }) => {
            supabase.auth.onAuthStateChange((event, session) => {
                const next = session?.user?.id ?? null
                // supabase-js also sends SIGNED_IN on load and when the tab comes back; only a
                // different account than the one last seen is a sign-in, or a new session for
                // it after the Worker refused the last one.
                const signedIn =
                    event === 'SIGNED_IN' &&
                    !!next &&
                    userId !== undefined &&
                    (next !== userId || refusedToken !== null) &&
                    session.access_token !== refusedToken
                userId = next
                if (signedIn) void claimPending(session)
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

/** Claims `slug`; null when another tab claimed it first. */
async function runClaim(session: Session, slug: string, trigger: ClaimTrigger) {
    const [view, info] = await Promise.all([claimOffer(session.access_token, slug, trigger), loadInfo(slug)])
    if (!view) return null
    if (view.step === 'failed' && view.signIn) {
        // The Worker refused this session: the next sign-in, the same account's included, claims.
        userId = null
        refusedToken = session.access_token
        // Kept for after "Sign in again". An automatic claim had the cookie already; a
        // signed-in visitor's click is the one way a session gets the cookie.
        if (trigger === 'button') writeOfferCookie(slug)
    } else refusedToken = null
    return { view, info: info?.valid ? info : null }
}

function showAnswer(session: Session, slug: string, answer: { view: ClaimView; info: WelcomeOfferInfo | null }) {
    setWelcomeOfferState({ slug, info: answer.info, signedIn: true, email: session.user?.email ?? null, view: answer.view })
}

/**
 * An automatic claim of the offer the cookie holds, once this tab is in view. The answer opens
 * the popup, except a failure away from the offer link: that retries quietly on a later page.
 */
async function claimPending(session: Session | null) {
    if (tabHidden()) {
        await whenVisible()
        session = await currentSession()
    }
    const slug = readOfferCookie()
    if (!slug || !session?.access_token) return
    const answer = await runClaim(session, slug, 'auto')
    if (!answer || (answer.view.step === 'failed' && !onOfferLink(slug))) return
    showAnswer(session, slug, answer)
}

/** The homepage opened with `?offer=<slug>`. */
async function handleArrival(slug: string) {
    if (arrivals.has(slug)) return
    arrivals.add(slug)
    // A tab opened in the background decides once it's looked at: another tab may claim first.
    await whenVisible()
    // Claimed in this tab moments ago (a sign-in on the way here): its popup shows the answer.
    if (hasClaimOutcome(slug)) return
    // The cookie is only ever written for a visitor without a session (or one the Worker
    // refused), so it means a sign-up or sign-in started from this offer.
    const earlierCookie = readOfferCookie() === slug

    const [info, session] = await Promise.all([loadInfo(slug), currentSession()])
    if (info && !info.valid) {
        if ((info.status === 'ended' || info.status === 'not_found') && readOfferCookie() === slug) clearOfferCookie()
        return
    }
    // Back signed in after a sign-up or sign-in from the offer: claim without asking again.
    if (session && earlierCookie) return claimPending(session)
    // A signed-out visitor keeps the slug for after sign-up, even with the popup closed before;
    // a signed-in one gets a Claim button and no cookie.
    if (!session) writeOfferCookie(slug)
    if (isOfferDismissed(slug) || !info || hasClaimOutcome(slug)) return
    // Left the homepage while the terms loaded, or the popup already answers this offer.
    if (!isOfferLanding(window.location.pathname) || getWelcomeOfferState()?.slug === slug) return
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
    void currentSession().then(claimPending)
}

/**
 * The website's one Welcome offer hook, mounted once in `_app`. The homepage opened with
 * `?offer=<slug>` opens the popup: a signed-out visitor keeps the slug in a cookie and is sent
 * to sign up, a signed-in one gets a Claim button. While the cookie waits, the offer is claimed
 * automatically, by the tab in view and one tab at a time, on any page for a session that
 * already existed and on every real Supabase sign-in (password, sign-up, OAuth callback), and
 * the popup opens with the answer. Supabase is loaded only then, so pages without an offer
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
    const claiming: WelcomeOfferState = { ...current, view: { step: 'claiming' } }
    setWelcomeOfferState(claiming)
    // Closed while it ran: the claim still finishes and is recorded, but the popup stays shut.
    const stillOpen = () => getWelcomeOfferState() === claiming
    const session = await currentSession()
    if (!session) {
        // Signed out meanwhile: the offer waits for the sign-up or sign-in the popup now offers.
        writeOfferCookie(current.slug)
        if (stillOpen()) setWelcomeOfferState({ ...current, signedIn: false, email: null, view: { step: 'offer' } })
        return
    }
    const answer = await runClaim(session, current.slug, 'button')
    if (answer && stillOpen()) showAnswer(session, current.slug, answer)
}

/**
 * Closing the popup. Closing the offer itself turns it down: later visits to the link don't
 * open it again. A claim answer was recorded when it came, and a failure or a refusal that ends
 * with time leaves the link working. A claim still running finishes in the background.
 */
export function closeWelcomeOffer() {
    const current = getWelcomeOfferState()
    if (!current) return
    if (current.view.step === 'offer') {
        dismissOffer(current.slug)
        // A signed-in visitor turning the offer down: nothing claims it later.
        if (current.signedIn && readOfferCookie() === current.slug) clearOfferCookie()
    }
    setWelcomeOfferState(null)
}

/** Leaving for sign-up or sign-in: the popup closes but isn't dismissed, and opens again on return. */
export function leaveWelcomeOffer() {
    const current = getWelcomeOfferState()
    if (current) arrivals.delete(current.slug)
    setWelcomeOfferState(null)
}
