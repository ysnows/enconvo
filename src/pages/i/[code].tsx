import { I18nText } from '@/i18n/I18nText'
import { localizePath } from '@/i18n/locale'
import { withI18nProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { InviteRedeemMessage } from '@/components/InviteRedeemMessage'
import {
  metaLabel,
  primaryButton,
  secondaryButton,
} from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { IPHONE_APP_TESTFLIGHT_URL } from '@/data/iphoneApp'
import { SITE_URL } from '@/data/siteMetadata'
import { affiliateCode } from '@/lib/affiliate-journey'
import { trackEvent } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { useInviteRedeemed } from '@/lib/invite-auto-redeem'
import {
  clearInviteCookie,
  fetchInviteCode,
  formatPoints,
  formatRewardUsd,
  getLastRedeemOutcome,
  INVITE_DEVICE_COPY,
  INVITER_TERMS,
  inviteCookieHeader,
  normalizeInviteCode,
  type InviteCodeInfo,
  type RedeemResult,
} from '@/lib/invite'

/** The Affiliate code to start a journey with, when the link belongs to an approved Affiliate. */
function affiliateLinkCode(info: InviteCodeInfo): string | null {
  return info.valid && info.tier === 'affiliate'
    ? affiliateCode(info.affiliate_code)
    : null
}

// "unknown" = the Worker could not be reached while rendering; the browser asks again.
type InviteStatus = 'valid' | 'invalid' | 'unknown'

interface InvitePageProps {
  code: string
  status: InviteStatus
  rewardUsd: number | null
  rewardPoints: number | null
  /** An approved Affiliate's code when the link is theirs; the page starts their Affiliate journey with it. */
  affiliateVia: string | null
}

const LOOKUP_TIMEOUT_MS = 3500
const DOWNLOAD_ARM64 =
  'https://api.enconvo.com/app/download?arch=arm64&platform=darwin'
const DOWNLOAD_X64 =
  'https://api.enconvo.com/app/download?arch=x64&platform=darwin'
const OG_IMAGE = `${SITE_URL}/og/enconvo-speak-select-ask-v2.jpg`

export const getServerSideProps: GetServerSideProps<InvitePageProps> =
  withI18nProps(async ({ params, res }) => {
    const code = normalizeInviteCode(
      typeof params?.code === 'string' ? params.code : ''
    )
    let status: InviteStatus = code ? 'unknown' : 'invalid'
    let rewardUsd: number | null = null
    let rewardPoints: number | null = null
    let affiliateVia: string | null = null

    if (code) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
      const result = await fetchInviteCode(code, controller.signal)
      clearTimeout(timer)
      if (result.ok) {
        status = result.data.valid ? 'valid' : 'invalid'
        rewardUsd = result.data.reward_usd
        rewardPoints = result.data.reward_points
        affiliateVia = affiliateLinkCode(result.data)
      }
    }

    // Keep a well-formed code even when the lookup failed: Redemption checks it again.
    if (status !== 'invalid')
      res.setHeader('Set-Cookie', inviteCookieHeader(code))
    res.setHeader('Cache-Control', 'private, no-store')

    return { props: { code, status, rewardUsd, rewardPoints, affiliateVia } }
  }, '/i/[code]')

function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

function DownloadButton({ primary }: { primary: boolean }) {
  const { t, locale } = useI18n()

  return (
    <a
      href={localizePath(DOWNLOAD_ARM64, locale)}
      onClick={() =>
        trackEvent('download_click', { arch: 'arm64', placement: 'invite' })
      }
      className={primary ? primaryButton : secondaryButton}
    >
      <AppleLogoIcon className="h-4 w-4" />
      {t('Download for Mac')}
    </a>
  )
}

function IntelNote() {
  const { t, locale } = useI18n()

  return (
    <p className="mt-3 text-xs leading-5 text-content-ash">
      <I18nText
        source={'Free to start · macOS 14+ · {p0}'}
        values={{
          p0: (
            <a
              href={localizePath(DOWNLOAD_X64, locale)}
              onClick={() =>
                trackEvent('download_click', {
                  arch: 'x64',
                  placement: 'invite',
                })
              }
              className="text-content-muted underline decoration-hairline-strong underline-offset-4 hover:text-content"
            >
              {t('Intel Mac download')}
            </a>
          ),
        }}
      />
    </p>
  )
}

const phoneLink =
  'text-content underline decoration-hairline-strong underline-offset-4'

