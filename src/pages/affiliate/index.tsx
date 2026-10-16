import { i18nStaticProps } from '@/i18n/server'
import { AffiliatePortal } from '@/components/affiliate/AffiliatePortal'
import { useRouter } from 'next/router'

export default function AffiliatePage() {
  const { pathname } = useRouter()
  return <AffiliatePortal page={pathname === '/affiliate/dashboard' ? 'dashboard' : 'program'} />
}

export const getStaticProps = i18nStaticProps('/affiliate')
