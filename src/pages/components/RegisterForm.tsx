import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useState } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/Logo'
import { AuthConsent } from '@/components/AuthConsent'
import { Turnstile, type CaptchaHandle } from '@/components/Turnstile'
import { authFlowHref, oauthCallbackUrl } from '@/lib/auth-flow'
import { signupEmailRedirect } from '@/lib/email-signup'
import {
  beginGoogleSignupMeasurement,
  recordWebsiteSignup,
} from '@/lib/signup-analytics'
import { createClientComponentClient } from '@/lib/supabase'
import {
  saveRegistrationEmailPreference,
  syncCurrentEmailPreference,
} from '@/lib/email-preferences-client'
import {
  ageConfirmationMetadata,
  saveRegistrationAgeConfirmation,
} from '@/lib/age-gate'
import { appleStartUrl, saveAppleSignInContext } from '@/lib/apple-sign-in'
import {
  EMAIL_TAKEN,
  INVALID_EMAIL,
  MIN_PASSWORD_LENGTH,
  authErrorMessage,
  authMessageField,
  captchaMessage,
  passwordTooShort,
  type AuthMessage,
} from '@/lib/auth-errors'

// Something before and after one @; the auth service checks the rest.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/

const inputClass =
  'h-10 rounded-[10px] border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666] focus-visible:border-[#555555] focus-visible:ring-1 focus-visible:ring-[#555555]'
const inputErrorClass = 'border-red-400/60 focus-visible:border-red-400/60'
const helpClass = 'mt-1.5 text-[12px] leading-4'

/**
 * Email sign-up: Apple and Google, then email and password. The consent line under the button
 * carries the age the Terms set (lib/age-gate). Each problem shows under the field it belongs to.
 */
