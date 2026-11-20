import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { CheckIcon, ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { Turnstile, type CaptchaHandle } from '@/components/Turnstile'
import { createClientComponentClient } from '@/lib/supabase'
import {
  RESEND_WAIT_SECONDS,
  resendCountdown,
  signupEmailRedirect,
} from '@/lib/email-signup'
import {
  authErrorMessage,
  captchaMessage,
  retryAfterSeconds,
  type AuthMessage,
} from '@/lib/auth-errors'
import { getEmailLink } from '@/utils/app/email_link'

/**
 * After an email sign-up: where the link went, a resend once Auth allows one, and a way back to
 * the form with the address kept.
 */
export default function RegisterSuccess({ email, onUseDifferentEmail }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const captcha = useRef<CaptchaHandle>(null)
  const [resendAt, setResendAt] = useState(
    () => Date.now() + RESEND_WAIT_SECONDS * 1000
  )
  const [now, setNow] = useState(() => Date.now())
  const [sending, setSending] = useState(false)
  const [sentAgain, setSentAgain] = useState(false)
  const [message, setMessage] = useState<AuthMessage | null>(null)
  // Empty for an address whose webmail isn't known, and while the page prerenders without one.
  const mailbox = email ? getEmailLink(email) : ''
  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const waiting = waitSeconds > 0

  // Ticks only while the wait runs; a resend starts it again.
  useEffect(() => {
    if (!waiting) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [waiting])

  async function resend() {
    setSending(true)
    setMessage(null)
    setSentAgain(false)
    let captchaToken: string | undefined
    try {
      captchaToken = await captcha.current?.token()
    } catch (captchaError) {
      setMessage(captchaMessage(captchaError))
      setSending(false)
      return
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: signupEmailRedirect(
          window.location.origin,
          router.query,
          locale
        ),
        ...(captchaToken ? { captchaToken } : {}),
      },
    })
    // The token works once.
    if (captchaToken) captcha.current?.reset()
    setSending(false)
    if (error) {
      // Auth counts its wait from the last email it sent: run the countdown for it instead.
      const wait = retryAfterSeconds(error)
      if (wait !== null) {
        setResendAt(Date.now() + wait * 1000)
        setNow(Date.now())
        return
      }
      setMessage(authErrorMessage(error) ?? { source: error.message })
      return
    }
    setSentAgain(true)
    setResendAt(Date.now() + RESEND_WAIT_SECONDS * 1000)
    setNow(Date.now())
  }

  return (
    <>
      <Head>
        <title>{t('Sign Up Success - Enconvo')}</title>
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A] py-12 [color-scheme:dark]">
        <div className="w-full max-w-[360px] px-4 text-center">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h1 className="text-3xl font-medium text-white">
              {t('Check your email')}
            </h1>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-[#888888]">
            <I18nText
              source={
                "We've sent a confirmation email to {p0}. Please check your inbox and confirm your email address to start using Enconvo."
              }
              values={{ p0: <span className="text-white">{email}</span> }}
            />
          </p>

          <div className="mt-8 space-y-3">
            {sentAgain && (
              <p
                role="status"
                className="flex items-center justify-center gap-1.5 text-[13px] leading-[18px] text-[#9AA59A]"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                {t('Sent again. Check your spam folder too.')}
              </p>
            )}
            {message && (
              <p role="alert" className="text-[13px] leading-[18px] text-red-400">
                {t(message.source, message.values)}
              </p>
            )}
            {mailbox && (
              <Button
                type="button"
                onClick={() => window.open(mailbox)}
                className="h-10 w-full rounded-[10px] bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-colors duration-200 hover:bg-[#D4D4D4]"
              >
                {t('Check Email')}
              </Button>
            )}
            <Turnstile ref={captcha} action="resend" />
            <Button
              type="button"
              variant="outline"
              onClick={resend}
              disabled={waiting || sending}
              className="h-10 w-full rounded-[10px] border-[#333333] bg-[#242424] font-medium text-[#D4D4D4] transition-colors duration-200 hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
            >
              {sending && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {waiting
                ? t('Resend in {p0}', { p0: resendCountdown(waitSeconds) })
                : t('Resend')}
            </Button>
          </div>

          <p className="mt-4 text-sm">
            <button
              type="button"
              onClick={onUseDifferentEmail}
              className="font-medium text-[#888888] hover:text-[#BBBBBB]"
            >
              {t('Use a different email')}
            </button>
          </p>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/RegisterSuccess')
