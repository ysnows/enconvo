import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'

import { Logo } from '@/components/Logo'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { NativeRouter } from '@/utils/app/native_router'
import { syncCurrentEmailPreference } from '@/lib/email-preferences-client'
import {
  affiliateReturnPath,
  authFlowHref,
  oauthCallbackUrl,
} from '@/lib/auth-flow'
import { offerReturnPath } from '@/lib/welcome-offer'
import { beginGoogleSignupMeasurement } from '@/lib/signup-analytics'

export default function LoginForm({
  loginState,
  setLoginState,
  setUser,
  router,
}) {
  const pageRouter = useRouter()
  router = router ?? pageRouter
  const { t, locale } = useI18n()
  const affiliateLogin =
    !!affiliateReturnPath(router.query) && router.query.from !== 'app'
  const returnUrl = Array.isArray(router.query.returnUrl)
    ? router.query.returnUrl[0]
    : router.query.returnUrl
  // A Welcome offer sign-in returns to the homepage, which claims it; the app isn't opened.
  const offerLogin =
    typeof returnUrl === 'string' &&
    !!offerReturnPath(returnUrl) &&
    router.query.from !== 'app'

  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [continueLogin, setContinueLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailIsLoading, setEmailIsLoading] = React.useState(false)
  const [googleIsLoading, setGoogleIsLoading] = React.useState(false)

  async function signIn() {
    // check if email is valid
    if (!email || !email.includes('@')) {
      alert(t('Please enter a valid email'))
      return
    }

    setEmailIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setError(error.message)
      setEmailIsLoading(false)
      return
    }

    setUser(data.user)

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Enconvo gets a session of its own; "Open Enconvo" on the next page tries again.
    const opened =
      affiliateLogin || offerLogin
        ? 'opened'
        : await NativeRouter.openApp(
            Array.isArray(router.query.source)
              ? router.query.source[0]
              : router.query.source,
            Array.isArray(router.query.handoff)
              ? router.query.handoff[0]
              : router.query.handoff
          )
    if (typeof opened === 'object') alert(opened.error)

    try {
      await syncCurrentEmailPreference(data.session.access_token)
    } catch (syncError) {
      console.error('Unable to sync email preferences:', syncError)
    }

    setLoginState('success')

    setEmailIsLoading(false)
    // setContinueLogin(true)
  }

  async function signInWithEmail() {
    if (continueLogin) {
      // TODO: Implement email provider logic
      // const emailAddress = getEmailProvider(email);
      // if (emailAddress) {
      //     window.location.href = emailAddress;
      // } else {

      // }
      return
    }
    // check if email is valid
    if (!email || !email.includes('@')) {
      alert(t('Please enter a valid email'))
      return
    }

    setEmailIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setError(error.message)
      setEmailIsLoading(false)
      return
    }
    console.log(data)
    alert('open enconvo app')

    setEmailIsLoading(false)
    // setContinueLogin(true)
  }

  // Back from Google's page, the browser can show this page as it was left.
  React.useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setGoogleIsLoading(false)
    }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  async function signInWithGoogle() {
    setGoogleIsLoading(true)
    try {
      // The address bar, not router.query: that stays empty until the router is ready.
      const query = Object.fromEntries(
        new URLSearchParams(window.location.search)
      )
      // Preserve from/source/handoff across the OAuth round-trip so the app can
      // return the user to where login started (e.g. the onboarding guide).
      const redirectUrl = oauthCallbackUrl(
        window.location.origin,
        query,
        locale
      )

      // Someone who chose "Use a different account" picks their Google account too.
      beginGoogleSignupMeasurement()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          ...(query.prompt === 'select_account'
            ? { queryParams: { prompt: 'select_account' } }
            : {}),
        },
      })
      if (error) throw error
      // The browser is on its way to Google, so the spinner stays until the page goes.
    } catch (error) {
      console.error('Error:', error)
      setGoogleIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>
          {t(
            affiliateLogin ? 'Affiliate sign in - Enconvo' : 'Log In - Enconvo'
          )}
        </title>
        <meta
          name="description"
          content={t(
            'you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain.'
          )}
        />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[320px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h2 className="text-center text-3xl font-medium tracking-tight text-white">
              {t(affiliateLogin ? 'Affiliate sign in' : 'Log in to Enconvo')}
            </h2>
            {affiliateLogin && (
              <p className="text-center text-sm leading-6 text-[#A7B0BC]">
                {t(
                  'Use the Enconvo account you applied with. Your Affiliate dashboard uses the same password.'
                )}
              </p>
            )}
          </div>

          {/* Google Login Button */}
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={signInWithGoogle}
              disabled={googleIsLoading}
              className="relative h-10 w-full rounded-xl border-[#333333] bg-[#242424] font-medium text-[#888888] shadow-sm transition-all duration-200 hover:bg-[#2C2C2C] hover:text-[#999999] hover:shadow"
            >
              {googleIsLoading ? (
                <ReloadIcon className="absolute left-3 h-5 w-5 animate-spin" />
              ) : (
                <svg
                  className="absolute left-3 h-5 w-5"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              {t('Continue with Google')}
            </Button>
          </div>

          {/* Email Login Form */}
          <form
            className="mt-6 space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (!emailIsLoading) void signIn()
            }}
          >
            <div className="space-y-4">
              {!continueLogin && (
                <div className="space-y-1">
                  <Input
                    type="email"
                    aria-label={t('Email address')}
                    placeholder={t('Email address')}
                    required
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    className="h-10 border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666]"
                  />
                </div>
              )}

              {!continueLogin && (
                <div className="space-y-1">
                  <Input
                    type="password"
                    aria-label={t('Password')}
                    placeholder={t('Password')}
                    required
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    className="h-10 border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666]"
                  />
                </div>
              )}

              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 text-red-700"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>{t('Error')}</AlertTitle>
                  <AlertDescription>{t(error)}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={emailIsLoading}
                className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {emailIsLoading && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {emailIsLoading ? t('Logging in...') : t('Log in')}
              </Button>
            </div>

            {!continueLogin && (
              <div className="flex items-center justify-between text-sm">
                <Link
                  href={authFlowHref('/register', router.query)}
                  className="font-medium text-[#888888] hover:text-[#999999]"
                >
                  {t('Create an account')}
                </Link>
                <Link
                  href={authFlowHref('/reset_password_send', router.query)}
                  className="font-medium text-[#666666] hover:text-[#888888]"
                >
                  {t('Forgot password?')}
                </Link>
              </div>
            )}
          </form>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/LoginForm')
