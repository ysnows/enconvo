import Head from 'next/head'
import { useRouter } from 'next/router'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl, locales } from '@/i18n/locale'
import { socialPages } from '@/data/socialMetadata'

/** Alternate language URLs only for indexable public pages. */
export function LocaleMetadata() {
  const router = useRouter()
  const { locale } = useI18n()
  const path = router.pathname === '/downloads' ? '/privacy' : router.pathname
  if (
    !Object.hasOwn(socialPages, path) &&
    !['/affiliate', '/affiliate/terms'].includes(path)
  )
    return null
  return (
    <Head>
      <link rel="canonical" href={canonicalUrl(path, locale)} key="canonical" />
      {locales.map((language) => (
        <link
          key={`alternate-${language}`}
          rel="alternate"
          hrefLang={language}
          href={canonicalUrl(path, language)}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={canonicalUrl(path, 'en')}
        key="alternate-default"
      />
    </Head>
  )
}
