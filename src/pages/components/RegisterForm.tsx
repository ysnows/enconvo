import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import Link from 'next/link'

import {
  ReloadIcon,
  ArrowTopRightIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

import { Logo } from '@/components/Logo'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  saveRegistrationEmailPreference,
  syncCurrentEmailPreference,
} from '@/lib/email-preferences-client'

export default function RegisterForm({
  loginState,
  setLoginState,
  email,
  setEmail,
}) {
  const { t, locale } = useI18n()

  const supabase = createClientComponentClient()
  const router = useRouter()

  // const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [emailIsLoading, setEmailIsLoading] = React.useState(false)
  const [googleIsLoading, setGoogleIsLoading] = React.useState(false)
  const [productUpdatesSubscribed, setProductUpdatesSubscribed] =
    React.useState(true)

  async function signUp() {
    // check if email is valid
    if (!email || !email.includes('@')) {
      alert(t('Please enter a valid email'))
      return
    }

    setEmailIsLoading(true)

    const returnUrlParams = router?.query?.returnUrl
      ? `?returnUrl=${router.query.returnUrl}`
      : ''
    const returnUrl = Array.isArray(router.query.returnUrl)
      ? router.query.returnUrl[0]
      : router.query.returnUrl
    // Web offer and Affiliate signups must return to their page after email
    // confirmation rather than opening the native app.
    const emailRedirectTo =
      typeof returnUrl === 'string' &&
      /^\/(?:ltd|affiliate)(?:[?#/]|$)/.test(returnUrl)
        ? `${window.location.origin}/auth/callback?${new URLSearchParams({
            returnUrl,
            language: locale,
          })}`
        : `${
            window.location.origin
          }/login?from=app&language=${locale}${returnUrlParams.replace(
            '?',
            '&'
          )}`

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo,
        data: {
          name: name,
          product_updates_subscribed: productUpdatesSubscribed,
        },
      },
    })

    if (error) {
      setError(error.message)
      setEmailIsLoading(false)
      return
    }

    if (data.session) {
      try {
        await syncCurrentEmailPreference(data.session.access_token)
      } catch (syncError) {
        console.error(
          'Unable to sync registration email preference:',
          syncError
        )
      }
    }

    setLoginState('success')

    setEmailIsLoading(false)
    // setContinueLogin(true)
  }

  async function signInWithGoogle() {
    try {
      setGoogleIsLoading(true)
      saveRegistrationEmailPreference(productUpdatesSubscribed)
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('language', locale)
      if (router.query.returnUrl) {
        const returnUrl = Array.isArray(router.query.returnUrl)
          ? router.query.returnUrl[0]
          : router.query.returnUrl
        callbackUrl.searchParams.set('returnUrl', returnUrl)
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setGoogleIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{t('Sign Up - Enconvo')}</title>
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
              {t('Create your Enconvo account')}
            </h2>
          </div>

          {/* Google Sign Up Button */}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333333]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A1A] px-4 text-[#666666]">
                {t('Or continue with email')}
              </span>
            </div>
          </div>

          {/* Email Registration Form */}
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder={t('Username')}
                  required
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className="h-10 border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666]"
                />
              </div>

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

              <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-white/10 bg-white/[0.025] px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={productUpdatesSubscribed}
                  onChange={(event) =>
                    setProductUpdatesSubscribed(event.target.checked)
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-[#141A22] text-blue-600 focus:ring-1 focus:ring-blue-500/60 focus:ring-offset-0"
                />
                <span className="text-[12px] leading-4 text-[#777F8A]">
                  {t(
                    'Send me occasional product updates and release notes. You can unsubscribe anytime.'
                  )}
                </span>
              </label>

              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-900/30 bg-red-900/20 text-red-400"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>{t('Error')}</AlertTitle>
                  <AlertDescription>{t(error)}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={signUp}
                disabled={emailIsLoading}
                className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {emailIsLoading && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {emailIsLoading
                  ? t('Creating account...')
                  : t('Create account')}
              </Button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-center text-[#666666]">
                {t('Already have an account?')}{' '}
                <Link
                  href={`/login${
                    router?.query?.returnUrl
                      ? `?returnUrl=${encodeURIComponent(
                          Array.isArray(router.query.returnUrl)
                            ? router.query.returnUrl[0]
                            : router.query.returnUrl
                        )}`
                      : ''
                  }`}
                  className="font-medium text-[#888888] hover:text-[#999999]"
                >
                  {t('Log in')}
                </Link>
              </p>

              <p className="text-center text-xs text-[#666666]">
                {t('By continuing, you agree to our')}{' '}
                <Link
                  href="/terms"
                  className="text-[#888888] underline underline-offset-2 hover:text-[#999999]"
                >
                  {t('Terms of Service')}
                </Link>{' '}
                {t('and')}{' '}
                <Link
                  href="/privacy"
                  className="text-[#888888] underline underline-offset-2 hover:text-[#999999]"
                >
                  {t('Privacy Policy')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/RegisterForm')
