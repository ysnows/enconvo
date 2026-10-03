import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import { Container } from '@/components/Container'
import { Feature } from './features/Feature'
import { features } from '@/data/features'

export function PrimaryFeatures() {
  const { t, locale } = useI18n()

  let [_, setTabOrientation] = useState('horizontal')

  useEffect(() => {
    let lgMediaQuery = window.matchMedia('(min-width: 1024px)')

    function onMediaQueryChange({ matches }) {
      setTabOrientation(matches ? 'vertical' : 'horizontal')
    }

    onMediaQueryChange(lgMediaQuery)
    lgMediaQuery.addEventListener('change', onMediaQueryChange)

    return () => {
      lgMediaQuery.removeEventListener('change', onMediaQueryChange)
    }
  }, [])

  return (
    <section
      id="features"
      aria-label={t('Features for running your books')}
      className="relative overflow-hidden bg-canvas pb-28 pt-6 sm:py-32 sm:pt-20"
    >
      <Container className="relative">
        {features.map((feature, index) => (
          <Feature key={index} {...feature} index={index} />
        ))}
      </Container>
    </section>
  )
}
