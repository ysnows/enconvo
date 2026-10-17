import { withI18nProps } from '@/i18n/server'
import { AffiliatePortal } from '@/components/affiliate/AffiliatePortal'
import { useRouter } from 'next/router'

export default function AffiliatePage({ renderedAt }: { renderedAt?: number }) {
  const { pathname } = useRouter()
  return (
    <AffiliatePortal
      page={pathname === '/affiliate/dashboard' ? 'dashboard' : 'program'}
      renderedAt={renderedAt}
    />
  )
}

export const getStaticProps = withI18nProps(
  async () => ({ props: { renderedAt: Date.now() }, revalidate: 3600 }),
  '/affiliate'
)
