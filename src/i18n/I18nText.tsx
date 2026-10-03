import { Fragment, type ReactNode } from 'react'
import { useI18n } from './I18nProvider'

/** Translate a complete sentence while preserving links, emphasis and user data. */
export function I18nText({
  source,
  values,
}: {
  source: string
  values: Record<string, ReactNode>
}) {
  const { t } = useI18n()
  return (
    <>
      {t(source)
        .split(/(\{\w+\})/g)
        .map((part, index) => (
          <Fragment key={index}>
            {/^\{\w+\}$/.test(part) && Object.hasOwn(values, part.slice(1, -1))
              ? values[part.slice(1, -1)]
              : part}
          </Fragment>
        ))}
    </>
  )
}
