import { i18nStaticProps } from '@/i18n/server'
// Keep the component identity across the automatic redirect. The portal keeps
// its loaded account instead of making the same authenticated request twice.
export { default } from './index'

export const getStaticProps = i18nStaticProps('/affiliate/dashboard')
