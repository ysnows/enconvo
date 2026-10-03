import type { GetServerSideProps, GetStaticProps } from 'next'
import { getLocale, type Messages } from './locale'
import messageMap from './message-map.json'

export async function loadMessages(
  locale?: string,
  pathname = 'common'
): Promise<Messages> {
  const language = getLocale(locale)
  if (language === 'en') return {}
  const all = (await import(`./messages/${language}.json`)).default as Messages
  const keys: string[] = messageMap[pathname] || messageMap.common
  return Object.fromEntries(
    keys.filter((key) => Object.hasOwn(all, key)).map((key) => [key, all[key]])
  )
}

/** Preserve redirects and notFound responses from the owning page. */
export function withI18nProps<T extends (...args: any[]) => any>(
  loader: T,
  pathname: string
): T {
  return (async (context: any) => {
    const result = await loader(context)
    if (!('props' in result)) return result
    return {
      ...result,
      props: {
        ...(await result.props),
        i18nMessages: await loadMessages(context.locale, pathname),
      },
    }
  }) as T
}
export function i18nStaticProps(pathname: string): GetStaticProps {
  return async ({ locale }) => ({
    props: { i18nMessages: await loadMessages(locale, pathname) },
  })
}
export function i18nServerSideProps(pathname: string): GetServerSideProps {
  return i18nStaticProps(pathname) as GetServerSideProps
}
