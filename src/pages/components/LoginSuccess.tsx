import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { Logo } from '@/components/Logo'
import * as React from 'react'
import { User } from '@supabase/supabase-js'

export default function LoginSuccess({ handleOpenApp, user, fromApp = false }) {
  const { t, locale } = useI18n()

  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    // Only this browser: Enconvo and other devices stay signed in.
    await supabase.auth.signOut({ scope: 'local' })
    window.location.href = '/'
  }

  return (
    <>
      <Head>
        <title>{t('Sign In Success - Enconvo')}</title>
        <meta
          name="description"
          content={t(
            'you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain.'
          )}
        />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[480px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-8">
            <Logo className="h-16 w-auto" />
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-medium tracking-tight text-white">
                {fromApp
                  ? t("You're signed in")
                  : t('Hi, you have successfully connected to Enconvo')}
              </h3>
              <p className="text-base text-[#888888]">
                {fromApp ? (
                  t(
                    "Taking you back to Enconvo. If it doesn't open, click Open Enconvo."
                  )
                ) : (
                  <>
                    {t(
                      "You have successfully connected to Enconvo Account. Now it's time to open Enconvo to use the new commands of the extension."
                    )}
                  </>
                )}
              </p>
            </div>

            <Button
              onClick={handleOpenApp}
              className="h-10 w-full max-w-[200px] rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
            >
              {t('Open Enconvo')}
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/LoginSuccess')
