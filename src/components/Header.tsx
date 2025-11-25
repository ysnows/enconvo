import { Fragment, ReactNode } from 'react'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'

interface MobileNavLinkProps {
  href: string
  children: ReactNode
}

function MobileNavLink({ href, children }: MobileNavLinkProps) {
  return (
    <Popover.Button as={Link} href={href} className="block w-full p-2">
      {children}
    </Popover.Button>
  )
}

interface MobileNavIconProps {
  open: boolean
}

function MobileNavIcon({ open }: MobileNavIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0'
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0'
        )}
      />
    </svg>
  )
}

function MobileNavigation() {
  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center [&:not(:focus-visible)]:focus:outline-none"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            as="div"
            className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5"
          >
            <MobileNavLink href="#features">Features</MobileNavLink>
            <MobileNavLink href="#testimonials">Testimonials</MobileNavLink>
            <MobileNavLink href="#pricing">Pricing</MobileNavLink>
            <hr className="m-2 border-slate-300/40" />
            <MobileNavLink href="/login">Sign in</MobileNavLink>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export function Header() {
  return (
    <header className="py-4 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 sticky top-0 backdrop-blur-xl border-b border-gray-700/50 z-50">
      <Container>
        <nav className="relative z-50 flex justify-between items-center px-6 py-3 rounded-2xl border border-gray-700/50 bg-gradient-to-r from-gray-800/80 via-gray-900/80 to-gray-800/80 shadow-2xl hover:border-gray-600/50 hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center md:gap-x-8">
            <Link href="#" aria-label="Home">
              <Logo className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex md:gap-x-1">
              <NavLink href="/features" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Features</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
              <NavLink href="/pricing" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Pricing</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
              <NavLink href="/guides" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Guides</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
              <NavLink href="/changelog" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Changelog</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
              <NavLink href="/privacy" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Privacy</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-x-4">
            <div className="hidden md:block">
              <NavLink href="/login" className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700/30 group">
                <span className="relative z-10">Log in</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </NavLink>
            </div>
            <Button
              href="/download"
              className="relative group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-y-0.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </span>
            </Button>
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}
