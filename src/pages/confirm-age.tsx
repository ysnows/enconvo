import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { getLocale } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import type { Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { BirthMonthField, birthMonthFrom } from '@/components/BirthMonthField'
import {
  MINIMUM_AGE,
  ageCheckFailedRecently,
  ageConfirmationMetadata,
  markAgeCheckFailed,
  meetsMinimumAge,
  needsAgeConfirmation,
} from '@/lib/age-gate'
import { finishOAuthSignIn } from '@/lib/finish-oauth-sign-in'

const SUPPORT_EMAIL = 'support@enconvo.com'

type Status =
  | 'loading'
  | 'asking'
  | 'saving'
  | 'refusing'
  | 'deleted'
  | 'failed'

/**
 * The sign-up age check for an account Google just created from /login (lib/age-gate). The
 * OAuth callback sends it here with its query. An account that passes goes on like any other
 * sign-in. One that doesn't is deleted at once and signed out of this browser.
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
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  async function refuse(current: Session) {
    markAgeCheckFailed()
    setStatus('refusing')
    const response = await fetch('/api/account/underage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${current.access_token}` },
    }).catch(() => null)
    await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
    setStatus(response?.ok ? 'deleted' : 'failed')
  }

  useEffect(() => {
    if (!router.isReady) return
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session
      if (!current) {
        void router.replace('/login', undefined, { locale })
        return
      }
      setSession(current)
      if (!needsAgeConfirmation(current.user)) {
        void finishOAuthSignIn(supabase, current, router, locale)
        return
      }
      if (ageCheckFailedRecently()) {
        void refuse(current)
        return
      }
      setStatus('asking')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  async function submit() {
    const birth = birthMonthFrom(month, year)
    if (!birth) {
      setError('Please enter your date of birth.')
      return
    }
    if (!session) return
    if (!meetsMinimumAge(birth)) {
      await refuse(session)
      return
    }
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

  const refused =
    status === 'refusing' || status === 'deleted' || status === 'failed'

  return (
    <>
      <Head>
        <title>{t('Confirm your age - Enconvo')}</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[320px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h2 className="text-center text-3xl font-medium tracking-tight text-white">
              {refused
                ? t('You can’t create an Enconvo account')
                : t('One more step')}
            </h2>
          </div>

          {refused ? (
            <div
              role="alert"
              className="space-y-2 rounded-[10px] border border-white/10 bg-white/[0.025] px-4 py-4 text-center text-[13px] leading-[18px] text-[#888888]"
            >
              <p>
                {t(
                  'Enconvo accounts are for people who are at least {p0} years old.',
                  { p0: MINIMUM_AGE }
                )}
              </p>
              {status === 'refusing' && (
                <p className="flex items-center justify-center gap-2">
                  <ReloadIcon className="h-4 w-4 animate-spin" />
                  {t('Deleting the account…')}
                </p>
              )}
              {status === 'deleted' && (
                <p>{t('We deleted the account that was just created.')}</p>
              )}
              {status === 'failed' && (
                <p>
                  {t(
                    'We couldn’t finish deleting the account that was just created. Email {p0} and we will delete it.',
                    { p0: SUPPORT_EMAIL }
                  )}
                </p>
              )}
            </div>
          ) : status === 'loading' ? (
            <div className="flex justify-center">
              <ReloadIcon className="h-5 w-5 animate-spin text-[#888888]" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-[#888888]">
                {t(
                  'Confirm your date of birth to finish creating your Enconvo account.'
                )}
              </p>
              <BirthMonthField
                month={month}
                year={year}
                onChange={(nextMonth, nextYear) => {
                  setMonth(nextMonth)
                  setYear(nextYear)
                  setError('')
                }}
              />
              {error && (
                <p role="alert" className="text-[12px] leading-4 text-red-400">
                  {t(error)}
                </p>
              )}
              <Button
                onClick={submit}
                disabled={status === 'saving'}
                className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {status === 'saving' && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('Continue')}
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/confirm-age')
