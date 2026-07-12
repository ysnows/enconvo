import Link from 'next/link'

import { Container } from '@/components/Container'
import { NavLink } from '@/components/NavLink'

export function Footer() {
  return (
    <footer className="bg-canvas">
      <Container>
        <div className="py-16">
          <nav className="mt-10 text-sm" aria-label="quick links">
            <div className="-my-1 flex justify-center gap-x-6">
              <NavLink
                href="/#features"
                className="text-content-muted hover:text-content"
              >
                Features
              </NavLink>
              <NavLink
                href="/use-cases"
                className="text-content-muted hover:text-content"
              >
                Use Cases
              </NavLink>
              <NavLink
                href="/#pricing"
                className="text-content-muted hover:text-content"
              >
                Pricing
              </NavLink>
              <NavLink
                href="/changelog"
                className="text-content-muted hover:text-content"
              >
                Releases
              </NavLink>
            </div>
          </nav>
        </div>
        <div className="flex flex-col items-center border-t border-hairline py-10 sm:flex-row sm:justify-between">
          <div className="mt-6 sm:mt-0">
            <p className="text-sm text-content-ash">
              Copyright &copy; {new Date().getFullYear()} EnConvo. All rights
              reserved.
            </p>
          </div>

          <div className="flex gap-x-6">
          </div>

          <div className="flex space-x-6 text-sm text-content-ash">
            <Link href="/privacy" className="hover:text-content-muted">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-content-muted">
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
