import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { NavLink } from '@/components/NavLink'

export function Footer() {
  const { t, locale } = useI18n()

  return (
    <footer className="bg-canvas">
      <Container>
        <div className="py-16">
          <nav className="mt-10 text-sm" aria-label={t('quick links')}>
            <div className="-my-1 flex justify-center gap-x-6">
              <NavLink
                href="/#features"
                className="text-content-muted hover:text-content"
              >
                {t('Features')}
              </NavLink>
              <NavLink
                href="/use-cases"
                className="text-content-muted hover:text-content"
              >
                {t('Use Cases')}
              </NavLink>
              <NavLink
                href="/#pricing"
                className="text-content-muted hover:text-content"
              >
                {t('Pricing')}
              </NavLink>
              <NavLink
                href="/changelog"
                className="text-content-muted hover:text-content"
              >
                {t('Releases')}
              </NavLink>
            </div>
          </nav>
        </div>
        <div className="flex flex-col items-center border-t border-hairline py-10 sm:flex-row sm:justify-between">
          <div className="mt-6 sm:mt-0">
            <p className="text-sm text-content-muted">
              <I18nText
                source={'Copyright © {p0} Enconvo. All rights reserved.'}
                values={{ p0: new Date().getFullYear() }}
              />
            </p>
          </div>

          <div className="flex gap-x-6"></div>

          <div className="flex space-x-6 text-sm text-content-muted">
            <Link href="/privacy" className="hover:text-content-muted">
              {t('Privacy Policy')}
            </Link>
            <Link href="/terms" className="hover:text-content-muted">
              {t('Terms of Service')}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
