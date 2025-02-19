import 'focus-visible'
import '@/styles/tailwind.css'

// export default function App({ Component, pageProps }) {
//   return <Component {...pageProps} />
// }
import React from 'react';
import Script from 'next/script';

const App = ({Component, pageProps}) => {
    return (
        <>
            <Script
                src="https://js.stripe.com/v3/"
                strategy="afterInteractive"
            />

           <script async src="https://assets.endorsely.com/endorsely.js" data-endorsely="2006ac68-b1bd-4140-ab76-aa957e3c2016"></script>

            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-X7999CT0H3"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-X7999CT0H3');
        `}
            </Script>

            <Component {...pageProps} />
        </>
    );
};

export default App;

