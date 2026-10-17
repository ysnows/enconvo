import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Loader2 } from 'lucide-react'
import { canonicalUrl } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { primaryButton } from '@/components/landing-styles'
import {
  DEFAULT_TERMS,
  fetchProgramTerms,
  type AffiliateApplication,
} from '@/lib/affiliate-program'
import {
  AFFILIATE_DASHBOARD,
  AFFILIATE_LOGIN,
  AFFILIATE_RESET,
  trackAffiliateAction,
} from '@/lib/affiliate-access'
import { useAffiliateAccount } from '@/lib/use-affiliate-account'
import { supabase } from '@/lib/supabase'
import { AffiliateDashboard } from './AffiliateDashboard'
import {
  AffiliateFaq,
  AffiliateHero,
  EarningsCalculator,
  HowItWorks,
  TermsCards,
} from './AffiliateLanding'
import { ApplicationForm } from './ApplicationForm'
import { PendingApplication, RejectedNotice } from './ApplicationStatus'
import { TeamMessage } from './Announcement'
import { card, Notice } from './ui'

/** Returning partners get an entrance above the program description, on phones too. */
export function AffiliateSignIn() {
  const { t } = useI18n()
  return (
    <section
      aria-label={t('Affiliate sign in')}
      className={`${card} flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
    >
      <div>
        <h2 className="text-lg font-semibold text-content">
          {t('Already applied?')}
        </h2>
        <p className="mt-1 text-sm leading-6 text-content-muted">
          {t('Sign in to see your application, commissions and payouts.')}
        </p>
      </div>
      <div className="flex flex-none flex-col items-stretch gap-3 sm:items-end">
        <Link
          href={AFFILIATE_LOGIN}
          className={primaryButton}
          onClick={() => trackAffiliateAction('sign_in_clicked')}
        >
          {t('Affiliate sign in')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href={AFFILIATE_RESET}
          onClick={() => trackAffiliateAction('password_reset_clicked')}
          className="text-center text-sm text-content-muted hover:text-content sm:text-right"
        >
          {t('Forgot password?')}
        </Link>
      </div>
    </section>
  )
}

function OpeningAccount() {
  const { t } = useI18n()
  return (
    <div
      role="status"
      className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-content-muted"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {t('Opening your Affiliate account…')}
    </div>
  )
}

export function AffiliatePortal({
  page,
  renderedAt,
}: {
  page: 'program' | 'dashboard'
  renderedAt?: number
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const { account, refresh, updateAffiliate } = useAffiliateAccount()
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [editing, setEditing] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState(false)
  const opened = useRef('')
  const session = account.session
  const data = account.state === 'loaded' ? account.data : null
  const affiliate = data?.affiliate
  const hasAffiliate = !!affiliate
  const userId = session?.user.id
  const status = affiliate?.status
  const program = data?.program ?? terms
  const destination =
    page === 'dashboard'
      ? account.state === 'signed_out'
        ? AFFILIATE_LOGIN
        : data && !affiliate
        ? '/affiliate#apply'
        : null
      : affiliate
      ? AFFILIATE_DASHBOARD
      : null

  useEffect(() => {
    if (router.isReady && destination) void router.replace(destination)
  }, [router.isReady, destination, router])

  useEffect(() => {
    // Public terms are needed only for visitors; a signed-in response includes them.
    if (
      page !== 'program' ||
      !['signed_out', 'loaded'].includes(account.state) ||
      hasAffiliate
    )
      return
    let active = true
    void fetchProgramTerms().then((result) => {
      if (active && result.ok) setTerms(result.data)
    })
    return () => {
      active = false
    }
  }, [page, account.state, hasAffiliate])

  useEffect(() => {
    setEditing(false)
  }, [session?.user.id])

  useEffect(() => {
    if (page !== 'dashboard' || !status || !userId) return
    const key = `${userId}:${status}`
    if (opened.current === key) return
    opened.current = key
    trackAffiliateAction('portal_opened', status)
  }, [page, userId, status])

  async function switchAccount() {
    setSwitching(true)
    setSwitchError(false)
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    setSwitching(false)
    if (error) {
      setSwitchError(true)
      return
    }
    trackAffiliateAction('account_switched')
    void router.replace(AFFILIATE_LOGIN)
  }

  function submitted(next: AffiliateApplication) {
    updateAffiliate(next)
    setEditing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  let content: React.ReactNode
  if (account.state === 'loading' || destination) {
    content = <OpeningAccount />
  } else if (account.state === 'error') {
    content = (
      <Notice
        tone="error"
        title={t(
          account.expired
            ? 'Your sign-in has expired'
            : "We couldn't load your Affiliate account"
        )}
        action={
          account.expired ? (
            <button
              type="button"
              onClick={() => void switchAccount()}
              disabled={switching}
              className="text-sm text-signal-blue hover:underline"
            >
              {t('Sign in')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-sm text-signal-blue hover:underline"
            >
              {t('Try again')}
            </button>
          )
        }
      >
        {t(
          account.expired
            ? 'Sign in again to apply or see your dashboard.'
            : account.message
        )}
      </Notice>
    )
  } else if (affiliate && data) {
    if (affiliate.status === 'approved' || affiliate.status === 'suspended') {
      content = (
        <AffiliateDashboard
          data={data}
          accessToken={session.access_token}
          email={session.user.email ?? null}
          onAffiliateChanged={(next) => {
            updateAffiliate(next)
            void refresh(true)
          }}
        />
      )
    } else if (affiliate.status === 'pending' && !editing) {
      content = (
        <PendingApplication
          application={affiliate}
          onEdit={() => setEditing(true)}
        />
      )
    } else {
      content = (
        <div className="space-y-8">
          {affiliate.status === 'rejected' ? (
            <RejectedNotice message={affiliate.message} />
          ) : (
            <TeamMessage message={affiliate.message} />
          )}
          <ApplicationForm
            key={session.user.id}
            terms={program}
            accessToken={session.access_token}
            email={session.user.email ?? null}
            previous={affiliate}
            onSubmitted={submitted}
            onCancel={
              affiliate.status === 'pending'
                ? () => setEditing(false)
                : undefined
            }
          />
        </div>
      )
    }
  } else {
    content = (
      <div className="space-y-12 lg:space-y-20">
        {!session ? (
          <AffiliateSignIn />
        ) : (
          <Notice
            tone="info"
            title={t('No Affiliate application for this account')}
          >
            {t('Apply below, or switch to the account you applied with.')}
          </Notice>
        )}
        <AffiliateHero terms={program} />
        <TermsCards terms={program} />
        <EarningsCalculator terms={program} renderedAt={renderedAt} />
        <HowItWorks />
        <ApplicationForm
          key={session?.user.id ?? 'signed-out'}
          terms={program}
          accessToken={session?.access_token ?? null}
          email={session?.user.email ?? null}
          previous={null}
          onSubmitted={submitted}
          onSignOut={session ? () => void switchAccount() : undefined}
        />
        <AffiliateFaq terms={program} />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>
          {t(
            page === 'dashboard'
              ? 'Affiliate dashboard - Enconvo'
              : 'Affiliate program - Enconvo'
          )}
        </title>
        {page === 'program' ? (
          <>
            <meta
              name="description"
              content={t(
                `Earn ${program.commission_rate}% of every payment from customers you refer to Enconvo, renewals included. Paid monthly by PayPal or Wise.`
              )}
            />
            <link
              rel="canonical"
              href={canonicalUrl('/affiliate', locale)}
              key="canonical"
            />
          </>
        ) : (
          <meta name="robots" content="noindex, follow" />
        )}
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
          {session && !destination && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
              <div className="min-w-0">
                <span className="text-xs text-content-muted">
                  {t('Signed in as')}
                </span>
                <div className="break-all text-sm text-content">
                  {session.user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void switchAccount()}
                disabled={switching}
                className="min-h-[44px] text-sm text-content-muted hover:text-content disabled:opacity-50"
              >
                {t('Switch account')}
              </button>
            </div>
          )}
          {switchError && (
            <div className="mb-6">
              <Notice
                tone="error"
                title={t('Could not switch accounts. Please try again.')}
              />
            </div>
          )}
          {content}
        </main>
        <Footer />
      </div>
    </>
  )
}
