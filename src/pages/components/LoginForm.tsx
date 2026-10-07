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
import { authFlowHref, isCompanionFlow } from '@/lib/auth-flow'

export default function LoginForm({
  loginState,
  setLoginState,
  setUser,
  router,
}) {
  const pageRouter = useRouter()
  router = router ?? pageRouter
  const { t, locale } = useI18n()
  const companion = router.isReady && isCompanionFlow(router.query)

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
    console.log('session login :', data)

    setUser(data.user)

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Enconvo gets a session of its own; "Open Enconvo" on the next page tries again.
    const opened = await NativeRouter.openApp(
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

  async function signInWithGoogle() {
    if (!router.isReady || companion) return
    try {
      setGoogleIsLoading(true)
      let redirectUrl = `${window.location.origin}/auth/callback?language=${locale}`
      // The callback carries a local returnUrl on (a bare path isn't a valid OAuth redirect).
      const returnUrl = Array.isArray(router.query.returnUrl)
        ? router.query.returnUrl[0]
        : router.query.returnUrl
      if (returnUrl?.startsWith('/')) {
        redirectUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`
      }
      // Preserve from/source/handoff across the OAuth round-trip so the app can
      // return the user to where login started (e.g. the onboarding guide).
      const from = Array.isArray(router.query.from)
        ? router.query.from[0]
        : router.query.from
      const source = Array.isArray(router.query.source)
        ? router.query.source[0]
        : router.query.source
      const handoff = Array.isArray(router.query.handoff)
        ? router.query.handoff[0]
        : router.query.handoff
      const extra = new URLSearchParams()
      if (from) extra.set('from', from)
      if (source) extra.set('source', source)
      if (handoff) extra.set('handoff', handoff)
      const extraQs = extra.toString()
      if (extraQs)
        redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + extraQs

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGoogleIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{t('Log In - Enconvo')}</title>
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
              {t('Log in to Enconvo')}
            </h2>
          </div>

          {/* iPhone signs in exclusively with an Enconvo email/password account. */}
          {router.isReady && !companion && (
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={signInWithGoogle}
              disabled={googleIsLoading}
              className="relative h-10 w-full rounded-xl border-[#333333] bg-[#242424] font-medium text-[#888888] shadow-sm transition-all duration-200 hover:bg-[#2C2C2C] hover:text-[#999999] hover:shadow"
            >
              {googleIsLoading ? (
                <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
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

          )}
          {/* Email Login Form */}
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              {!continueLogin && (
                <div className="space-y-1">
                  <Input
                    type="email"
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
                    placeholder={t('Password')}
                    required
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
                onClick={signIn}
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
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/LoginForm')
