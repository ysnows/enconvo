import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { affiliateReturnPath } from '@/lib/auth-flow'
import ResetPwdForm from './components/ResetPwdForm'
import Login from './login'

export default function ResetPassword() {
  const [state, setState] = useState('reset')
  const router = useRouter()
  const { t } = useI18n()
  const destination =
    router.query.from !== 'app' ? affiliateReturnPath(router.query) : null

  useEffect(() => {
    if (state === 'success' && router.isReady && destination)
      void router.replace(destination)
  }, [state, router.isReady, destination, router])

  if (state !== 'success') return <ResetPwdForm setLoginState={setState} />
  if (!destination) return <Login />
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-content">
      <p role="status">{t('Your password has been updated.')}</p>
      <Link href={destination} className="text-signal-blue hover:underline">
        {t('Go to Affiliate dashboard')}
      </Link>
    </main>
  )
}

export const getStaticProps = i18nStaticProps('/reset_password')
