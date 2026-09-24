import 'focus-visible'
import '@/styles/tailwind.css'
import React from 'react'
import Script from 'next/script'
import Head from 'next/head'
import { AppProps } from 'next/app'

const privateRoutes = new Set(['/account', '/login', '/register', '/auth', '/auth/callback', '/payment', '/pay_success', '/cloud-points', '/reset_password', '/reset_password_send'])
// Placeholder and deep-link pages that should not compete in search.
const noindexRoutes = new Set(['/developer', '/mcp/install'])

const App = ({ Component, pageProps, router }: AppProps) => {
    return (
        <>
            {(privateRoutes.has(router.pathname) || noindexRoutes.has(router.pathname) || router.pathname.startsWith('/components/')) && (
                <Head><meta name="robots" content="noindex, follow" /></Head>
            )}
            <Script
                src="https://assets.endorsely.com/endorsely.js"
                data-endorsely="2006ac68-b1bd-4140-ab76-aa957e3c2016"
                strategy="afterInteractive"
            />

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

            <Component {...pageProps} />
        </>
    );
};

export default App;
