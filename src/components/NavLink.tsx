import Link from 'next/link'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface NavLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function NavLink({ href, children, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'inline-block rounded-lg px-2 py-1 text-sm',
        className ?? 'text-content-muted hover:bg-surface-elevated hover:text-content'
      )}
    >
      {children}
    </Link>
  )
}
