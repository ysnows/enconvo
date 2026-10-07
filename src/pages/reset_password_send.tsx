import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
// import {useRouter} from "next/navigation";
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

import {
  ReloadIcon,
  ArrowTopRightIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'

import { Logo } from '@/components/Logo'
import { useRouter } from 'next/router'
import { authFlowHref } from '@/lib/auth-flow'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getEmailLink } from '@/utils/app/email_link'

export default function ResetPasswordStepOne() {
  const { t, locale } = useI18n()
  const router = useRouter()

  // 获取url参数

  const supabase = createClientComponentClient()

  // const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [pageState, setPageState] = useState('send')

  const [emailIsLoading, setEmailIsLoading] = React.useState(false)

  const openEmail = () => {
    window.open(getEmailLink(email))
  }

  async function signUp() {
    // check if email is valid
    if (!email || !email.includes('@')) {
      alert(t('Please enter a valid email'))
      return
    }

    setEmailIsLoading(true)

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${authFlowHref('/reset_password', { ...router.query, language: locale })}`,
    })

    if (error) {
      setError(error.message)
      setEmailIsLoading(false)
      return
    }

    console.log(data)

    // NativeRouter.login(data.session.access_token, data.session.refresh_token)
    setPageState('success')

    setEmailIsLoading(false)
    // setContinueLogin(true)
  }

  return (
    <>
      <Head>
        <title>{t('Reset Password - Enconvo')}</title>
        <meta
          name="description"
          content={t(
            'you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain.'
          )}
        />
      </Head>

      {pageState === 'success' && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
          <div className="w-full max-w-[480px] space-y-8 px-4">
            <div className="flex flex-col items-center space-y-8">
              <Logo className="h-16 w-auto" />
              <div className="space-y-4 text-center">
                <h3 className="text-3xl font-medium tracking-tight text-white">
                  {t('Check your email')}
                </h3>
                <p className="text-base text-[#888888]">
                  {t(
                    "We've sent you a reset password link. Check your inbox to reset your password."
                  )}
                </p>
              </div>

              <Button
                onClick={openEmail}
                className="h-10 w-full max-w-[200px] rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {t('Open Email')}
              </Button>
            </div>
          </div>
        </main>
      )}

      {pageState === 'send' && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
          <div className="w-full max-w-[320px] space-y-8 px-4">
            <div className="flex flex-col items-center space-y-6">
              <Link href="/" aria-label={t('Home')}>
                <Logo className="h-16 w-auto" />
              </Link>
              <h3 className="text-center text-3xl font-medium tracking-tight text-white">
                {t('Reset Your Password')}
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder={t('Email')}
                  required
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  className="h-10 border-[#333333] bg-[#1C1C1C] text-white placeholder:text-[#666666]"
                />

                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-900/30 bg-red-900/20 text-red-400"
                  >
                    <AlertDescription className="flex items-center">
                      <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                      {t(error)}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={signUp}
                  disabled={emailIsLoading}
                  className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
                >
                  {emailIsLoading && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {emailIsLoading ? t('Sending') : t('Send Reset Email')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  )
}

export const getStaticProps = i18nStaticProps('/reset_password_send')
