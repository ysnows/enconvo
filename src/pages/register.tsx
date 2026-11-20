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
import { purchaseReturn } from '@/lib/auth-flow'
import { ResumeCheckout, useResumeCheckout } from '@/components/ResumeCheckout'

export default function Register() {
  const { locale } = useI18n()
  // 获取url参数

  const router = useRouter()

  // 'register' (the form), 'sent' (the confirmation email went out) or 'signed_in' (a session exists).
  const [registerState, setRegisterState] = useState('register')
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const sessionChecked = useRef(false)
  // Sent here by Pricing to buy a plan: signed in, the buyer goes on to its checkout.
  const purchase =
    router.query.from === 'app' ? null : purchaseReturn(router.query)
  const checkout = useResumeCheckout(
    purchase,
    registerState === 'signed_in',
    locale
  )

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
          if (purchaseReturn(router.query)) {
            // Goes on to checkout from the signed-in state (useResumeCheckout).
            setUser(session?.user ?? null)
            setRegisterState('signed_in')
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
      ) : registerState === 'signed_in' && purchase ? (
        <ResumeCheckout state={checkout.state} onContinue={checkout.retry} />
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
