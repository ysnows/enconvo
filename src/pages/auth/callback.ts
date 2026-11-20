import { i18nStaticProps } from '@/i18n/server'
import { getLocale } from '@/i18n/locale'
import { createClientComponentClient } from '@/lib/supabase'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  ageConfirmationMetadata,
  consumeRegistrationAgeConfirmation,
  needsAgeConfirmation,
} from '@/lib/age-gate'
import { finishOAuthSignIn } from '@/lib/finish-oauth-sign-in'

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
        // The sign-up age check (lib/age-gate). The consent line on /register and /login
        // answered it before Google; when that answer didn't carry over (storage blocked, or
        // over 15 minutes on Google's page), a new account is asked on /confirm-age.
        const answeredOnRegister = consumeRegistrationAgeConfirmation()
        if (needsAgeConfirmation(session.user)) {
          const { error: updateError } = answeredOnRegister
            ? await supabase.auth.updateUser({
                data: ageConfirmationMetadata(),
              })
            : { error: true }
          if (updateError) {
            // The OAuth code is spent; /confirm-age keeps only where the sign-in was for.
            const query = { ...router.query }
            for (const key of ['code', 'error', 'error_description'])
              delete query[key]
            await router.push({ pathname: '/confirm-age', query }, undefined, {
              locale,
            })
            return
          }
        }
        await finishOAuthSignIn(supabase, session, router, locale)
      }
    }

    handleAuthCallback()
  }, [router.isReady])

  return null
}

export const getStaticProps = i18nStaticProps('/auth/callback')
