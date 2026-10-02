import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { AlertCircle, ArrowRight, BadgeCheck, Loader2 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { metaLabel, primaryButton, secondaryButton } from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { supabase } from '@/lib/supabase'
import { fetchRedeemCode, LICENSES, redeemCode, type LicenseCodeTier, type RedeemCodeInfo } from '@/lib/redeem-code'
import { formatTrialCode, normalizeTrialCode, unavailableCopy, type TrialCodeStatus } from '@/lib/trial-code'

// "unknown" = the Worker could not be reached while rendering; the browser asks again.
type PageStatus = TrialCodeStatus | 'unknown'

type CodeKind = RedeemCodeInfo['kind']

interface RedeemPageProps {
    code: string
    kind: CodeKind
    status: PageStatus
    trialDays: number
    priceUsd: number
    tier: LicenseCodeTier
    points: number
}

const LOOKUP_TIMEOUT_MS = 3500
const DEFAULT_TRIAL_DAYS = 30
const DEFAULT_PRICE_USD = 10
const DEFAULT_LICENSE_POINTS = 50_000

/** Refusals that mean the code itself can't be redeemed any more. */
const STATUS_BY_REASON: Record<string, TrialCodeStatus> = {
    code_used: 'used',
    code_disabled: 'disabled',
    code_expired: 'expired',
    not_found: 'not_found',
}

export const getServerSideProps: GetServerSideProps<RedeemPageProps> = async ({ params, res }) => {
    const code = normalizeTrialCode(typeof params?.code === 'string' ? params.code : '')
    const props: RedeemPageProps = {
        code: code ? formatTrialCode(code) : '',
        kind: 'trial',
        status: code ? 'unknown' : 'not_found',
        trialDays: DEFAULT_TRIAL_DAYS,
        priceUsd: DEFAULT_PRICE_USD,
        tier: 'standard',
        points: DEFAULT_LICENSE_POINTS,
    }

    if (code) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
        const result = await fetchRedeemCode(code, controller.signal)
        clearTimeout(timer)
        if (result.ok) Object.assign(props, describe(result.data))
    }

    res.setHeader('Cache-Control', 'private, no-store')
    return { props }
}

/** The page props a lookup answer sets. */
function describe(info: RedeemCodeInfo): Partial<RedeemPageProps> {
    return info.kind === 'license'
        ? { kind: 'license', status: info.status, tier: info.tier, points: info.points }
        : { kind: 'trial', status: info.status, trialDays: info.trial_days, priceUsd: info.price_usd }
}

function Notice({ tone, title, children }: { tone: 'info' | 'error'; title: string; children: React.ReactNode }) {
    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className="mt-8 flex max-w-xl items-start gap-3 rounded-lg border border-hairline bg-surface-card p-4"
        >
            <AlertCircle
                className={tone === 'error' ? 'mt-0.5 h-5 w-5 flex-none text-signal-yellow' : 'mt-0.5 h-5 w-5 flex-none text-content-muted'}
                aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-content">{title}</p>
                <p className="mt-1 text-sm leading-6 text-content-muted">{children}</p>
            </div>
        </div>
    )
}

