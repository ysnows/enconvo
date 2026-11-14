import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { getLocale } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import type { Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  ageConfirmationMetadata,
  consumeRegistrationAgeConfirmation,
  needsAgeConfirmation,
} from '@/lib/age-gate'
import {
  type AppleSignInContext,
  type AppleSignInProblem,
  appleContextQuery,
  appleLoginPath,
  appleReturnParams,
  appleSignInProblem,
  clearAppleSignInContext,
  deleteNewAppleAccount,
  readAppleSignInContext,
  redeemAppleHandoff,
} from '@/lib/apple-sign-in'
import { hasConsent } from '@/lib/cookie-consent'
import { finishOAuthSignIn } from '@/lib/finish-oauth-sign-in'
import { recordWebsiteSignup } from '@/lib/signup-analytics'

const SUPPORT_EMAIL = 'support@enconvo.com'

type Step =
  | { name: 'signing_in' }
  | { name: 'problem'; problem: AppleSignInProblem }
  | { name: 'new_account'; session: Session }

// The handoff code, read once from the address bar and kept only here: it lives through the
// switch to the visitor's language below and is gone once redeemed or refused.
let pendingCode: string | null = null

/**
 * Where the Worker returns Sign in with Apple's web flow (ADR 0216): `#handoff=<code>`, or
 * `#error=<reason>`. The code is redeemed once for the account's session, which goes into this
 * browser, then the sign-in ends as a Google one does, with the query the login page had before
 * it left for Apple (lib/apple-sign-in). An account Apple just made with a Hide My Email address
 * first shows a one-time notice, which can remove it again for someone who already has one.
 */
