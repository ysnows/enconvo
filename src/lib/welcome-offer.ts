// Welcome offers: a campaign link to the homepage (`/?offer=<slug>`) gives an account, once, a
// free Cloud plan for a few days, with AI points that end with it. The slug is an unguessable
// token handed out with the link, so the site never names, shows or links to one; the Worker
// decides what each slug gives. A homepage visit keeps the slug in a first-party cookie so the
// claim still happens after sign-up. `useWelcomeOfferAutoClaim` (mounted once in `_app`)
// claims it, and `WelcomeOffer` shows the popup this file's store describes.

import { locales } from '@/i18n/locale'
import { trackEvent } from '@/lib/analytics'
import { workerPost, workerRequest, type WorkerResult } from '@/lib/worker-api'

export const OFFER_PARAM = 'offer'
export const OFFER_COOKIE = 'enconvo_offer'
export const OFFER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60
/** Slugs whose popup this browser closed, newest first. */
const DISMISSED_KEY = 'enconvo_welcome_offer_dismissed'
const DISMISSED_LIMIT = 20
const SLUG = /^[a-z0-9][a-z0-9_-]{1,47}$/

export interface WelcomeOfferInfo {
    offer: string
    status: 'active' | 'not_started' | 'ended' | 'not_found'
    valid: boolean
    // The terms below come only with a live offer; an unknown slug's answer has none.
    plan: string
    days: number
    points: number
    usd: number
    /** When the campaign stops accepting claims; null while open-ended. */
    ends_at: string | null
}

export interface WelcomeOfferClaim {
    offer: string
    plan: string
    days: number
    points: number
    usd: number
    /** The account's points after the claim; null when it was claimed before. */
    balance: number | null
    /** When this account's plan ends. */
    ends_at: string
    /** This account claimed the offer before; it is shown as a success too. */
    already_claimed: boolean
}

/** Terminal refusals the popup words itself; any other terminal reason is `unavailable`. */
export const REFUSAL_REASONS = [
    'already_subscribed',
    'offer_ended',
    'offer_not_found',
    'offer_not_started',
    'other_code_open',
] as const
export type RefusalReason = (typeof REFUSAL_REASONS)[number] | 'unavailable'

export type ClaimTrigger = 'auto' | 'button'

export type ClaimView =
    | { step: 'claimed'; claim: WelcomeOfferClaim }
    | { step: 'refused'; reason: RefusalReason }
    // Worth another try: a network or server failure, or a session the Worker no longer accepts.
    | { step: 'failed'; signIn: boolean }

export type WelcomeOfferView = { step: 'offer' } | { step: 'claiming' } | ClaimView

export interface WelcomeOfferState {
    slug: string
    /** A live offer's public terms; null when only a claim answer is known. */
    info: WelcomeOfferInfo | null
    signedIn: boolean
    /** The signed-in account, shown in the next steps; never sent anywhere. */
    email: string | null
    view: WelcomeOfferView
}

/** Lowercased slug, or '' when the value can't be one. */
export function normalizeOfferSlug(raw: unknown): string {
    if (typeof raw !== 'string') return ''
    const slug = raw.trim().toLowerCase()
    return SLUG.test(slug) ? slug : ''
}

/** The offer a query string (`?a=b&offer=…`) carries. */
export function offerFromSearch(search: string): string {
    try {
        return normalizeOfferSlug(new URLSearchParams(search).get(OFFER_PARAM))
    } catch {
        return ''
    }
}

/**
 * Only the homepage takes an offer link: `/` and each language's homepage (`/ja`, `/zh-CN`).
 * Every other page ignores the parameter. `pathname` is the address bar's path.
 */
export function isOfferLanding(pathname: string): boolean {
    const path = (pathname.replace(/\/+$/, '') || '/').toLowerCase()
    return path === '/' || locales.some((locale) => path === `/${locale.toLowerCase()}`)
}

/**
 * The homepage carrying an offer, where sign-up returns after email confirmation (the
 * website claims it there) instead of opening the app.
 */
export function offerReturnPath(path: unknown): string | null {
    if (typeof path !== 'string' || /[\\\u0000-\u001f]/.test(path)) return null
    const [beforeHash] = path.split('#')
    const [pathname, query] = beforeHash.split('?')
    return isOfferLanding(pathname) && query && offerFromSearch(query) ? path : null
}

/** The homepage link a visitor returns to after signing up or in (the locale stays). */
export function offerHomePath(slug: string): string {
    return `/?${new URLSearchParams({ [OFFER_PARAM]: slug })}`
}

export function readOfferCookie(): string {
    if (typeof document === 'undefined') return ''
    const prefix = `${OFFER_COOKIE}=`
    const entry = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))
    if (!entry) return ''
    try {
        return normalizeOfferSlug(decodeURIComponent(entry.slice(prefix.length)))
    } catch {
        return ''
    }
}

