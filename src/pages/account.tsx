import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { NativeRouter } from '@/utils/app/native_router'
import type { Session } from '@supabase/supabase-js'
import {
  getCurrentEmailPreference,
  updateCurrentEmailPreference,
} from '@/lib/email-preferences-client'
import InviteFriends from '@/components/InviteFriends'
import AccountPlan from '@/components/AccountPlan'

type EmailPreference = {
  product_updates_subscribed: boolean
  resend_sync_status: 'pending' | 'synced' | 'failed' | 'skipped'
}

export default function Account() {
  const { t } = useI18n()

  const router = useRouter()
  const [user, setUser] = useState(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [emailPreference, setEmailPreference] =
    useState<EmailPreference | null>(null)
  const [emailPreferenceLoading, setEmailPreferenceLoading] = useState(true)
  const [emailPreferenceSaving, setEmailPreferenceSaving] = useState(false)
  const [emailPreferenceMessage, setEmailPreferenceMessage] = useState('')

  // Check for success query parameter from Stripe redirect
  useEffect(() => {
    if (router.query.success === 'cloud_points') {
      setShowSuccessMessage(true)

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [router.query])

  const fetchEmailPreference = async (token: string) => {
    setEmailPreferenceLoading(true)
    try {
      const data = await getCurrentEmailPreference(token)
      setEmailPreference(data.preference)
    } catch (error) {
      console.error('Error fetching email preference:', error)
      setEmailPreferenceMessage('Email preference is temporarily unavailable.')
    } finally {
      setEmailPreferenceLoading(false)
    }
  }

  const handleEmailPreferenceChange = async (subscribed: boolean) => {
    if (!session) return

    const previousPreference = emailPreference
    setEmailPreferenceSaving(true)
    setEmailPreferenceMessage('')
    setEmailPreference((current) => ({
      product_updates_subscribed: subscribed,
      resend_sync_status: current?.resend_sync_status ?? 'pending',
    }))

    try {
      const data = await updateCurrentEmailPreference(
        session.access_token,
        subscribed
      )
      setEmailPreference(data.preference)
      setEmailPreferenceMessage(
        data.syncResult?.status === 'failed' ||
          data.syncResult?.status === 'skipped'
          ? 'Saved. Delivery service sync will be retried.'
          : 'Preference saved.'
      )
    } catch (error) {
      console.error('Error updating email preference:', error)
      setEmailPreference(previousPreference)
      setEmailPreferenceMessage(
        'Could not save this preference. Please try again.'
      )
    } finally {
      setEmailPreferenceSaving(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/login')
        return
      }
      console.log(session.user)
      setUser(session.user)
      void fetchEmailPreference(session.access_token)
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    // Only this browser: Enconvo and other devices stay signed in.
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/')
  }

  const handleOpenApp = async () => {
    const result = await NativeRouter.openApp()
    if (result === 'signed_out') router.push('/login?from=app')
    else if (result !== 'opened') alert(result.error)
  }

  if (loading) {
    return <div>{t('Loading...')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-end">
          <button
            onClick={handleOpenApp}
            className="flex items-center space-x-2 rounded-md bg-gray-800 px-4 py-2 text-gray-300 transition-all duration-200 hover:bg-gray-700 hover:text-white"
          >
            {/* Icon for opening app - external link symbol */}
            {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg> */}
            <span>{t('Open Enconvo')}</span>
          </button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 rounded-md bg-gray-800 px-4 py-2 text-gray-300 transition-all duration-200 hover:bg-gray-700 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t('Log Out')}</span>
          </button>
        </div>

        {/* Success notification */}
        {showSuccessMessage && (
          <div className="mt-4 flex items-center justify-between rounded-md bg-green-800 p-4 text-white">
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                {t(
                  'Cloud Points purchased successfully! Your points have been added to your account.'
                )}
              </span>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-white hover:text-gray-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="mt-8">
          <h1 className="mb-8 text-2xl font-bold">{t('Account')}</h1>

          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16">
                <Image
                  src={
                    user?.user_metadata?.avatar_url ||
                    'https://file.enconvo.com/circle_logo.png'
                  }
                  alt={t('Profile')}
                  fill
                  className="rounded-full bg-gray-800 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.onerror = null
                    target.src = 'https://file.enconvo.com/circle_logo.png'
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user?.user_metadata?.name || t('User')}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-xl font-semibold">
                  {t('Account Details')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400">
                      {t('Email')}
                    </label>
                    <div className="mt-1 rounded-md bg-gray-800 p-3">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">
                      {t('Email updates')}
                    </label>
                    <label className="mt-1 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                      <input
                        type="checkbox"
                        checked={
                          emailPreference?.product_updates_subscribed ?? true
                        }
                        disabled={
                          emailPreferenceLoading || emailPreferenceSaving
                        }
                        onChange={(event) =>
                          void handleEmailPreferenceChange(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-gray-900 text-blue-500 focus:ring-1 focus:ring-blue-500/60 focus:ring-offset-0 disabled:opacity-50"
                      />
                      <span>
                        <span className="block text-sm text-gray-200">
                          {t('Product updates and release notes')}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                          {t(
                            'Occasional Enconvo news. You can unsubscribe at any time.'
                          )}
                        </span>
                      </span>
                    </label>
                    {emailPreferenceMessage && (
                      <p
                        className={`mt-2 text-xs ${
                          emailPreferenceMessage.includes('Could not') ||
                          emailPreferenceMessage.includes('unavailable')
                            ? 'text-red-400'
                            : 'text-gray-500'
                        }`}
                        role="status"
                      >
                        {t(emailPreferenceMessage)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {session && <AccountPlan accessToken={session.access_token} />}

              {session && <InviteFriends accessToken={session.access_token} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps = i18nStaticProps('/account')
