import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import Link from 'next/link'

import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'

import { Logo } from '@/components/Logo'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ResetPwdFormProps {
  setLoginState: (state: string) => void
}

export default function ResetPwdForm({ setLoginState }: ResetPwdFormProps) {
  const { t, locale } = useI18n()

  const supabase = createClientComponentClient()

  // const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailIsLoading, setEmailIsLoading] = React.useState(false)

  async function signUp() {
    // check if email is valid
    if (!password) {
      alert('Please enter a valid email')
      return
    }

    setEmailIsLoading(true)

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
      setEmailIsLoading(false)
      return
    }

    console.log(data)

    // NativeRouter.login(data.session.access_token, data.session.refresh_token)
    setLoginState('success')

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

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[320px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" aria-label={t('Home')}>
              <Logo className="h-16 w-auto" />
            </Link>
            <h3 className="text-center text-3xl font-medium tracking-tight text-white">
              {t('Set Your New Enconvo Password')}
            </h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                type="password"
                placeholder={t('Password')}
                required
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
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
                {emailIsLoading ? t('Resetting') : t('Reset Password')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/ResetPwdForm')
