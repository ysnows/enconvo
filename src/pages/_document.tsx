import { Head, Html, Main, NextScript } from 'next/document'

export default function Document(props) {
  let pageProps = props.__NEXT_DATA__?.props?.pageProps

  // Touch screens jump to in-page anchors; smooth-scrolling the long homepage stutters on phones.
  return (
    <Html
      className="h-full bg-[#07080A] antialiased [font-feature-settings:'calt','kern','liga','ss03'] [@media(hover:hover)]:scroll-smooth"
      lang={props.__NEXT_DATA__?.locale || 'en'}
    >
      <Head />
      <body className="flex h-full flex-col">
        <Main {...pageProps} />
        <NextScript />
      </body>
    </Html>
  )
}
