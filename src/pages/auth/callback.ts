import { i18nStaticProps } from '@/i18n/server'
import { getLocale } from '@/i18n/locale'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  consumeRegistrationEmailPreference,
  syncCurrentEmailPreference,
  updateCurrentEmailPreference,
} from '@/lib/email-preferences-client'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const locale = getLocale(
    typeof router.query.language === 'string'
      ? router.query.language
      : router.locale
  )

  useEffect(() => {
    if (!router.isReady) return

    const handleAuthCallback = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error('Error:', error.message)
        await router.push('/login?error=auth', undefined, { locale })
      }
      if (session) {
        const registrationPreference = consumeRegistrationEmailPreference()

        try {
          if (registrationPreference !== null) {
            await supabase.auth.updateUser({
              data: { product_updates_subscribed: registrationPreference },
            })
            await updateCurrentEmailPreference(
              session.access_token,
              registrationPreference
            )
          } else {
            await syncCurrentEmailPreference(session.access_token)
          }
        } catch (preferenceError) {
          console.error('Unable to sync email preferences:', preferenceError)
        }

        // Carry from/source/handoff back to /login so an OAuth login started from
        // the app (e.g. the onboarding guide) still hands off with its source.
        const from = Array.isArray(router.query.from)
          ? router.query.from[0]
          : router.query.from
        const source = Array.isArray(router.query.source)
          ? router.query.source[0]
          : router.query.source
        const handoff = Array.isArray(router.query.handoff)
          ? router.query.handoff[0]
          : router.query.handoff
        const returnUrl = Array.isArray(router.query.returnUrl)
          ? router.query.returnUrl[0]
          : router.query.returnUrl
        // A page that sent the user to sign in (e.g. /redeem/<code>) gets them back
        // directly; /login only fires SIGNED_IN for a sign-in made on that page.
        if (
          !from &&
          returnUrl?.startsWith('/') &&
          returnUrl !== '/' &&
          !returnUrl.startsWith('//') &&
          !returnUrl.startsWith('/pricing?plan=')
        ) {
          await router.push(returnUrl, undefined, { locale })
          return
        }
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (source) params.set('source', source)
        if (handoff) params.set('handoff', handoff)
        if (returnUrl?.startsWith('/')) params.set('returnUrl', returnUrl)
        const qs = params.toString()
        await router.push(qs ? `/login?${qs}` : '/login', undefined, { locale })
      }
    }

    handleAuthCallback()
  }, [router.isReady])

  return null
}

export const getStaticProps = i18nStaticProps('/auth/callback')
