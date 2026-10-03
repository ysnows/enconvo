import Head from 'next/head'
import Link from 'next/link'
import { useI18n } from '@/i18n/I18nProvider'
import { i18nStaticProps } from '@/i18n/server'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-content">
      <Head>
        <title>{t('Page not found')} — Enconvo</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <p className="text-sm text-content-muted">404</p>
      <h1 className="mt-4 text-3xl font-semibold">{t('Page not found')}</h1>
      <p className="mt-3 text-content-muted">{t('This page is unavailable or has moved.')}</p>
      <Link href="/" className="mt-8 rounded-[10px] bg-white px-4 py-2 text-sm font-medium text-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500">
        {t('Back to home')}
      </Link>
    </main>
  )
}
export const getStaticProps = i18nStaticProps('/404')
