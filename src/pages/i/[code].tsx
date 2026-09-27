import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { SITE_URL } from '@/data/siteMetadata'
import { trackEvent } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import {
    clearInviteCookie,
    fetchInviteCode,
    formatRewardUsd,
    inviteCookieHeader,
    normalizeInviteCode,
    redeemPendingInvite,
    type RedeemResult,
} from '@/lib/invite'

// "unknown" = the Worker could not be reached while rendering; the browser asks again.
type InviteStatus = 'valid' | 'invalid' | 'unknown'

interface InvitePageProps {
    code: string
    status: InviteStatus
    rewardUsd: number | null
}

const LOOKUP_TIMEOUT_MS = 3500
const DOWNLOAD_ARM64 = 'https://api.enconvo.com/app/download?arch=arm64&platform=darwin'
const DOWNLOAD_X64 = 'https://api.enconvo.com/app/download?arch=x64&platform=darwin'
const OG_IMAGE = `${SITE_URL}/og/enconvo-mac-agent-v1.jpg`

const primaryButton =
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-content'
const secondaryButton =
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-5 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06]'
const metaLabel = 'text-[11px] font-medium uppercase tracking-[0.16em] text-content-muted'

export const getServerSideProps: GetServerSideProps<InvitePageProps> = async ({ params, res }) => {
    const code = normalizeInviteCode(typeof params?.code === 'string' ? params.code : '')
    let status: InviteStatus = code ? 'unknown' : 'invalid'
    let rewardUsd: number | null = null

    if (code) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
        const result = await fetchInviteCode(code, controller.signal)
        clearTimeout(timer)
        if (result.ok) {
            status = result.data.valid ? 'valid' : 'invalid'
            rewardUsd = result.data.reward_usd
        }
    }

    // Keep a well-formed code even when the lookup failed: Redemption checks it again.
    if (status !== 'invalid') res.setHeader('Set-Cookie', inviteCookieHeader(code))
    res.setHeader('Cache-Control', 'private, no-store')

    return { props: { code, status, rewardUsd } }
}

function AppleLogoIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
    )
}

function DownloadButton({ primary }: { primary: boolean }) {
    return (
        <a
            href={DOWNLOAD_ARM64}
            onClick={() => trackEvent('download_click', { arch: 'arm64', placement: 'invite' })}
            className={primary ? primaryButton : secondaryButton}
        >
            <AppleLogoIcon className="h-4 w-4" />
            Download for Mac
        </a>
    )
}

function IntelNote() {
    return (
        <p className="mt-3 text-xs leading-5 text-content-ash">
            Free to start · macOS 14+ ·{' '}
            <a
                href={DOWNLOAD_X64}
                onClick={() => trackEvent('download_click', { arch: 'x64', placement: 'invite' })}
                className="text-content-muted underline decoration-hairline-strong underline-offset-4 hover:text-content"
            >
                Intel Mac download
            </a>
        </p>
    )
}

function RedeemNotice({ result }: { result: RedeemResult }) {
    let title = "We couldn't add this invite"
    let body = result.ok ? '' : result.message
    if (result.ok) {
        const reward = formatRewardUsd(result.data.reward_usd)
        title = 'Invite code redeemed'
        body = result.data.qualified
            ? `You and your friend each got ${reward} in Cloud points.`
            : `Sign in to the Enconvo app on a device that's new to Enconvo, and you both get ${reward} in Cloud points.`
    } else if (!result.terminal) {
        body = `${result.message} We'll try again the next time you sign in.`
    }

    return (
        <div role="status" className="mt-8 flex max-w-xl items-start gap-3 rounded-lg border border-hairline bg-surface-card p-4">
            {result.ok ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-signal-green" aria-hidden="true" />
            ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-content-muted" aria-hidden="true" />
            )}
            <div>
                <p className="text-sm font-medium text-content">{title}</p>
                <p className="mt-1 text-sm leading-6 text-content-muted">{body}</p>
            </div>
        </div>
    )
}

