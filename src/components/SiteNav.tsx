import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { localizePath } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface NavigationItem {
  name: string
  href: string
}

interface SocialLink {
  name: string
  href: string
  icon: (props: any) => JSX.Element
}

const socialLinks: SocialLink[] = [
  {
    name: 'Discord',
    href: 'https://discord.gg/jYsdVRRK2k',
    icon: (props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/enconvo_ai',
    icon: (props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

const defaultNav: NavigationItem[] = [
  { name: 'Features', href: '/#features' },
  { name: 'Use Cases', href: '/use-cases' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Docs', href: 'https://docs.enconvo.ai/' },
  { name: 'Releases', href: '/changelog' },
  { name: 'Affiliate', href: '/affiliate' },
  { name: 'Log in', href: '/login' },
]

export function SiteNav() {
  const { t, locale } = useI18n()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>(defaultNav)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setNavigation([
          { name: 'Features', href: '/#features' },
          { name: 'Use Cases', href: '/use-cases' },
          { name: 'Pricing', href: '/#pricing' },
          { name: 'Docs', href: 'https://docs.enconvo.ai/' },
          { name: 'Releases', href: '/changelog' },
          { name: 'Affiliate', href: '/affiliate' },
          { name: data.session.user.user_metadata.name, href: '/account' },
        ])
      }
    })
  }, [])

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-hairline bg-nav-surface/90 backdrop-blur-md">
      <nav
        className="flex items-center justify-between p-6 lg:px-8 xl:pr-[180px]"
        aria-label={t('Global')}
      >
        <div className="flex items-center xl:flex-1">
          <Link
            href="/"
            aria-label={t('Enconvo home')}
            className="flex items-center gap-3"
          >
            <Logo className="h-8 w-auto" />
            <span className="hidden text-lg font-bold text-content min-[360px]:inline">
              {t('Enconvo')}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 xl:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-content-muted"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{t('Open main menu')}</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <LanguageSwitcher />
        </div>

        <div className="hidden items-center xl:flex xl:gap-x-5">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={localizePath(item.href, locale)}
              target={item.href.startsWith('http') ? '_blank' : '_self'}
              className="text-sm font-semibold leading-6 text-content-body transition-colors hover:text-content"
              rel="noreferrer"
            >
              {item.href === '/account' ? item.name : t(item.name)}
            </a>
          ))}
          <div className="flex items-center space-x-3">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={localizePath(item.href, locale)}
                target="_blank"
                rel="noreferrer"
                className="text-content-muted transition-colors hover:text-content-body"
              >
                <span className="sr-only">
                  {item.href === '/account' ? item.name : t(item.name)}
                </span>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 xl:block">
          <LanguageSwitcher />
        </div>
      </nav>

      <Dialog
        as="div"
        className="xl:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-surface px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-hairline">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="-m-1.5 p-1.5"
              aria-label={t('Enconvo home')}
            >
              <Logo className="h-8 w-auto" />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-lg p-2.5 text-content-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">{t('Close menu')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-hairline">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={localizePath(item.href, locale)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-content hover:bg-surface-elevated"
                  >
                    {item.href === '/account' ? item.name : t(item.name)}
                  </a>
                ))}
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={localizePath(item.href, locale)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 flex items-center rounded-lg px-3 py-2 text-base font-semibold leading-7 text-content hover:bg-surface-elevated"
                  >
                    <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                    {item.href === '/account' ? item.name : t(item.name)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}
