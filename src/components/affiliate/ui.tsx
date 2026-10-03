import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, Check, Copy } from 'lucide-react'

// Small pieces shared by the Affiliate pages (/affiliate and /affiliate/terms).

export const card = 'rounded-2xl border border-hairline bg-surface-card'
export const fieldLabel = 'block text-sm font-medium text-content'
export const input =
  'h-11 w-full rounded-lg border border-[#2C3033] bg-[#0B0C0D] px-3 text-[15px] text-content placeholder:text-content-ash focus:border-signal-green focus:outline-none disabled:opacity-60'
export const textarea =
  'min-h-[96px] w-full resize-y rounded-lg border border-[#2C3033] bg-[#0B0C0D] px-3 py-2.5 text-[15px] leading-6 text-content placeholder:text-content-ash focus:border-signal-green focus:outline-none'

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return copied
  }
}

/** The small bordered button beside a link: copy, QR code, download. */
export const toolButton =
  'inline-flex min-h-[40px] flex-none items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50'

/** A copy button that says "Copied" for two seconds. */
export function CopyButton({
  text,
  label = 'Copy link',
  className = '',
}: {
  text: string
  label?: string
  className?: string
}) {
  const { t, locale } = useI18n()

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(text))}
      className={`${toolButton} ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-signal-green" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? t('Copied') : t(label)}</span>
    </button>
  )
}

export function Notice({
  tone,
  title,
  children,
  action,
}: {
  tone: 'info' | 'warn' | 'error'
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const { t, locale } = useI18n()

  const color =
    tone === 'info'
      ? 'text-signal-blue'
      : tone === 'warn'
      ? 'text-signal-yellow'
      : 'text-signal-red'
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 ${card} p-4`}
    >
      <AlertCircle
        className={`mt-0.5 h-5 w-5 flex-none ${color}`}
        aria-hidden="true"
      />
      {/* The action drops under the text on phones so the message keeps the full width. */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-content">{t(title)}</p>
          {children && (
            <div className="mt-1 text-sm leading-6 text-content-muted">
              {children}
            </div>
          )}
        </div>
        {action && <div className="flex-none self-start">{action}</div>}
      </div>
    </div>
  )
}

const PILL = {
  green: 'border-[#1F3A2D] bg-[#0D1A14] text-signal-green',
  blue: 'border-[#1E3A4F] bg-[#10202C] text-signal-blue',
  yellow: 'border-[#4A3D1C] bg-[#2A2313] text-signal-yellow',
  red: 'border-[#4A1F1F] bg-[#2A1414] text-signal-red',
  gray: 'border-[#2C3033] bg-[#17191B] text-content-body',
} as const

export type PillTone = keyof typeof PILL

export function Pill({
  tone,
  children,
}: {
  tone: PillTone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${PILL[tone]}`}
    >
      {children}
    </span>
  )
}