/** A visitor on a phone has no use for the Mac download: where the phone apps are. */
function PhoneApps() {
  return (
    <p className="mt-4 text-sm text-content-muted">
      <I18nText
        source={'On your phone? Get Enconvo for {p0} or {p1}.'}
        values={{
          p0: (
            <a
              href={IPHONE_APP_TESTFLIGHT_URL}
              onClick={() =>
                trackEvent('iphone_app_click', { placement: 'invite' })
              }
              target="_blank"
              rel="noreferrer"
              className={phoneLink}
            >
              iPhone
            </a>
          ),
          p1: (
            <Link
              href="/android"
              onClick={() =>
                trackEvent('download_click', {
                  platform: 'android',
                  placement: 'invite',
                })
              }
              className={phoneLink}
            >
              Android
            </Link>
          ),
        }}
      />
    </p>
  )
}

function RedeemNotice({ result }: { result: RedeemResult }) {
  return (
    <div
      role="status"
      className="mt-8 flex max-w-xl items-start gap-3 rounded-lg border border-hairline bg-surface-card p-4"
    >
      <InviteRedeemMessage result={result} />
    </div>
  )
}

export default function InvitePage({
  code,
  status: initialStatus,
  rewardUsd: initialRewardUsd,
  rewardPoints: initialRewardPoints,
  affiliateVia: initialAffiliateVia,
}: InvitePageProps) {
  const { t, locale } = useI18n()
  const router = useRouter()

  const [status, setStatus] = useState(initialStatus)
  const [rewardUsd, setRewardUsd] = useState(initialRewardUsd)
  const [rewardPoints, setRewardPoints] = useState(initialRewardPoints)
  const [affiliateVia, setAffiliateVia] = useState(initialAffiliateVia)
  const [signedIn, setSignedIn] = useState(false)
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(() => {
    const outcome = getLastRedeemOutcome()
    return outcome?.code === code ? outcome : null
  })

  useEffect(() => {
    if (initialStatus !== 'unknown') return
    let cancelled = false
    void fetchInviteCode(code).then((result) => {
      if (cancelled || !result.ok) return
      setRewardUsd(result.data.reward_usd)
      setRewardPoints(result.data.reward_points)
      setAffiliateVia(affiliateLinkCode(result.data))
      setStatus(result.data.valid ? 'valid' : 'invalid')
      if (!result.data.valid) clearInviteCookie()
    })
    return () => {
      cancelled = true
    }
  }, [code, initialStatus])

  // An Affiliate's link counts as their `?via=` link too (ADR 0278): putting the code in the
  // address lets `useAffiliateJourney` in `_app` record the visit, with the visitor's consent,
  // so a purchase on the website is credited even without an app sign-in. A `?via=` the
  // address already carries is left as it is.
  useEffect(() => {
    if (!affiliateVia || !router.isReady || router.query.via) return
    void router.replace(
      { pathname: router.pathname, query: { ...router.query, via: affiliateVia } },
      undefined,
      { shallow: true, scroll: false }
    )
  }, [affiliateVia, router])

  // Already signed in: `useInviteAutoRedeem` in `_app` redeems the cookie this
  // page set, and the page shows that outcome here instead of in the site toast.
  useEffect(() => {
    if (initialStatus === 'invalid') return
    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setSignedIn(true)
    })
    return () => {
      cancelled = true
    }
  }, [initialStatus])

  useInviteRedeemed((outcome) => {
    if (outcome.code !== code) return
    setRedeemResult(outcome)
    if (outcome.ok) setSignedIn(true)
  })

  const points =
    rewardPoints === null || rewardUsd === null
      ? null
      : { points: formatPoints(rewardPoints), usd: formatRewardUsd(rewardUsd) }
  const { ratePercent, windowDays } = INVITER_TERMS
  const shareTitle = 'A friend invited you to Enconvo'
  const shareDescription = points
    ? t(
        'Join Enconvo and get {p0} Cloud points to use on AI chat, images, video, speech and search.',
        { p0: points.points }
      )
    : t(
        'Join Enconvo and get free Cloud points to use on AI chat, images, video, speech and search.'
      )

  if (status === 'invalid') {
    return (
      <>
        <Head>
          <title>{t('Invite link not active - Enconvo')}</title>
        </Head>
        <div className="min-h-screen bg-canvas text-content">
          <SiteNav />
          <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
            <p className={metaLabel}>{t('Invite')}</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
              {t("This invite link isn't active")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
              <I18nText
                source={
                  '{p0} Ask your friend for a new link, or start with Enconvo for free.'
                }
                values={{
                  p0: code ? (
                    <>
                      {t('The code ')}
                      <span className="font-mono text-content">
                        {code}
                      </span>{' '}
                      {t(" doesn't exist or is no longer in use.")}
                    </>
                  ) : (
                    t('The link looks incomplete.')
                  ),
                }}
              />
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <DownloadButton primary />
              <Link href="/" className={secondaryButton}>
                {t('See what Enconvo does')}
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
      title: t('Create your account'),
      body: t(
        'Sign up from this page. The invite is added to your new account automatically.'
      ),
    },
    {
      title: points
        ? t('Get {p0} Cloud points', { p0: points.points })
        : t('Get your Cloud points'),
      body: t(
        'Download Enconvo and sign in on {p0}. The points come on top of your welcome bonus and never expire.',
        { p0: t(INVITE_DEVICE_COPY) }
      ),
    },
    {
      title: t('Your friend earns when you pay'),
      body: affiliateVia
        ? t(
            'If you buy a plan or a license, the person who shared this link earns a commission. You pay nothing extra.'
          )
        : t(
            'If you buy a plan or a license within {p0} days of signing up, your friend gets {p1}% of that first payment in Cloud points. You pay nothing extra.',
            { p0: windowDays, p1: ratePercent }
          ),
    },
  ]

  return (
    <>
      <Head>
        <title>{t("You're invited to Enconvo")}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="Enconvo" key="og:site_name" />
        <meta
          property="og:url"
          content={`${SITE_URL}/i/${code}`}
          key="og:url"
        />
        <meta property="og:title" content={t(shareTitle)} key="og:title" />
        <meta
          property="og:description"
          content={shareDescription}
          key="og:description"
        />
        <meta property="og:image" content={OG_IMAGE} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta
          name="twitter:card"
          content="summary_large_image"
          key="twitter:card"
        />
        <meta name="twitter:site" content="@enconvo_ai" key="twitter:site" />
        <meta
          name="twitter:title"
          content={t(shareTitle)}
          key="twitter:title"
        />
        <meta
          name="twitter:description"
          content={shareDescription}
          key="twitter:description"
        />
        <meta name="twitter:image" content={OG_IMAGE} key="twitter:image" />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main>
          <section className="mx-auto grid max-w-[1240px] gap-12 px-6 pb-20 pt-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-12">
            <div>
              <div className="flex items-center gap-3">
                <span className={metaLabel}>{t('Invite code')}</span>
                <span className="rounded-md border border-hairline bg-surface-card px-2 py-1 font-mono text-sm tracking-[0.12em] text-content">
                  {code}
                </span>
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                {t('A friend invited you to Enconvo')}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                {points ? (
                  <I18nText
                    source={
                      'Sign up and get {p0} to use on AI chat, images, video, speech and search in Enconvo.'
                    }
                    values={{
                      p0: (
                        <span className="font-semibold text-content">
                          {t('{p0} Cloud points ({p1})', {
                            p0: points.points,
                            p1: points.usd,
                          })}
                        </span>
                      ),
                    }}
                  />
                ) : (
                  t(
                    'Sign up and get free Cloud points to use on AI chat, images, video, speech and search in Enconvo.'
                  )
                )}
              </p>

              {redeemResult && <RedeemNotice result={redeemResult} />}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {signedIn ? (
                  <>
                    <DownloadButton primary />
                    <Link href="/account" className={secondaryButton}>
                      {t('Go to your account')}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className={primaryButton}>
                      {t('Create your account')}
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
                  {t('Already have an account?')}{' '}
                  <Link
                    href="/login"
                    className="text-content underline decoration-hairline-strong underline-offset-4"
                  >
                    {t('Sign in')}
                  </Link>
                </p>
              )}
              <PhoneApps />
            </div>

            <div className="overflow-hidden rounded-[10px] border border-hairline-strong bg-surface-elevated">
              <Image
                src="/posters/app-sidebar.jpg"
                alt={t('The Enconvo sidebar working next to Finder on a Mac')}
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
              <h2 className={metaLabel}>{t('How it works')}</h2>
              <ol className="mt-6 grid gap-4 md:grid-cols-3">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-lg border border-hairline bg-surface-card p-6"
                  >
                    <span className="font-mono text-xs text-content-ash">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-content">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-content-muted">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 max-w-3xl text-xs leading-5 text-content-ash">
                <I18nText
                  source={
                    "Signing in on the website doesn't count. Each account can use one invite, within 7 days of signing up. If you create your account somewhere else, enter code {p0} in the Enconvo app."
                  }
                  values={{
                    p0: (
                      <span className="font-mono text-content-muted">
                        {code}
                      </span>
                    ),
                  }}
                />{' '}
                {t(
                  "Signing in on an Android phone doesn't pay the reward yet: sign in on a computer or an iPhone as well to get it."
                )}{' '}
                {t(
                  'Every Enconvo account has a link like this one to share: find yours under Settings > Account > Affiliate in the app, or on your account page.'
                )}
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}
