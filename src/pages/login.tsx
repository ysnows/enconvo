import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import LoginForm from './components/LoginForm'
import LoginSuccess from '@/pages/components/LoginSuccess'
import { NativeRouter } from '@/utils/app/native_router'

export default function Login() {
  const { t, locale } = useI18n()

  // 获取url参数

  const router = useRouter()

  const [loginState, setLoginState] = useState('login')
  const [user, setUser] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [navigation, setNavigation] = useState([])
  const sessionChecked = useRef(false)
  const fromApp = router.query['from'] === 'app'

  const showLoginForm = () => {
    setLoginState('login')
    setUser(null)
    setNavigation([])
  }
  const handleOpenApp = async () => {
    const result = await NativeRouter.openApp(
      Array.isArray(router.query.source)
        ? router.query.source[0]
        : router.query.source,
      Array.isArray(router.query.handoff)
        ? router.query.handoff[0]
        : router.query.handoff
    )
    if (result === 'signed_out') {
      // The browser's session ended elsewhere: sign in again on this page,
      // which keeps from/source for the hand-off.
      showLoginForm()
    } else if (result !== 'opened') {
      alert(result.error)
    }
  }
  const handleLogout = () => {
    // Only this browser: Enconvo and other devices stay signed in.
    supabase.auth.signOut({ scope: 'local' }).then(showLoginForm)
  }

  useEffect(() => {
    // This page is static, so from/source/handoff are only in the query once
    // the router is ready; checked before that, a browser that's already
    // signed in would wait for a click on "Open Enconvo".
    if (!router.isReady || sessionChecked.current) return
    sessionChecked.current = true
    supabase.auth.getSession().then(async ({ data, error }) => {
      console.log('data--', data)
      if (data.session) {
        const expires_at = data.session.expires_at
        console.log('session--', expires_at, new Date().getTime())
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        console.log('user--', user)

        setUser(user)
        // 判断expires_at是否过期
        if (!user) {
          setNavigation([])
          setLoginState('login')
        } else {
          setLoginState('success')
          setNavigation([
            { name: 'Logout', href: '/' },
            { name: 'Account', href: '/account' },
          ])
          // Only a session the auth service still has goes to the app.
          if (router.query['from'] === 'app') {
            handleOpenApp()
          }
        }
      }
    })
  }, [router.isReady])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('event--', event, session)
        if (event === 'SIGNED_IN') {
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
            if (returnUrl === '/') {
              console.log('router.query', router.query)
              // if (router.query === 'app') {
              setLoginState('success')
              setNavigation([
                { name: 'Logout', href: '/' },
                { name: 'Account', href: '/account' },
              ])
              // } else {
              //     router.push('account');
              // }
            } else {
              router.push(returnUrl)
            }
          }
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  return (
    <>
      <div>
        <header className="absolute inset-x-0 top-0 z-50">
          <nav
            className="flex items-center justify-between p-6 lg:px-8"
            aria-label={t('Global')}
          >
            <div className="ml-32 flex items-center lg:flex-1 "></div>

            <div className="mr-32  lg:flex lg:gap-x-12">
              {loginState === 'success' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push('/account')}
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{t('Account')}</span>
                  </button>

                  <button
                    onClick={handleLogout}
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
              )}
            </div>
          </nav>
        </header>

        {loginState === 'success' ? (
          <LoginSuccess
            handleOpenApp={handleOpenApp}
            user={user}
            fromApp={fromApp}
          />
        ) : (
          <LoginForm
            setLoginState={setLoginState}
            loginState={loginState}
            setUser={setUser}
            router={router}
          />
        )}
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/login')
