import type { NextRouter } from 'next/router'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { recordGoogleSignup } from '@/lib/signup-analytics'
import {
  consumeRegistrationEmailPreference,
  syncCurrentEmailPreference,
  updateCurrentEmailPreference,
} from '@/lib/email-preferences-client'

/**
 * The end of a Google sign-in, once the account has passed the sign-up age check: the sign-up
 * is measured, the email choice made on /register is saved, and the browser goes where the
 * sign-in was for. Used by `/auth/callback` and, for an account it sent to be asked its age,
 * by `/confirm-age`, both with the callback's query.
 */
export async function finishOAuthSignIn(
  supabase: SupabaseClient,
  session: Session,
  router: NextRouter,
  locale: string
) {
  recordGoogleSignup(session.user)
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