export default function AppleSignIn() {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [step, setStep] = useState<Step>({ name: 'signing_in' })
  const [context, setContext] = useState<AppleSignInContext | null>(null)
  const [busy, setBusy] = useState<'continuing' | 'removing' | null>(null)
  const [removeFailed, setRemoveFailed] = useState(false)
  const handledLocale = useRef('')
  const locale = getLocale(context?.locale ?? router.locale)

  async function carryOn(session: Session, saved: AppleSignInContext | null) {
    const query = appleContextQuery(saved)
    const language = getLocale(saved?.locale ?? router.locale)
    clearAppleSignInContext()
    // The sign-up age check, as /auth/callback runs it for Google (lib/age-gate).
    const answeredOnRegister = consumeRegistrationAgeConfirmation()
    if (needsAgeConfirmation(session.user)) {
      const { error: updateError } = answeredOnRegister
        ? await supabase.auth.updateUser({ data: ageConfirmationMetadata() })
        : { error: true }
      if (updateError) {
        await router.push({ pathname: '/confirm-age', query }, undefined, {
          locale: language,
        })
        return
      }
    }
    await finishOAuthSignIn(supabase, session, router, language, query)
  }

  async function redeem(code: string, saved: AppleSignInContext | null) {
    const answer = await redeemAppleHandoff(code, hasConsent('analytics'))
    if (!answer.ok) {
      setStep({ name: 'problem', problem: appleSignInProblem(answer.reason) })
      return
    }
    const { data, error } = await supabase.auth.setSession({
      access_token: answer.session.accessToken,
      refresh_token: answer.session.refreshToken,
    })
    if (error || !data.session) {
      setStep({ name: 'problem', problem: 'failed' })
      return
    }
    if (answer.session.created)
      recordWebsiteSignup(data.session.user, 'apple', saved?.startedAt ?? 0)
    if (answer.session.created && answer.session.hiddenEmail) {
      setStep({ name: 'new_account', session: data.session })
      return
    }
    await carryOn(data.session, saved)
  }

  useEffect(() => {
    if (!router.isReady || handledLocale.current === router.locale) return
    handledLocale.current = router.locale
    const params = appleReturnParams()
    const code = params.get('handoff')
    if (code) {
      pendingCode = code
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname
      )
    }
    const saved = readAppleSignInContext()
    setContext(saved)
    const error = params.get('error')
    // The Worker's return has no language; the login page's comes back.
    const language = getLocale(saved?.locale ?? router.locale)
    if (language !== router.locale) {
      void router.replace(
        { pathname: '/login/apple', query: error ? { error } : {} },
        undefined,
        { locale: language }
      )
      return
    }
    // Next's own record of the address drops the code too.
    if (code) void router.replace('/login/apple', undefined, { shallow: true })
    const problem = error ? appleSignInProblem(error) : null
    const handoff = pendingCode
    pendingCode = null
    if (problem === 'cancelled' || (!problem && !handoff)) {
      // Apple's page was closed, or there's nothing to finish: back to where the sign-in began.
      clearAppleSignInContext()
      void router.replace(appleLoginPath(saved), undefined, {
        locale: language,
      })
      return
    }
    if (problem) {
      setStep({ name: 'problem', problem })
      return
    }
    if (!saved) {
      // This tab didn't choose Continue with Apple: a code from anywhere else stays unspent.
      setStep({ name: 'problem', problem: 'expired' })
      return
    }
    void redeem(handoff, saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.locale])

  async function continueWithNewAccount(session: Session) {
    setBusy('continuing')
    await carryOn(session, context)
  }

  async function switchToExistingAccount(session: Session) {
    setBusy('removing')
    setRemoveFailed(false)
    const {
      data: { session: current },
    } = await supabase.auth.getSession()
    if (!(await deleteNewAppleAccount((current ?? session).access_token))) {
      setBusy(null)
      setRemoveFailed(true)
      return
    }
    await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
    clearAppleSignInContext()
    await router.replace(appleLoginPath(context), undefined, { locale })
  }

  const problemText: Record<AppleSignInProblem, string> = {
    cancelled: '',
    unavailable: t('Sign in with Apple isn’t available right now.'),
    blocked: t('This account can’t sign in. Email {p0} for help.', {
      p0: SUPPORT_EMAIL,
    }),
    expired: t('This sign-in expired. Try again.'),
    failed: t('Couldn’t sign in with Apple. Try again.'),
  }

  return (
    <>
      <Head>
        <title>{t('Log In - Enconvo')}</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        {step.name === 'new_account' ? (
          <div className="w-full max-w-[400px] space-y-8 px-4">
            <div className="flex flex-col items-center space-y-8">
              <Logo className="h-16 w-auto" />
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-medium tracking-tight text-white">
                  {t('This is a new account')}
                </h2>
                <p className="text-base text-[#888888]">
                  {t(
                    'You signed in with Apple and chose Hide My Email, so Enconvo made a new account with a private address.'
                  )}
                </p>
              </div>

              <div className="w-full space-y-1.5 rounded-xl border border-[#333333] bg-[#242424] px-4 py-3">
                <p className="text-sm font-medium text-white">
                  {t('Already have an Enconvo account?')}
                </p>
                <p className="text-sm leading-5 text-[#888888]">
                  {t(
                    'If it has points or a plan, choose Use my existing account. This new account is removed, and you log in with your existing account instead. You can link Apple to it later in Settings › Account in the Enconvo iPhone app.'
                  )}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3">
                <Button
                  onClick={() => continueWithNewAccount(step.session)}
                  disabled={busy !== null}
                  className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
                >
                  {busy === 'continuing' && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('Continue')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => switchToExistingAccount(step.session)}
                  disabled={busy !== null}
                  className="h-10 w-full rounded-xl border-[#333333] bg-[#242424] font-medium text-[#888888] transition-all duration-200 hover:bg-[#2C2C2C] hover:text-[#999999]"
                >
                  {busy === 'removing' && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {busy === 'removing'
                    ? t('Removing the new account…')
                    : t('Use my existing account')}
                </Button>
                {removeFailed && (
                  <p
                    role="alert"
                    className="text-center text-[12px] leading-4 text-red-400"
                  >
                    {t(
                      'We couldn’t remove the new account. Try again, or email {p0}.',
                      { p0: SUPPORT_EMAIL }
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[320px] space-y-8 px-4">
            <div className="flex flex-col items-center space-y-6">
              <Link href="/" aria-label={t('Home')}>
                <Logo className="h-16 w-auto" />
              </Link>
              <h2 className="text-center text-3xl font-medium tracking-tight text-white">
                {t('Sign in with Apple')}
              </h2>
            </div>

            {step.name === 'problem' ? (
              <div className="space-y-6">
                <p
                  role="alert"
                  className="rounded-[10px] border border-white/10 bg-white/[0.025] px-4 py-4 text-center text-[13px] leading-[18px] text-[#888888]"
                >
                  {problemText[step.problem]}
                </p>
                <Button
                  asChild
                  className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
                >
                  <Link
                    href={appleLoginPath(context)}
                    locale={locale}
                    onClick={clearAppleSignInContext}
                  >
                    {t('Back to log in')}
                  </Link>
                </Button>
              </div>
            ) : (
              <p
                role="status"
                className="flex items-center justify-center gap-2 text-sm text-[#888888]"
              >
                <ReloadIcon className="h-4 w-4 animate-spin" />
                {t('Signing in…')}
              </p>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/login/apple')