function UnavailableCode({ code, kind, status }: { code: string; kind: CodeKind; status: TrialCodeStatus }) {
    const copy = unavailableCopy(status, kind)
    return (
        <>
            <p className={metaLabel}>{status === 'not_found' ? 'Code' : kind === 'license' ? 'License code' : 'Trial code'}</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">{copy.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
                {code && (
                    <>
                        <span className="font-mono text-content">{code}</span>
                        {' · '}
                    </>
                )}
                {copy.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/redeem" className={primaryButton}>
                    Enter another code
                </Link>
                {kind === 'license' ? (
                    <Link href="/ltd" className={secondaryButton}>
                        See licenses
                    </Link>
                ) : (
                    <Link href="/cloud-pricing" className={secondaryButton}>
                        See Cloud plans
                    </Link>
                )}
            </div>
        </>
    )
}

function LicenseRedeemed({ tier, points, email }: { tier: LicenseCodeTier; points: number; email: string | null }) {
    const license = LICENSES[tier]
    return (
        <>
            <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-content" aria-hidden="true" />
                <span className={metaLabel}>License redeemed</span>
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                Enconvo {license.name} is yours
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                Your lifetime {license.name} license is on {email ? <span className="text-content">{email}</span> : 'your account'}, and{' '}
                {points.toLocaleString('en-US')} Cloud points were added to your balance. Open Enconvo on your Mac and sign in with
                this account to start using it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/downloads" className={primaryButton}>
                    Download Enconvo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/account" className={secondaryButton}>
                    Go to your account
                </Link>
            </div>
        </>
    )
}

export default function RedeemCodePage(props: RedeemPageProps) {
    const { code, status: initialStatus } = props
    const router = useRouter()
    // A lookup the server couldn't make is made again here, and may change the kind.
    const [info, setInfo] = useState(props)
    const { kind, trialDays, priceUsd, tier, points } = info
    const [status, setStatus] = useState<PageStatus>(initialStatus)
    const [granted, setGranted] = useState(false)
    const [email, setEmail] = useState<string | null>(null)
    const [sessionChecked, setSessionChecked] = useState(false)
    const [opening, setOpening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const canceled = router.query.canceled === 'true'
    const returnUrl = encodeURIComponent(`/redeem/${code}`)

    useEffect(() => {
        if (initialStatus !== 'unknown') return
        let cancelled = false
        void fetchRedeemCode(normalizeTrialCode(code)).then((result) => {
            if (cancelled || !result.ok) return
            setInfo((current) => ({ ...current, ...describe(result.data) }))
            setStatus(result.data.status)
        })
        return () => {
            cancelled = true
        }
    }, [code, initialStatus])

    useEffect(() => {
        let cancelled = false
        void supabase.auth.getSession().then(({ data }) => {
            if (cancelled) return
            setEmail(data.session?.user.email ?? null)
            setSessionChecked(true)
        })
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setEmail(session?.user.email ?? null)
        })
        return () => {
            cancelled = true
            listener.subscription.unsubscribe()
        }
    }, [])

    async function redeem() {
        setError(null)
        setOpening(true)
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
            setEmail(null)
            setOpening(false)
            return
        }
        const result = await redeemCode(data.session.access_token, normalizeTrialCode(code))
        if (result.ok) {
            const answer = result.data
            if (answer.kind === 'license') {
                setInfo((current) => ({ ...current, kind: 'license', tier: answer.tier, points: answer.points }))
                setOpening(false)
                setGranted(true)
                return
            }
            // Keep the button busy while the browser leaves for Stripe.
            window.location.assign(answer.url)
            return
        }
        setOpening(false)
        const unavailable = STATUS_BY_REASON[result.reason]
        if (unavailable) setStatus(unavailable)
        else setError(result.message)
    }

    const trialPeriod = `${trialDays} days`
    const price = `$${priceUsd}/month`
    const license = LICENSES[tier]
    const isLicense = kind === 'license'

    return (
        <>
            <Head>
                <title>{isLicense ? `Redeem your Enconvo ${license.name} license` : 'Redeem a free month of Enconvo Cloud'}</title>
                <meta
                    name="description"
                    content={isLicense
                        ? `Redeem your license code for a lifetime Enconvo ${license.name} license.`
                        : 'Redeem your trial code for a free month of the Enconvo Plus Cloud plan.'}
                />
            </Head>
            <div className="min-h-screen bg-canvas text-content">
                <SiteNav />
                <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
                    {granted ? (
                        <LicenseRedeemed tier={tier} points={points} email={email} />
                    ) : status !== 'available' && status !== 'unknown' ? (
                        <UnavailableCode code={code} kind={kind} status={status} />
                    ) : (
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-start lg:gap-16">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={metaLabel}>{isLicense ? 'License code' : 'Trial code'}</span>
                                    <span className="rounded-md border border-hairline bg-surface-card px-2 py-1 font-mono text-sm tracking-[0.12em] text-content">
                                        {code}
                                    </span>
                                </div>
                                <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                                    {isLicense ? `Enconvo ${license.name}, yours for life` : 'A free month of Enconvo Cloud'}
                                </h1>
                                {isLicense ? (
                                    <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                                        This code puts a lifetime <span className="font-semibold text-content">{license.name} license</span>{' '}
                                        on your Enconvo account, with {points.toLocaleString('en-US')} Cloud points for AI chat, images,
                                        video, speech and search.
                                    </p>
                                ) : (
                                    <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                                        This code starts the <span className="font-semibold text-content">Plus Cloud plan</span> with
                                        the first {trialPeriod} free: Cloud points every month for AI chat, images, video, speech and
                                        search in Enconvo.
                                    </p>
                                )}

                                {canceled && !error && !isLicense && (
                                    <Notice tone="info" title="Checkout was cancelled">
                                        Your code hasn&apos;t been used. Start again whenever you&apos;re ready.
                                    </Notice>
                                )}
                                {error && (
                                    <Notice tone="error" title={isLicense ? "Couldn't redeem your license" : "Couldn't start your free month"}>
                                        {error}
                                    </Notice>
                                )}

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    {email ? (
                                        <button type="button" onClick={redeem} disabled={opening} className={primaryButton}>
                                            {opening ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                    {isLicense ? 'Redeeming…' : 'Opening checkout…'}
                                                </>
                                            ) : (
                                                <>
                                                    {isLicense ? 'Redeem your license' : 'Start your free month'}
                                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <>
                                            <Link href={`/register?returnUrl=${returnUrl}`} className={primaryButton}>
                                                Create your account
                                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                            </Link>
                                            <Link href={`/login?returnUrl=${returnUrl}`} className={secondaryButton}>
                                                Sign in
                                            </Link>
                                        </>
                                    )}
                                </div>
                                {sessionChecked && (
                                    <p className="mt-4 text-sm text-content-muted">
                                        {email ? (
                                            <>
                                                Redeeming as <span className="text-content">{email}</span>.{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => void supabase.auth.signOut({ scope: 'local' })}
                                                    className="text-content underline decoration-hairline-strong underline-offset-4"
                                                >
                                                    Use another account
                                                </button>
                                            </>
                                        ) : (
                                            `Sign in to the account you use in the Enconvo app. The ${isLicense ? 'license' : 'plan'} is added to that account.`
                                        )}
                                    </p>
                                )}
                            </div>

                            {isLicense ? (
                            <div className="rounded-[10px] border border-hairline-strong bg-surface-elevated p-6">
                                <h2 className={metaLabel}>What you get</h2>
                                <dl className="mt-5 divide-y divide-hairline text-sm">
                                    <div className="flex items-baseline justify-between gap-4 pb-4">
                                        <dt className="text-content-muted">License</dt>
                                        <dd className="font-semibold text-content">{license.name}, lifetime</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 py-4">
                                        <dt className="text-content-muted">Macs</dt>
                                        <dd className="text-content">{license.devices}</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 py-4">
                                        <dt className="text-content-muted">Updates</dt>
                                        <dd className="text-content">{license.updates}</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 py-4">
                                        <dt className="text-content-muted">Cloud points</dt>
                                        <dd className="text-content">{points.toLocaleString('en-US')}, one time</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 pt-4">
                                        <dt className="text-content-muted">Price</dt>
                                        <dd className="font-semibold text-content">$0</dd>
                                    </div>
                                </dl>
                                <p className="mt-6 text-xs leading-5 text-content-ash">
                                    Nothing to pay and no card needed. The license goes on the account you&apos;re signed in with and
                                    can&apos;t be moved afterwards. Accounts that already have this license or a higher one can&apos;t
                                    redeem it.
                                </p>
                            </div>
                            ) : (
                            <div className="rounded-[10px] border border-hairline-strong bg-surface-elevated p-6">
                                <h2 className={metaLabel}>How it works</h2>
                                <dl className="mt-5 divide-y divide-hairline text-sm">
                                    <div className="flex items-baseline justify-between gap-4 pb-4">
                                        <dt className="text-content-muted">Today</dt>
                                        <dd className="font-semibold text-content">$0</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 py-4">
                                        <dt className="text-content-muted">First {trialPeriod}</dt>
                                        <dd className="text-content">Plus Cloud plan, free</dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 pt-4">
                                        <dt className="text-content-muted">After that</dt>
                                        <dd className="text-content">{price}, cancel any time</dd>
                                    </div>
                                </dl>
                                <p className="mt-6 text-xs leading-5 text-content-ash">
                                    Stripe asks for a payment method but charges nothing today. The plan renews at {price} when
                                    the free {trialPeriod} end, unless you cancel before then from your{' '}
                                    <Link href="/account" className="text-content-muted underline decoration-hairline-strong underline-offset-4">
                                        account
                                    </Link>
                                    . One trial code per account; accounts that already have a Cloud plan can&apos;t redeem one.
                                </p>
                            </div>
                            )}
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </>
    )
}