export default function RegisterForm({
  loginState,
  setLoginState,
  email,
  setEmail,
}) {
  const { t, locale } = useI18n()
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Product email needs an opt-in the visitor gives, so the box starts unchecked.
  const [productUpdatesSubscribed, setProductUpdatesSubscribed] =
    useState(false)
  const [emailMessage, setEmailMessage] = useState<AuthMessage | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<AuthMessage | null>(
    null
  )
  // A problem with the whole form (the security check, a rate limit): a readable message, or Auth's text.
  const [formMessage, setFormMessage] = useState<AuthMessage | null>(null)
  const [emailIsLoading, setEmailIsLoading] = useState(false)
  const [googleIsLoading, setGoogleIsLoading] = useState(false)
  const [appleIsLoading, setAppleIsLoading] = useState(false)
  const captcha = React.useRef<CaptchaHandle>(null)
  const emailInput = React.useRef<HTMLInputElement>(null)
  const passwordInput = React.useRef<HTMLInputElement>(null)

  // A problem with a field puts the caret back in it, so the keyboard and screen readers land there.
  function show(message: AuthMessage) {
    const field = authMessageField(message)
    if (field === 'email') {
      setEmailMessage(message)
      emailInput.current?.focus()
    } else if (field === 'password') {
      setPasswordMessage(message)
      passwordInput.current?.focus()
    } else setFormMessage(message)
  }

  async function signUp() {
    const address = email.trim()
    setEmailMessage(null)
    setPasswordMessage(null)
    setFormMessage(null)
    const badEmail = !EMAIL_SHAPE.test(address)
    const shortPassword = password.length < MIN_PASSWORD_LENGTH
    if (badEmail) setEmailMessage({ source: INVALID_EMAIL })
    if (shortPassword) setPasswordMessage(passwordTooShort())
    if (badEmail) emailInput.current?.focus()
    else if (shortPassword) passwordInput.current?.focus()
    if (badEmail || shortPassword) return
    // Password managers offer to save only what was submitted from a password field.
    setShowPassword(false)

    setEmailIsLoading(true)
    let captchaToken: string | undefined
    try {
      captchaToken = await captcha.current?.token()
    } catch (captchaError) {
      setFormMessage(captchaMessage(captchaError))
      setEmailIsLoading(false)
      return
    }

    const signupStartedAt = Date.now()
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      options: {
        emailRedirectTo: signupEmailRedirect(
          window.location.origin,
          router.query,
          locale
        ),
        ...(captchaToken ? { captchaToken } : {}),
        data: {
          product_updates_subscribed: productUpdatesSubscribed,
          ...ageConfirmationMetadata(),
        },
      },
    })
    // The token works once.
    if (captchaToken) captcha.current?.reset()
    setEmailIsLoading(false)

    if (error) {
      show(authErrorMessage(error) ?? { source: error.message })
      return
    }
    // An address that already has an account: Auth answers without identities and sends nothing.
    if (data.user && data.user.identities?.length === 0) {
      show({ source: EMAIL_TAKEN })
      return
    }

    recordWebsiteSignup(data.user, 'email', signupStartedAt)
    if (data.session) {
      try {
        await syncCurrentEmailPreference(data.session.access_token)
      } catch (syncError) {
        console.error('Unable to sync registration email preference:', syncError)
      }
    }
    if (address !== email) setEmail(address)
    setLoginState('sent')
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

  /** What both providers carry to their callback: the consent line and the product email choice. */
  function carryChoices() {
    saveRegistrationAgeConfirmation()
    saveRegistrationEmailPreference(productUpdatesSubscribed)
  }

  // The Worker runs Apple's sign-in and returns to /login/apple, which finishes it as for /login.
  function signInWithApple() {
    setAppleIsLoading(true)
    carryChoices()
    saveAppleSignInContext(window.location.search, locale)
    window.location.assign(appleStartUrl())
  }

  async function signInWithGoogle() {
    setGoogleIsLoading(true)
    try {
      carryChoices()
      beginGoogleSignupMeasurement()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Keeps from/source/handoff, so an app sign-up opens the app afterwards.
          // The address bar, not router.query: that stays empty until the router is ready.
          redirectTo: oauthCallbackUrl(
            window.location.origin,
            Object.fromEntries(new URLSearchParams(window.location.search)),
            locale
          ),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
      // The browser is on its way to Google, so the spinner stays until the page goes.
    } catch (error) {
      setFormMessage({ source: error.message })
      setGoogleIsLoading(false)
    }
  }

  const passwordHint = passwordMessage ?? passwordTooShort()

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

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A] py-12 [color-scheme:dark]">
        <div className="w-full max-w-[360px] px-4">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h1 className="text-center text-3xl font-medium text-white">
              {t('Create your account')}
            </h1>
          </div>

          {/* Apple above Google, as on the log-in page (ADR 0216). */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              onClick={signInWithApple}
              disabled={appleIsLoading}
              className="relative h-10 w-full rounded-[10px] bg-white text-[17px] font-medium leading-5 text-black transition-colors duration-200 hover:bg-[#F2F2F2]"
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
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
              disabled={googleIsLoading}
              className="relative h-10 w-full rounded-[10px] border-[#8E918F] bg-[#131314] font-medium text-[#E3E3E3] transition-colors duration-200 hover:bg-[#1F1F20] hover:text-[#E3E3E3]"
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

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333333]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A1A] px-4 text-[#666666]">
                {t('Or continue with email')}
              </span>
            </div>
          </div>

          <form
            noValidate
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (!emailIsLoading) void signUp()
            }}
          >
            <div>
              <Input
                ref={emailInput}
                id="signup-email"
                type="email"
                aria-label={t('Email address')}
                placeholder={t('Email address')}
                autoComplete="email"
                aria-invalid={!!emailMessage}
                aria-describedby={emailMessage ? 'signup-email-help' : undefined}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailMessage(null)
                }}
                value={email}
                className={`${inputClass} ${emailMessage ? inputErrorClass : ''}`}
              />
              {emailMessage && (
                <p
                  id="signup-email-help"
                  role="alert"
                  className={`${helpClass} text-red-400`}
                >
                  {t(emailMessage.source, emailMessage.values)}
                </p>
              )}
              {emailMessage?.source === EMAIL_TAKEN && (
                <p className="mt-1 flex items-center gap-2 text-[12px] leading-4 text-[#666666]">
                  <Link
                    href={authFlowHref('/login', router.query)}
                    className="font-medium text-[#BBBBBB] hover:text-white"
                  >
                    {t('Log in')}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href={authFlowHref('/reset_password_send', router.query)}
                    className="font-medium text-[#BBBBBB] hover:text-white"
                  >
                    {t('Forgot password?')}
                  </Link>
                </p>
              )}
            </div>

            <div className="mt-4">
              <div className="relative">
                <Input
                  ref={passwordInput}
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  aria-label={t('Password')}
                  placeholder={t('Password')}
                  autoComplete="new-password"
                  aria-invalid={!!passwordMessage}
                  aria-describedby="signup-password-help"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setPasswordMessage(null)
                  }}
                  value={password}
                  // Edge draws its own reveal button in password fields; this one has the toggle beside it.
                  className={`${inputClass} pr-10 [&::-ms-reveal]:hidden ${passwordMessage ? inputErrorClass : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={t(showPassword ? 'Hide password' : 'Show password')}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-[8px] text-[#8A8A8A] transition-colors hover:text-[#CCCCCC] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#555555]"
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
              <p
                id="signup-password-help"
                role={passwordMessage ? 'alert' : undefined}
                className={`${helpClass} ${passwordMessage ? 'text-red-400' : 'text-[#666666]'}`}
              >
                {t(passwordHint.source, passwordHint.values)}
              </p>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2 text-left">
              <input
                type="checkbox"
                checked={productUpdatesSubscribed}
                onChange={(event) =>
                  setProductUpdatesSubscribed(event.target.checked)
                }
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-[#141A22] text-blue-600 focus:ring-1 focus:ring-blue-500/60 focus:ring-offset-0"
              />
              <span className="text-[12px] leading-4 text-[#777F8A]">
                {t(
                  'Send me occasional product updates and release notes. You can unsubscribe anytime.'
                )}
              </span>
            </label>

            <Turnstile ref={captcha} action="signup" className="mt-4" />

            {formMessage && (
              <p role="alert" className="mt-4 text-[13px] leading-[18px] text-red-400">
                {t(formMessage.source, formMessage.values)}
              </p>
            )}

            <Button
              type="submit"
              disabled={emailIsLoading}
              className="mt-4 h-10 w-full rounded-[10px] bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-colors duration-200 hover:bg-[#D4D4D4] disabled:opacity-100"
            >
              {emailIsLoading && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {emailIsLoading ? t('Creating account...') : t('Create account')}
            </Button>
          </form>

          <AuthConsent className="mt-4" />

          <p className="mt-8 text-center text-sm text-[#666666]">
            {t('Already have an account?')}{' '}
            <Link
              href={authFlowHref('/login', router.query)}
              className="font-medium text-[#888888] hover:text-[#999999]"
            >
              {t('Log in')}
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/RegisterForm')
