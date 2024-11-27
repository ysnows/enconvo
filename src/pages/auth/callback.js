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
                await router.push('/login')
            }
        }

        handleAuthCallback()
    }, [])

    return null
}
