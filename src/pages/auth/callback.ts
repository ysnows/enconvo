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

    useEffect(() => {
        if (!router.isReady) return

        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                console.error('Error:', error.message)
                await router.push('/login?error=auth')
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
                            registrationPreference,
                        )
                    } else {
                        await syncCurrentEmailPreference(session.access_token)
                    }
                } catch (preferenceError) {
                    console.error('Unable to sync email preferences:', preferenceError)
                }

                // Carry from/source back to /login so an OAuth login started from the
                // app (e.g. the onboarding guide) still hands off with its source.
                const from = Array.isArray(router.query.from) ? router.query.from[0] : router.query.from
                const source = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source
                const returnUrl = Array.isArray(router.query.returnUrl)
                    ? router.query.returnUrl[0]
                    : router.query.returnUrl
                const params = new URLSearchParams()
                if (from) params.set('from', from)
                if (source) params.set('source', source)
                if (returnUrl?.startsWith('/')) params.set('returnUrl', returnUrl)
                const qs = params.toString()
                await router.push(qs ? `/login?${qs}` : '/login')
            }
        }

        handleAuthCallback()
    }, [router.isReady])

    return null
}
