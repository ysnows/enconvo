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
import { createClientComponentClient } from '@/lib/supabase'
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
import { appleStartUrl, saveAppleSignInContext } from '@/lib/apple-sign-in'
import { hasConsent } from '@/lib/cookie-consent'
import {
  passwordSignInMessage,
  signInWithPassword,
} from '@/lib/password-sign-in'

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
  const [appleIsLoading, setAppleIsLoading] = React.useState(false)

  async function signIn() {
    // check if email is valid
    if (!email || !email.includes('@')) {
      alert(t('Please enter a valid email'))
      return
    }

    setEmailIsLoading(true)
    setError('')
    // The Worker's sign-in, which also takes an account's linked email; its tokens become this
    // browser's session (lib/password-sign-in).
    const result = await signInWithPassword(
      supabase,
      email,
      password,
      hasConsent('analytics')
    )

    if (!result.ok) {
      if (result.problem) {
        const { source, values } = passwordSignInMessage(result.problem)
        setError(t(source, values))
      } else {
        setError(t(result.message))
      }
      setEmailIsLoading(false)
      return
    }

    setUser(result.user)

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
      await syncCurrentEmailPreference(result.session.access_token)
    } catch (syncError) {
      console.error('Unable to sync email preferences:', syncError)
    }

    setLoginState('success')

    setEmailIsLoading(false)
    // setContinueLogin(true)
  }

  // Back from Google's or Apple's page, the browser can show this page as it was left.
  React.useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setGoogleIsLoading(false)
      setAppleIsLoading(false)
    }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  // The Worker runs Apple's sign-in and returns to /login/apple with only a handoff code, so
  // this page's query (the app to open, the page to return to) and language wait in the tab.
  function signInWithApple() {
    setAppleIsLoading(true)
    saveAppleSignInContext(window.location.search, locale)
    window.location.assign(appleStartUrl())
  }

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

          {/* Apple above Google, each in its brand's dark-background style: Apple's white button
              with the Apple logo, Google's dark fill and outline with the four-colour G. */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={signInWithApple}
              disabled={appleIsLoading}
              className="relative h-10 w-full rounded-xl bg-white text-[17px] font-medium leading-5 text-black transition-colors duration-200 hover:bg-[#F2F2F2]"
            >
              {appleIsLoading ? (
                <ReloadIcon className="absolute left-3 h-5 w-5 animate-spin" />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute left-3 grid h-5 w-5 place-items-center"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 240 240"
                    focusable="false"
                    className="shrink-0"
                  >
                    <path
                      fill="currentColor"
                      transform="translate(0 240) scale(0.1 -0.1)"
                      d="M1448 1956c-141-51-245-183-236-300 3-40 4-41 38-38 128 11 257 155 263 293 2 61-6 66-65 45zM1431 1593c-14-3-60-18-104-34-99-36-123-36-228 2-73 27-94 30-159 27-96-6-172-42-241-114-92-99-125-203-116-379 9-186 79-372 199-529 106-137 173-160 316-107 101 37 168 40 250 10 98-37 145-44 192-30 81 24 187 148 260 304 22 47 40 87 40 90 0 3-19 16-42 30-153 90-208 283-127 442 11 22 43 63 71 91 56 58 56 70-4 116-90 69-207 99-307 81z"
                    />
                  </svg>
                </span>
              )}
              {t('Continue with Apple')}
            </Button>
            <Button
              variant="outline"
              onClick={signInWithGoogle}
              disabled={googleIsLoading}
              className="relative h-10 w-full rounded-xl border-[#8E918F] bg-[#131314] font-medium text-[#E3E3E3] transition-colors duration-200 hover:bg-[#1F1F20] hover:text-[#E3E3E3]"
            >
              {googleIsLoading ? (
                <ReloadIcon className="absolute left-3 h-5 w-5 animate-spin" />
              ) : (
                <svg
                  className="absolute left-3 h-5 w-5"
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
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
                  <AlertDescription>{error}</AlertDescription>
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
