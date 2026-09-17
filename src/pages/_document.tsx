import { Head, Html, Main, NextScript } from 'next/document'

export default function Document(props) {
  let pageProps = props.__NEXT_DATA__?.props?.pageProps

  return (
    <Html
      className="h-full scroll-smooth bg-[#07080A] antialiased [font-feature-settings:'calt','kern','liga','ss03']"
      lang="en"
    >
      <Head />
      <body className="flex h-full flex-col">
        <Main {...pageProps} />
        <NextScript />
      </body>
    </Html>
  )
}
