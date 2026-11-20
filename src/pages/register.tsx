import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { NativeRouter } from '@/utils/app/native_router'
import RegisterForm from '@/pages/components/RegisterForm'
import RegisterSuccess from '@/pages/components/RegisterSuccess'
import LoginSuccess from '@/pages/components/LoginSuccess'
import type { AuthChangeEvent, User } from '@supabase/supabase-js'

export default function Register() {
  const { locale } = useI18n()
  // 获取url参数

  const router = useRouter()

  // 'register' (the form), 'sent' (the confirmation email went out) or 'signed_in' (a session exists).
  const [registerState, setRegisterState] = useState('register')
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const sessionChecked = useRef(false)

  const supabase = createClientComponentClient()

  const handleOpenApp = async () => {
    const handoff = Array.isArray(router.query.handoff)
      ? router.query.handoff[0]
      : router.query.handoff
    const source = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source
    const result = await NativeRouter.openApp(source, handoff)
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
          if (router.query.from === 'app' && router.query.source === 'companion') {
            setUser(session?.user ?? null)
            setRegisterState('signed_in')
            await handleOpenApp()
            return
          }
          const returnUrl = Array.isArray(router.query.returnUrl)
            ? router.query.returnUrl[0]
            : router.query.returnUrl || '/'
          if (
            typeof returnUrl === 'string' &&
            returnUrl.startsWith('/pricing?plan=')
          ) {
            // 如果是从定价页面跳转来的，解析出 plan 参数并触发支付
            // `code=own`: the buyer chose "Use another code instead" (Pricing.tsx).
            const query = new URLSearchParams(returnUrl.split('?')[1])
            const plan = query.get('plan')
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
                  ...(query.get('code') === 'own' ? { ownCode: true } : {}),
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
    // Static page: `from` and `handoff` are only in the query once the router is ready.
    if (!router.isReady || sessionChecked.current) return
    sessionChecked.current = true
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (data.session) {
        setUser(data.session.user)
        setRegisterState('signed_in')
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
  }, [router.isReady])

  return (
    <>
      {registerState === 'sent' ? (
        <RegisterSuccess
          email={email}
          onUseDifferentEmail={() => setRegisterState('register')}
        />
      ) : registerState === 'signed_in' ? (
        <LoginSuccess
          handleOpenApp={handleOpenApp}
          user={user}
          fromApp={router.query.from === 'app'}
        />
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
