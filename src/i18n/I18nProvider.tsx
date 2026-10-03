import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import {
  getLocale,
  rememberLocale,
  translate,
  type Locale,
  type Messages,
  type Values,
} from './locale'

const I18nContext = createContext({
  locale: 'en' as Locale,
  t: (source: unknown, values?: Values) => translate({}, source, values),
})

export function I18nProvider({
  messages = {},
  children,
}: {
  messages?: Messages
  children: ReactNode
}) {
  const router = useRouter()
  const locale = getLocale(router.locale)
  const value = useMemo(
    () => ({
      locale,
      t: (source: unknown, values?: Values) =>
        translate(messages, source, values),
    }),
    [locale, messages]
  )
  useEffect(() => {
    document.documentElement.lang = locale
    rememberLocale(locale)
  }, [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
