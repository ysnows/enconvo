import { useI18n } from '@/i18n/I18nProvider'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { describeRedeemOutcome, type RedeemResult } from '@/lib/invite'

/**
 * An automatic Redemption's icon, title and line. The site toast (`compact`)
 * and the landing page each supply the frame around it.
 */
export function InviteRedeemMessage({
  result,
  compact = false,
}: {
  result: RedeemResult
  compact?: boolean
}) {
  const { t, locale } = useI18n()

  const { title, body } = describeRedeemOutcome(result)
  const Icon = result.ok ? CheckCircle2 : AlertCircle
  return (
    <>
      <Icon
        className={cn(
          'mt-0.5 h-5 w-5 flex-none',
          result.ok ? 'text-signal-green' : 'text-content-muted'
        )}
        aria-hidden="true"
      />
      <div className={cn('min-w-0 flex-1', compact && 'py-0.5')}>
        <p className="text-sm font-medium text-content">{t(title)}</p>
        <p
          className={cn(
            'text-content-muted',
            compact
              ? 'mt-0.5 text-[13px] leading-[18px]'
              : 'mt-1 text-sm leading-6'
          )}
        >
          {t(body)}
        </p>
      </div>
    </>
  )
}
