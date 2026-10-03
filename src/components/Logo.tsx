import { useI18n } from '@/i18n/I18nProvider'
export function Logo(props) {
  const { t, locale } = useI18n()

  return (
    <img
      src="/logo.webp"
      width={256}
      height={256}
      alt={t('Enconvo Logo')}
      {...props}
    />
  )
}
