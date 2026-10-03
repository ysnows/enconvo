import 'focus-visible'
import '@/styles/tailwind.css'
import React, { useEffect } from 'react'
import { getLocale } from '@/i18n/locale'
import { I18nProvider } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LocaleMetadata } from '@/components/LocaleMetadata'
import Script from 'next/script'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { SocialMetadata } from '@/components/SocialMetadata'
import { InviteToast } from '@/components/InviteToast'
import { AffiliateOfferToast } from '@/components/AffiliateOfferToast'
import { useInviteAutoRedeem } from '@/lib/invite-auto-redeem'
import { useAffiliateJourney } from '@/lib/affiliate-journey-tracking'

const privateRoutes = new Set([
  '/account',
  '/login',
  '/register',
  '/auth',
  '/auth/callback',
  '/payment',
  '/pay_success',
  '/cloud-points',
  '/reset_password',
  '/reset_password_send',
])
// Placeholder and deep-link pages that should not compete in search.
const noindexRoutes = new Set([
  '/developer',
  '/mcp/install',
  '/i/[code]',
  '/redeem',
  '/redeem/[code]',
])

const navigationRoutes = new Set([
  '/',
  '/use-cases',
  '/changelog',
  '/affiliate',
  '/affiliate/terms',
  '/affiliate/payouts/[id]',
  '/affiliate/statements/[year]',
  '/i/[code]',
  '/redeem',
  '/redeem/[code]',
])

const AppContent = ({ Component, pageProps, router }: AppProps) => {
  useEffect(() => {
    if (
      !router.isReady ||
      !['/login', '/reset_password'].includes(router.pathname) ||
      typeof router.query.language !== 'string'
    )
      return
    const locale = getLocale(router.query.language)
    if (locale !== router.locale)
      void router.replace(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale, scroll: false }
      )
  }, [router.isReady, router.query.language, router.locale])
  useInviteAutoRedeem()
  useAffiliateJourney()
  return (
    <>
      <SocialMetadata pathname={router.pathname} />
      <LocaleMetadata />
      {(privateRoutes.has(router.pathname) ||
        noindexRoutes.has(router.pathname) ||
        router.pathname.startsWith('/components/')) && (
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      )}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-JBLMBKBEN2"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-JBLMBKBEN2');
        `}
      </Script>

      {!navigationRoutes.has(router.pathname) &&
        !router.pathname.startsWith('/go/') && (
          <div className="fixed right-4 top-4 z-[60]">
            <LanguageSwitcher placement="page" />
          </div>
        )}
      <Component {...pageProps} />
      <InviteToast />
      <AffiliateOfferToast />
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <I18nProvider messages={props.pageProps.i18nMessages}>
      <AppContent {...props} />
    </I18nProvider>
  )
}