export function writeOfferCookie(slug: string) {
    if (typeof document === 'undefined' || !normalizeOfferSlug(slug)) return
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${OFFER_COOKIE}=${encodeURIComponent(slug)}; Path=/; Max-Age=${OFFER_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function clearOfferCookie() {
    if (typeof document === 'undefined') return
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${OFFER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

function readDismissed(): string[] {
    try {
        const list = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
        return Array.isArray(list) ? list.filter((slug) => typeof slug === 'string') : []
    } catch {
        return []
    }
}

export function isOfferDismissed(slug: string): boolean {
    return readDismissed().includes(slug)
}

/** Later page views don't open this offer's popup again; the cookie is not touched. */
export function dismissOffer(slug: string) {
    try {
        const list = [slug, ...readDismissed().filter((entry) => entry !== slug)].slice(0, DISMISSED_LIMIT)
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(list))
    } catch {}
}

/** Public: is this offer live, and what does it give? */
export function fetchWelcomeOffer(slug: string, signal?: AbortSignal) {
    return workerRequest<WelcomeOfferInfo>(`/api/welcome_offer/offer/${encodeURIComponent(slug)}`, { signal })
}

export function postWelcomeOfferClaim(accessToken: string, slug: string) {
    return workerPost<WelcomeOfferClaim>('/api/welcome_offer/claim', accessToken, { offer: slug })
}

/** An ISO time as a date in the visitor's language, or '' when it isn't one. */
export function formatOfferDate(
    iso: string | null | undefined,
    locale: string,
    month: 'long' | 'short' = 'long'
): string {
    const date = iso ? new Date(iso) : null
    if (!date || Number.isNaN(date.getTime())) return ''
    try {
        return date.toLocaleDateString(locale, { year: 'numeric', month, day: 'numeric' })
    } catch {
        return date.toLocaleDateString('en', { year: 'numeric', month, day: 'numeric' })
    }
}

/** What the popup shows for a claim answer. */
export function claimView(result: WorkerResult<WelcomeOfferClaim>): ClaimView {
    if (result.ok) return { step: 'claimed', claim: result.data }
    if (result.status === 401 || result.reason === 'unauthorized') return { step: 'failed', signIn: true }
    if (!result.terminal) return { step: 'failed', signIn: false }
    const known = (REFUSAL_REASONS as readonly string[]).includes(result.reason)
    return { step: 'refused', reason: known ? (result.reason as RefusalReason) : 'unavailable' }
}

/** A refusal's title and line. */
export function refusalCopy(reason: RefusalReason): { title: string; body: string } {
    switch (reason) {
        case 'already_subscribed':
            return {
                title: 'You already have a Cloud plan',
                body: "Your account already includes Enconvo Cloud, so there's nothing to add.",
            }
        case 'offer_ended':
            return { title: 'This offer has ended', body: 'It no longer accepts new claims.' }
        case 'offer_not_found':
            return { title: "This offer isn't available", body: 'The link may be mistyped or out of date.' }
        case 'offer_not_started':
            return { title: "This offer hasn't started yet", body: 'Open the link again once it starts.' }
        case 'other_code_open':
            return {
                title: 'You have a trial checkout open',
                body: 'Finish it, or wait about 30 minutes, then open this link again.',
            }
        default:
            return { title: "This offer isn't available for your account", body: 'Nothing was changed on your account.' }
    }
}

// The popup's state, shared by the auto-claim hook and the popup.
let state: WelcomeOfferState | null = null
const listeners = new Set<() => void>()

export function getWelcomeOfferState() {
    return state
}

export function subscribeWelcomeOffer(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function setWelcomeOfferState(next: WelcomeOfferState | null) {
    state = next
    listeners.forEach((listener) => listener())
}

const inFlight = new Map<string, Promise<ClaimView>>()
const outcomes = new Map<string, ClaimView>()

/** True while this tab is claiming `slug` or already has a final answer for it. */
export function hasClaimOutcome(slug: string): boolean {
    return inFlight.has(slug) || outcomes.has(slug)
}

/**
 * Claim `slug` for the signed-in account. Calls for the same slug share one in-flight
 * request. The cookie is cleared on success or a final refusal and kept for network
 * errors, 5xx and 401, so a later sign-in tries again. A final answer also stops the
 * popup from opening again on later visits to the link. The analytics choke point.
 */
export function claimOffer(accessToken: string, slug: string, trigger: ClaimTrigger): Promise<ClaimView> {
    const pending = inFlight.get(slug)
    if (pending) return pending
    const request = postWelcomeOfferClaim(accessToken, slug)
        .then((result) => {
            const view = claimView(result)
            if (view.step === 'failed') return view
            if (readOfferCookie() === slug) clearOfferCookie()
            dismissOffer(slug)
            outcomes.set(slug, view)
            if (view.step === 'claimed')
                trackEvent(
                    'welcome_offer_claimed',
                    { offer: slug, already_claimed: !!view.claim.already_claimed, trigger },
                    { includePagePath: false }
                )
            else trackEvent('welcome_offer_refused', { offer: slug, reason: view.reason, trigger }, { includePagePath: false })
            return view
        })
        .finally(() => {
            inFlight.delete(slug)
        })
    inFlight.set(slug, request)
    return request
}
