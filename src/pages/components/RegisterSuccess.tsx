import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { getEmailLink } from '@/utils/app/email_link'
import * as React from 'react'

export default function RegisterSuccess({ email }) {
  const { t, locale } = useI18n()

  const openEmail = () => {
    window.open(getEmailLink(email))
  }

  return (
    <>
      <Head>
        <title>{t('Sign Up Success - Enconvo')}</title>
        <meta
          name="description"
          content={t(
            'you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the plugin system, giving your workflow an AI brain.'
          )}
        />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[480px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-8">
            <Logo className="h-16 w-auto" />
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-medium tracking-tight text-white">
                {t('Email has been sent')}
              </h3>
              <p className="text-base text-[#888888]">
                <I18nText
                  source={
                    "We've sent a confirmation email to {p0}. Please check your inbox and confirm your email address to start using Enconvo."
                  }
                  values={{ p0: <span className="text-white">{email}</span> }}
                />
              </p>
            </div>

            <Button
              onClick={openEmail}
              className="h-10 w-full max-w-[200px] rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
            >
              {t('Check Email')}
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/components/RegisterSuccess')
