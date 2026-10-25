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
import { WelcomeOffer } from '@/components/WelcomeOffer'
import { useInviteAutoRedeem } from '@/lib/invite-auto-redeem'
import { useAffiliateJourney } from '@/lib/affiliate-journey-tracking'
import { useCampaignJourney } from '@/lib/campaign-journey-tracking'
import { useWelcomeOfferAutoClaim } from '@/lib/welcome-offer-auto-claim'
import { useMarketingTracking } from '@/lib/marketing-tracking'
import { CookieConsent } from '@/components/CookieConsent'
import {
  GA_MEASUREMENT_ID,
  clearAnalyticsStorage,
  clearMarketingStorage,
} from '@/lib/cookie-consent'
import { useCookieConsent } from '@/lib/use-cookie-consent'

const privateRoutes = new Set([
  '/account',
  '/login',
  '/register',
  '/auth',
  '/auth/callback',
  '/confirm-age',
  '/payment',
  '/pay_success',
  '/cloud-points',
  '/reset_password',
  '/reset_password_send',
  '/affiliate/dashboard',
])
// Placeholder and deep-link pages that should not compete in search.
const noindexRoutes = new Set([
  '/developer',
  '/mcp/install',
  '/i/[code]',
  '/redeem',
  '/redeem/[code]',
  '/device',
  '/share/[id]',
])

// Pages the app opens for sign-in or a hand-off don't ask about cookies: nothing optional runs on
// them without a choice made elsewhere, and the footer's Cookie settings still open the banner.
const cookieBannerHiddenRoutes = new Set([
  ...Array.from(privateRoutes),
  '/device',
  '/share/[id]',
])

const navigationRoutes = new Set([
  '/',
  '/use-cases',
  '/android',
  '/apps',
  '/changelog',
  '/affiliate',
  '/affiliate/dashboard',
  '/affiliate/terms',
  '/affiliate/payouts/[id]',
  '/affiliate/statements/[year]',
  '/i/[code]',
  '/redeem',
  '/redeem/[code]',
  '/device',
  '/share/[id]',
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
  const { ready: consentReady, consent } = useCookieConsent()
  const analyticsAllowed = consentReady && consent?.analytics === true
  const marketingAllowed = consentReady && consent?.marketing === true
  // What a category stored before it was withdrawn, or before this site asked, goes.
  useEffect(() => {
    if (!consentReady) return
    if (!analyticsAllowed) clearAnalyticsStorage()
    if (!marketingAllowed) clearMarketingStorage()
  }, [consentReady, analyticsAllowed, marketingAllowed])
  useInviteAutoRedeem()
  useWelcomeOfferAutoClaim()
  useAffiliateJourney(marketingAllowed)
  useCampaignJourney(marketingAllowed)
  useMarketingTracking(marketingAllowed)
  return (
    <>
      {/* Next's default viewport has no initial-scale. Without it Safari on the
          iPhone Duo can carry a zoom across a fold change and crop the page. */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
          key="viewport"
        />
      </Head>
      <SocialMetadata pathname={router.pathname} />
      <LocaleMetadata />
      {(privateRoutes.has(router.pathname) ||
        noindexRoutes.has(router.pathname) ||
        router.pathname.startsWith('/components/')) && (
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      )}
      {/* Google Analytics loads only once the visitor allows analytics (lib/cookie-consent).
          Advertising storage and signals stay off: the site measures visits, nothing more. */}
      {analyticsAllowed && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window['ga-disable-${GA_MEASUREMENT_ID}'] = false;
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('set', 'linker', { domains: ['macworthy.com', 'enconvo.com'] });
              gtag('js', new Date());

              gtag('config', '${GA_MEASUREMENT_ID}', { allow_google_signals: false });
            `}
          </Script>
        </>
      )}

      {!navigationRoutes.has(router.pathname) &&
        !router.pathname.startsWith('/go/') && (
          <div className="fixed right-4 top-4 z-[60]">
            <LanguageSwitcher placement="page" />
          </div>
        )}
      <Component {...pageProps} />
      <InviteToast />
      <AffiliateOfferToast />
      <WelcomeOffer />
      <CookieConsent
        ready={consentReady}
        consent={consent}
        hidden={
          cookieBannerHiddenRoutes.has(router.pathname) ||
          router.pathname.startsWith('/go/')
        }
      />
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
