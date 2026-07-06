import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthCallback() {
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                console.error('Error:', error.message)
                await router.push('/login?error=auth')
            }
            if (session) {
                // Carry from/source back to /login so an OAuth login started from the
                // app (e.g. the onboarding guide) still hands off with its source.
                const from = Array.isArray(router.query.from) ? router.query.from[0] : router.query.from
                const source = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source
                const params = new URLSearchParams()
                if (from) params.set('from', from)
                if (source) params.set('source', source)
                const qs = params.toString()
                await router.push(qs ? `/login?${qs}` : '/login')
            }
        }

        handleAuthCallback()
    }, [])

    return null
}
