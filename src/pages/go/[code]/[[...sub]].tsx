import { localizePath } from '@/i18n/locale'
import { withI18nProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import { getSocialMetadata } from '@/data/socialMetadata'
import { SITE_URL } from '@/data/siteMetadata'

// A short Affiliate link (`/go/kenmoo/facebook`) as Facebook and LinkedIn see it. next.config.js
// sends people straight on to `/?via=kenmoo&sub=facebook`; these crawlers get this page instead.
// They credit a shared link to the og:url of the page it lands on, and the homepage's has no
// `?via=`, so a post would link to the plain homepage. Here og:url is the short link itself:
// a click on the post comes back through it and joins the Affiliate's journey.

// The same patterns and crawlers as the redirects in next.config.js.
const CODE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$/
const SUB = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/
const SHARE_CRAWLER = /facebookexternalhit|Facebot|LinkedInBot/

interface ShortLinkCardProps {
  url: string
  destination: string
  title: string
  description: string
  image: string
  imageAlt: string
}

export const getServerSideProps: GetServerSideProps<ShortLinkCardProps> =
  withI18nProps(async ({ params, query, req, res }) => {
    const code = typeof params?.code === 'string' ? params.code : ''
    const rest = Array.isArray(params?.sub) ? params.sub : []
    const sub = rest[0] ?? null
    if (!CODE.test(code) || rest.length > 1 || (sub !== null && !SUB.test(sub)))
      return { notFound: true }

    // Like the redirects, other query values pass through.
    const search = new URLSearchParams({ via: code, ...(sub ? { sub } : {}) })
    for (const [key, value] of Object.entries(query)) {
      if (
        key !== 'code' &&
        key !== 'sub' &&
        key !== 'via' &&
        typeof value === 'string'
      )
        search.append(key, value)
    }
    const destination = `/?${search}`
    // Only a crawler the redirects let through gets here; anyone else goes on.
    if (!SHARE_CRAWLER.test(req.headers['user-agent'] ?? ''))
      return { redirect: { destination, permanent: false } }

    res.setHeader('Cache-Control', 'private, no-store')
    const home = getSocialMetadata('/')!
    return {
      props: {
        url: `${SITE_URL}/go/${code}${sub ? `/${sub}` : ''}`,
        destination,
        title: home.title,
        description: home.description,
        image: home.image,
        imageAlt: home.imageAlt,
      },
    }
  }, '/go/[code]/[[...sub]]')

export default function ShortLinkCard({
  url,
  destination,
  title,
  description,
  image,
  imageAlt,
}: ShortLinkCardProps) {
  const { t, locale } = useI18n()

  return (
    <>
      <Head>
        <title>{t(title)}</title>
        <meta name="description" content={t(description)} />
        <meta name="robots" content="noindex" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="Enconvo" key="og:site_name" />
        <meta property="og:locale" content="en_US" key="og:locale" />
        <meta property="og:url" content={url} key="og:url" />
        <meta property="og:title" content={t(title)} key="og:title" />
        <meta
          property="og:description"
          content={t(description)}
          key="og:description"
        />
        <meta property="og:image" content={image} key="og:image" />
        <meta
          property="og:image:secure_url"
          content={image}
          key="og:image:secure_url"
        />
        <meta
          property="og:image:type"
          content="image/jpeg"
          key="og:image:type"
        />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta
          property="og:image:alt"
          content={t(imageAlt)}
          key="og:image:alt"
        />
      </Head>
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold text-content">{t(title)}</h1>
        <p className="mt-3 text-sm leading-6 text-content-body">
          {t(description)}
        </p>
        <a
          href={localizePath(destination, locale)}
          className="mt-6 text-sm font-medium text-signal-blue underline underline-offset-4"
        >
          {t('Continue to Enconvo')}
        </a>
      </main>
    </>
  )
}
