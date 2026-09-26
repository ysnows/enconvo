import Head from 'next/head'
import { getSocialMetadata } from '@/data/socialMetadata'

/** Render in the initial HTML: link-preview crawlers do not run page effects. */
export function SocialMetadata({ pathname }: { pathname: string }) {
  const page = getSocialMetadata(pathname)
  if (!page) return null

  return (
    <Head>
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:site_name" content="Enconvo" key="og:site_name" />
      <meta property="og:locale" content="en_US" key="og:locale" />
      <meta property="og:url" content={page.url} key="og:url" />
      <meta property="og:title" content={page.title} key="og:title" />
      <meta
        property="og:description"
        content={page.description}
        key="og:description"
      />
      <meta property="og:image" content={page.image} key="og:image" />
      <meta
        property="og:image:secure_url"
        content={page.image}
        key="og:image:secure_url"
      />
      <meta property="og:image:type" content="image/jpeg" key="og:image:type" />
      <meta property="og:image:width" content="1200" key="og:image:width" />
      <meta property="og:image:height" content="630" key="og:image:height" />
      <meta
        property="og:image:alt"
        content={page.imageAlt}
        key="og:image:alt"
      />
      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta name="twitter:site" content="@enconvo_ai" key="twitter:site" />
      <meta name="twitter:title" content={page.title} key="twitter:title" />
      <meta
        name="twitter:description"
        content={page.description}
        key="twitter:description"
      />
      <meta name="twitter:image" content={page.image} key="twitter:image" />
      <meta
        name="twitter:image:alt"
        content={page.imageAlt}
        key="twitter:image:alt"
      />
    </Head>
  )
}
