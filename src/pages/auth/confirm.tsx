import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { I18nText } from '@/i18n/I18nText'
import { getLocale } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons'
import {
  isAuthRetryableFetchError,
  type EmailOtpType,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authFlowHref, emailLinkDestination } from '@/lib/auth-flow'
import { syncCurrentEmailPreference } from '@/lib/email-preferences-client'

const OTP_TYPES: EmailOtpType[] = [
  'signup',
  'email',
  'recovery',
  'invite',
  'magiclink',
  'email_change',
]

const primaryButtonClass =
  'h-10 w-full rounded-[10px] bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]'

/**
 * Where the links in the sign-up and password reset emails land (supabase/templates). The
 * link's token hash signs in here with verifyOtp, so it works in any browser, unlike a PKCE
 * code, which only the browser that began the sign-up can exchange. The page then goes on to
 * the redirect the sign-up asked for, where /login hands an app sign-up to Enconvo.
 */
export default function AuthConfirm() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [state, setState] = useState<
    'verifying' | 'invalid' | 'offline' | 'sent'
  >('verifying')
  const [attempt, setAttempt] = useState(0)
  const [destination, setDestination] = useState('/login')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // The token works once: Strict Mode's second effect run must not spend it again.
  const verifiedAttempt = useRef(-1)

  const type =
    typeof router.query.type === 'string' &&
    (OTP_TYPES as string[]).includes(router.query.type)
      ? (router.query.type as EmailOtpType)
      : null
  const destinationQuery = Object.fromEntries(
    new URLSearchParams(destination.split('?')[1] ?? '')
  )

  useEffect(() => {
    if (!router.isReady || verifiedAttempt.current === attempt) return
    verifiedAttempt.current = attempt
    const next = emailLinkDestination(
      window.location.search,
      window.location.origin
    )
    setDestination(next)
    // The redirect carries the language the sign-up or reset was made in.
    const language =
      new URLSearchParams(next.split('?')[1] ?? '').get('language') ?? locale
    const showInLanguage = () => {
      if (getLocale(language) !== locale)
        void router.replace(
          { pathname: router.pathname, query: router.query },
          router.asPath,
          { locale: getLocale(language), scroll: false }
        )
    }

    const verify = async () => {
      const tokenHash = router.query.token_hash
      if (typeof tokenHash !== 'string' || !tokenHash || !type) {
        setState('invalid')
        showInLanguage()
        return
      }
      const {
        data: { session: previous },
      } = await supabase.auth.getSession()
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      if (error) {
        // verifyOtp signs this browser out first; a link used before must not end its session.
        if (previous) await supabase.auth.setSession(previous)
        setState(isAuthRetryableFetchError(error) ? 'offline' : 'invalid')
        showInLanguage()
        return
      }
      if (data.session && (type === 'signup' || type === 'email')) {
        // The account's first session: save the product email choice made on /register.
        syncCurrentEmailPreference(data.session.access_token).catch(
          (syncError) =>
            console.error('Unable to sync email preferences:', syncError)
        )
      }
      await router.replace(next, undefined, { locale: getLocale(language) })
    }

    void verify()
  }, [router.isReady, attempt])

  async function sendNewLink() {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    setSending(true)
    setError('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}${destination}` },
    })
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setState('sent')
  }

  return (
    <>
      <Head>
        <title>
          {type === 'recovery'
            ? t('Reset Password - Enconvo')
            : t('Confirm your email - Enconvo')}
        </title>
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A] [color-scheme:dark]">
        <div className="w-full max-w-[360px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-6 text-center">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>

            {state === 'verifying' && (
              <p
                role="status"
                className="flex items-center gap-2 text-base text-[#888888]"
              >
                <ReloadIcon className="h-4 w-4 animate-spin" aria-hidden />
                {t('Checking your link…')}
              </p>
            )}

            {state === 'offline' && (
              <p role="alert" className="text-base text-[#888888]">
                {t(
                  'Could not reach Enconvo. Check your connection and try again.'
                )}
              </p>
            )}

            {state === 'invalid' && (
              <div className="space-y-4">
                <h1 className="text-3xl font-medium tracking-tight text-white">
                  {t('This link is invalid or has expired')}
                </h1>
                <p className="text-base text-[#888888]">
                  {type === 'recovery'
                    ? t(
                        'Password reset links work once. Request a new one to set your password.'
                      )
                    : t(
                        'Email links work once. If you already activated your account, log in. Otherwise, enter your email to get a new link.'
                      )}
                </p>
              </div>
            )}

            {state === 'sent' && (
              <div className="space-y-4">
                <h1 className="text-3xl font-medium tracking-tight text-white">
                  {t('Check your email')}
                </h1>
                <p className="text-base text-[#888888]">
                  <I18nText
                    source="We've sent a new link to {p0}."
                    values={{ p0: <span className="text-white">{email}</span> }}
                  />
                </p>
              </div>
            )}
          </div>

          {state === 'offline' && (
            <Button
              onClick={() => {
                setState('verifying')
                setAttempt((value) => value + 1)
              }}
              className={primaryButtonClass}
            >
              {t('Try again')}
            </Button>
          )}

          {state === 'invalid' && type === 'recovery' && (
            <Link
              href={authFlowHref('/reset_password_send', destinationQuery)}
              className={`flex items-center justify-center text-sm ${primaryButtonClass}`}
            >
              {t('Request a new link')}
            </Link>
          )}

          {state === 'invalid' && type !== 'recovery' && (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder={t('Email address')}
                required
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                value={email}
                className="h-10 rounded-[10px] border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666]"
              />
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-900/30 bg-red-900/20 text-red-400"
                >
                  <AlertDescription className="flex items-center">
                    <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                    {t(error)}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={sendNewLink}
                disabled={sending}
                className={primaryButtonClass}
              >
                {sending && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {sending ? t('Sending…') : t('Send a new link')}
              </Button>
              <p className="text-center text-sm">
                <Link
                  href={authFlowHref('/login', destinationQuery)}
                  className="font-medium text-[#888888] hover:text-[#BBBBBB]"
                >
                  {t('Log in')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/auth/confirm')
