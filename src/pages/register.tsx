import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NativeRouter } from '@/utils/app/native_router'
import RegisterForm from '@/pages/components/RegisterForm'
import RegisterSuccess from '@/pages/components/RegisterSuccess'
import type { AuthChangeEvent } from '@supabase/supabase-js'

export default function Register() {
  const { locale } = useI18n()
  // 获取url参数

  const router = useRouter()

  const [registerState, setRegisterState] = useState('register')
  const [email, setEmail] = useState('')

  const supabase = createClientComponentClient()

  const handleOpenApp = async () => {
    const handoff = Array.isArray(router.query.handoff)
      ? router.query.handoff[0]
      : router.query.handoff
    const result = await NativeRouter.openApp(undefined, handoff)
    // The browser's session ended elsewhere: show the form again.
    if (result === 'signed_out') setRegisterState('register')
    else if (result !== 'opened') alert(result.error)
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === ('SIGNED_UP' as AuthChangeEvent) ||
          event === ('SIGNED_IN' as AuthChangeEvent)
        ) {
          const returnUrl = Array.isArray(router.query.returnUrl)
            ? router.query.returnUrl[0]
            : router.query.returnUrl || '/'
          if (
            typeof returnUrl === 'string' &&
            returnUrl.startsWith('/pricing?plan=')
          ) {
            // 如果是从定价页面跳转来的，解析出 plan 参数并触发支付
            console.log('window.endorsely_referral', window.endorsely_referral)
            const plan = returnUrl.split('plan=')[1]
            const response = await fetch(
              '/api/subscription/checkout_sessions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  lookupKey: plan,
                  locale,
                  endorsely_referral: window.endorsely_referral,
                }),
              }
            )

            if (response.status === 200) {
              const data = await response.json()
              window.location.href = data.url
            }
          } else {
            router.push(returnUrl)
          }
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (data.session) {
        console.log('session', data)
        setRegisterState('success')
        if (router.query['from'] === 'app') {
          // Only a session the auth service still has goes to the app.
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) handleOpenApp()
          else setRegisterState('register')
        }
      }
    })
  }, [])

  return (
    <>
      {registerState === 'success' ? (
        <RegisterSuccess email={email} />
      ) : (
        <RegisterForm
          setLoginState={setRegisterState}
          loginState={registerState}
          email={email}
          setEmail={setEmail}
        />
      )}
    </>
  )
}

export const getStaticProps = i18nStaticProps('/register')
