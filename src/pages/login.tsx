import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LoginForm from './components/LoginForm'
import LoginSuccess from '@/pages/components/LoginSuccess'
import { LoginAccountChooser } from '@/components/LoginAccountChooser'
import { NativeRouter } from '@/utils/app/native_router'
import { affiliateReturnPath } from '@/lib/auth-flow'
import {
  PageCornerActions,
  pageCornerControlClass,
} from '@/components/PageCorner'

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
  // The app's own Log In sends prompt=select_account: a browser that's already
  // signed in asks which account to use instead of handing its account over.
  const selectAccount = router.query['prompt'] === 'select_account'
  // Until the user picks, SIGNED_IN (which supabase-js also sends on load and
  // when the tab comes back) must not move the page past the choice.
  const accountChosen = useRef(false)
  const [switching, setSwitching] = useState(false)

  const showLoginForm = useCallback(() => {
    setLoginState('login')
    setUser(null)
    setNavigation([])
  }, [])
  const handleOpenApp = useCallback(async () => {
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
  }, [router.query.source, router.query.handoff, showLoginForm])
  const handleLogout = () => {
    // Only this browser: Enconvo and other devices stay signed in.
    supabase.auth.signOut({ scope: 'local' }).then(showLoginForm)
  }
  const showSignedIn = () => {
    setLoginState('success')
    setNavigation([
      { name: 'Logout', href: '/' },
      { name: 'Account', href: '/account' },
    ])
  }
  const continueWithAccount = () => {
    accountChosen.current = true
    showSignedIn()
    handleOpenApp()
  }
  const switchAccount = async () => {
    accountChosen.current = true
    setSwitching(true)
    // Only this browser; the sign-in form keeps from/source for the hand-off.
    await supabase.auth.signOut({ scope: 'local' })
    setSwitching(false)
    showLoginForm()
  }

  useEffect(() => {
    // This page is static, so from/source/handoff are only in the query once
    // the router is ready; checked before that, a browser that's already
    // signed in would wait for a click on "Open Enconvo".
    if (!router.isReady || sessionChecked.current) return
    sessionChecked.current = true
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (data.session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        setUser(user)
        // 判断expires_at是否过期
        if (!user) {
          accountChosen.current = true
          setNavigation([])
          setLoginState('login')
        } else if (fromApp && selectAccount) {
          setLoginState('choose')
        } else if (!fromApp && affiliateReturnPath(router.query)) {
          // INITIAL_SESSION does not fire SIGNED_IN: an existing session must
          // also honor the portal link without waiting for another login.
          void router.replace(affiliateReturnPath(router.query))
        } else {
          accountChosen.current = true
          showSignedIn()
          // Only a session the auth service still has goes to the app.
          if (fromApp) {
            handleOpenApp()
          }
        }
      } else {
        accountChosen.current = true
      }
    })
  }, [router.isReady, router, fromApp, selectAccount, handleOpenApp])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const choosing =
          new URLSearchParams(window.location.search).get('prompt') ===
            'select_account' && !accountChosen.current
        if (event === 'SIGNED_IN' && !choosing) {
          const affiliateDestination = affiliateReturnPath(router.query)
          if (!fromApp && affiliateDestination) {
            void router.replace(affiliateDestination)
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
  }, [router, fromApp, locale])

  return (
    <>
      <div>
        {loginState === 'success' && (
          <PageCornerActions>
            <Link href="/account" className={pageCornerControlClass}>
              <User size={14} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('Account')}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={pageCornerControlClass}
            >
              <LogOut size={14} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('Log out')}</span>
            </button>
          </PageCornerActions>
        )}

        {loginState === 'choose' ? (
          <LoginAccountChooser
            email={(user as { email?: string } | null)?.email ?? ''}
            onContinue={continueWithAccount}
            onUseDifferentAccount={switchAccount}
            switching={switching}
          />
        ) : loginState === 'success' ? (
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