export default function InvitePage({ code, status: initialStatus, rewardUsd: initialRewardUsd }: InvitePageProps) {
    const [status, setStatus] = useState(initialStatus)
    const [rewardUsd, setRewardUsd] = useState(initialRewardUsd)
    const [signedIn, setSignedIn] = useState(false)
    const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null)

    useEffect(() => {
        if (initialStatus !== 'unknown') return
        let cancelled = false
        void fetchInviteCode(code).then((result) => {
            if (cancelled || !result.ok) return
            setRewardUsd(result.data.reward_usd)
            setStatus(result.data.valid ? 'valid' : 'invalid')
            if (!result.data.valid) clearInviteCookie()
        })
        return () => {
            cancelled = true
        }
    }, [code, initialStatus])

    // Already signed in: redeem right here and show the outcome in the page.
    useEffect(() => {
        if (initialStatus === 'invalid') return
        let cancelled = false
        void supabase.auth.getSession().then(async ({ data }) => {
            if (cancelled || !data.session) return
            setSignedIn(true)
            const result = await redeemPendingInvite(data.session.access_token, { notify: false })
            if (!cancelled && result) setRedeemResult(result)
        })
        return () => {
            cancelled = true
        }
    }, [initialStatus])

    const reward = rewardUsd === null ? null : formatRewardUsd(rewardUsd)
    const shareTitle = 'A friend invited you to Enconvo'
    const shareDescription = reward
        ? `Join Enconvo, the AI assistant for your Mac, and you both get ${reward} in Cloud points.`
        : 'Join Enconvo, the AI assistant for your Mac, and you both get Cloud points.'

    if (status === 'invalid') {
        return (
            <>
                <Head>
                    <title>Invite link not active - Enconvo</title>
                </Head>
                <div className="min-h-screen bg-canvas text-content">
                    <SiteNav />
                    <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
                        <p className={metaLabel}>Invite</p>
                        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                            This invite link isn&apos;t active
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
                            {code ? (
                                <>
                                    The code <span className="font-mono text-content">{code}</span> doesn&apos;t
                                    exist or is no longer in use.
                                </>
                            ) : (
                                'The link looks incomplete.'
                            )}{' '}
                            Ask your friend for a new link, or start with Enconvo for free.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <DownloadButton primary />
                            <Link href="/" className={secondaryButton}>
                                See what Enconvo does
                            </Link>
                        </div>
                        <IntelNote />
                    </main>
                    <Footer />
                </div>
            </>
        )
    }

    const steps = [
        {
            title: 'Create your account',
            body: 'Sign up from this page. The invite is added to your new account automatically.',
        },
        {
            title: 'Sign in to the app',
            body: "Download Enconvo and sign in on a Mac, Windows PC or iPhone that's new to Enconvo.",
        },
        {
            title: reward ? `You both get ${reward}` : 'You both get Cloud points',
            body: 'The Cloud points land in both accounts, on top of your welcome bonus, and never expire.',
        },
    ]

    return (
        <>
            <Head>
                <title>You&apos;re invited to Enconvo</title>
                <meta name="description" content={shareDescription} />
                <meta property="og:type" content="website" key="og:type" />
                <meta property="og:site_name" content="Enconvo" key="og:site_name" />
                <meta property="og:url" content={`${SITE_URL}/i/${code}`} key="og:url" />
                <meta property="og:title" content={shareTitle} key="og:title" />
                <meta property="og:description" content={shareDescription} key="og:description" />
                <meta property="og:image" content={OG_IMAGE} key="og:image" />
                <meta property="og:image:width" content="1200" key="og:image:width" />
                <meta property="og:image:height" content="630" key="og:image:height" />
                <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
                <meta name="twitter:site" content="@enconvo_ai" key="twitter:site" />
                <meta name="twitter:title" content={shareTitle} key="twitter:title" />
                <meta name="twitter:description" content={shareDescription} key="twitter:description" />
                <meta name="twitter:image" content={OG_IMAGE} key="twitter:image" />
            </Head>
            <div className="min-h-screen bg-canvas text-content">
                <SiteNav />
                <main>
                    <section className="mx-auto grid max-w-[1240px] gap-12 px-6 pb-20 pt-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-12">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className={metaLabel}>Invite code</span>
                                <span className="rounded-md border border-hairline bg-surface-card px-2 py-1 font-mono text-sm tracking-[0.12em] text-content">
                                    {code}
                                </span>
                            </div>
                            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                                A friend invited you to Enconvo
                            </h1>
                            <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                                {reward ? (
                                    <>
                                        You both get <span className="font-semibold text-content">{reward} in Cloud points</span>{' '}
                                        to use on AI chat, images, video, speech and search in Enconvo.
                                    </>
                                ) : (
                                    'You both get Cloud points to use on AI chat, images, video, speech and search in Enconvo.'
                                )}
                            </p>

                            {redeemResult && <RedeemNotice result={redeemResult} />}

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                {signedIn ? (
                                    <>
                                        <DownloadButton primary />
                                        <Link href="/account" className={secondaryButton}>
                                            Go to your account
                                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/register" className={primaryButton}>
                                            Create your account
                                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                        <DownloadButton primary={false} />
                                    </>
                                )}
                            </div>
                            {signedIn ? (
                                <IntelNote />
                            ) : (
                                <p className="mt-4 text-sm text-content-muted">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-content underline decoration-hairline-strong underline-offset-4">
                                        Sign in
                                    </Link>
                                </p>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-[10px] border border-hairline-strong bg-surface-elevated">
                            <Image
                                src="/posters/app-sidebar.jpg"
                                alt="The Enconvo sidebar working next to Finder on a Mac"
                                width={1120}
                                height={630}
                                priority
                                sizes="(min-width: 1024px) 600px, 100vw"
                                className="h-auto w-full"
                            />
                        </div>
                    </section>

                    <section className="border-t border-hairline">
                        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-12">
                            <h2 className={metaLabel}>How it works</h2>
                            <ol className="mt-6 grid gap-4 md:grid-cols-3">
                                {steps.map((step, index) => (
                                    <li key={step.title} className="rounded-lg border border-hairline bg-surface-card p-6">
                                        <span className="font-mono text-xs text-content-ash">0{index + 1}</span>
                                        <h3 className="mt-3 text-base font-semibold text-content">{step.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-content-muted">{step.body}</p>
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-6 max-w-3xl text-xs leading-5 text-content-ash">
                                Signing in on the website doesn&apos;t count. Each account can use one invite, within 7 days
                                of signing up. If you create your account somewhere else, enter code{' '}
                                <span className="font-mono text-content-muted">{code}</span> in the Enconvo app.
                            </p>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    )
}
