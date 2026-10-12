import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import { ReloadIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

/**
 * Shown when the app asked for an account (`prompt=select_account`) and this
 * browser is already signed in: the user picks this account or signs in with
 * another, instead of the page handing the browser's account over by itself.
 */
export function LoginAccountChooser({
  email,
  onContinue,
  onUseDifferentAccount,
  switching = false,
}: {
  email: string
  onContinue: () => void
  onUseDifferentAccount: () => void
  switching?: boolean
}) {
  const { t } = useI18n()

  return (
    <>
      <Head>
        <title>{t('Log In - Enconvo')}</title>
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div className="w-full max-w-[400px] space-y-8 px-4">
          <div className="flex flex-col items-center space-y-8">
            <Logo className="h-16 w-auto" />
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-medium tracking-tight text-white">
                {t('Choose an account')}
              </h3>
              <p className="text-base text-[#888888]">
                {t(
                  'This browser is already signed in. Continue to Enconvo with this account, or sign in with a different one.'
                )}
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-xl border border-[#333333] bg-[#242424] px-4 py-3">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A3A3A] text-sm font-medium uppercase text-white"
              >
                {email.charAt(0)}
              </div>
              <span className="min-w-0 truncate text-sm text-white" title={email}>
                {email}
              </span>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={onContinue}
                disabled={switching}
                className="h-10 w-full rounded-xl bg-[#E5E5E5] font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {t('Continue')}
              </Button>
              <Button
                variant="outline"
                onClick={onUseDifferentAccount}
                disabled={switching}
                className="h-10 w-full rounded-xl border-[#333333] bg-[#242424] font-medium text-[#888888] transition-all duration-200 hover:bg-[#2C2C2C] hover:text-[#999999]"
              >
                {switching && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {t('Use a different account')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
