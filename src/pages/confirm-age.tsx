import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { getLocale } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import type { Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { I18nText } from '@/i18n/I18nText'
import {
  MINIMUM_AGE,
  ageConfirmationMetadata,
  needsAgeConfirmation,
} from '@/lib/age-gate'
import { authFlowHref } from '@/lib/auth-flow'
import { finishOAuthSignIn } from '@/lib/finish-oauth-sign-in'

const linkClass =
  'text-[#AAAAAA] underline underline-offset-2 hover:text-[#CCCCCC]'

type Status = 'loading' | 'asking' | 'saving' | 'leaving'

/**
 * The consent the sign-up and log-in pages carry (lib/age-gate), asked once for an account Apple
 * or Google just created when it couldn't be carried: browser storage blocked, or more than 15
 * minutes on the provider's page. Continue gives it and goes on like any other sign-in. Cancel
 * signs this browser out and leaves the account as it is, so a later sign-in asks again.
 */
export default function ConfirmAge() {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const locale = getLocale(
    typeof router.query.language === 'string'
      ? router.query.language
      : router.locale
  )
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session
      if (!current) {
        // Keeps where the sign-in was for (the app, a return page).
        void router.replace(authFlowHref('/login', router.query), undefined, {
          locale,
        })
        return
      }
      setSession(current)
      if (!needsAgeConfirmation(current.user)) {
        void finishOAuthSignIn(supabase, current, router, locale)
        return
      }
      setStatus('asking')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  async function submit() {
    if (!session) return
    setError('')
    setStatus('saving')
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: ageConfirmationMetadata(),
    })
    if (updateError) {
      setStatus('asking')
      setError('Something went wrong. Please try again.')
      return
    }
    const {
      data: { session: refreshed },
    } = await supabase.auth.getSession()
    await finishOAuthSignIn(
      supabase,
      refreshed ?? { ...session, user: data.user ?? session.user },
      router,
      locale
    )
  }

  async function cancel() {
    setStatus('leaving')
    // Only this browser; the account stays, and its next sign-in asks again.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
    await router.replace(authFlowHref('/login', router.query), undefined, {
      locale,
    })
  }

  return (
    <>
      <Head>
        <title>{t('Confirm your age - Enconvo')}</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A] [color-scheme:dark]">
        <div className="w-full max-w-[360px] px-4 text-center">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h1 className="text-3xl font-medium text-white">
              {t('One more step')}
            </h1>
          </div>

          {status === 'loading' ? (
            <div className="mt-8 flex justify-center">
              <ReloadIcon className="h-5 w-5 animate-spin text-[#888888]" />
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-[#888888]">
                <I18nText
                  source="To finish creating your account, confirm you’re at least {p0} and agree to our {p1} and {p2}."
                  values={{
                    p0: String(MINIMUM_AGE),
                    p1: (
                      <Link href="/terms" className={linkClass}>
                        {t('Terms of Service')}
                      </Link>
                    ),
                    p2: (
                      <Link href="/privacy" className={linkClass}>
                        {t('Privacy Policy')}
                      </Link>
                    ),
                  }}
                />
              </p>
              {error && (
                <p
                  role="alert"
                  className="mt-4 text-[13px] leading-[18px] text-red-400"
                >
                  {t(error)}
                </p>
              )}
              <Button
                onClick={submit}
                disabled={status !== 'asking'}
                className="mt-6 h-10 w-full rounded-[10px] bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-colors duration-200 hover:bg-[#D4D4D4] disabled:opacity-100"
              >
                {status === 'saving' && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('Continue')}
              </Button>
              <p className="mt-4 text-sm">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={status !== 'asking'}
                  className="font-medium text-[#888888] hover:text-[#BBBBBB]"
                >
                  {t('Cancel')}
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/confirm-age')
