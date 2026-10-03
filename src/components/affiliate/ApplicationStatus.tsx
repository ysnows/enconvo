import { I18nText } from '@/i18n/I18nText'
import { localizePath } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import { Check } from 'lucide-react'
import { secondaryButton } from '@/components/landing-styles'
import {
  affiliateLink,
  formatDay,
  SUPPORT_EMAIL,
  type AffiliateApplication,
} from '@/lib/affiliate-program'
import { LinkedText, TeamMessage } from './Announcement'
import { card, Notice, Pill } from './ui'

// /affiliate while an application waits for review, or after it was turned down. Enconvo's message,
// such as what to add or why it wasn't approved, shows with it.

function Details({ application }: { application: AffiliateApplication }) {
  const { t, locale } = useI18n()

  const rows = [
    { label: 'Name', value: application.name },
    { label: 'Website or channel', value: application.website || '—' },
    {
      label: 'Link once approved',
      value: affiliateLink(application.code),
      mono: true,
    },
    { label: 'Audience', value: application.audience },
    {
      label: 'How you will promote Enconvo',
      value: application.promotion_plan,
    },
  ]
  return (
    <dl className={`${card} divide-y divide-hairline`}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="text-sm text-content-muted">{t(row.label)}</dt>
          <dd
            className={`whitespace-pre-line break-words text-sm leading-6 text-content ${
              row.mono ? 'font-mono' : ''
            }`}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function PendingApplication({
  application,
  onEdit,
}: {
  application: AffiliateApplication
  onEdit: () => void
}) {
  const { t, locale } = useI18n()

  const steps = [
    {
      title: 'Submitted',
      body: formatDay(application.applied_at, locale),
      done: true,
    },
    {
      title: 'In review',
      body: 'We read every application ourselves',
      current: true,
    },
    { title: 'Approved', body: 'Your link and dashboard appear here' },
  ]
  return (
    <div className="mx-auto max-w-3xl">
      <Pill tone="yellow">{t('In review')}</Pill>
      <h1 className="mt-4 text-3xl font-semibold text-content sm:text-4xl">
        {t('Thanks, your application is in')}
      </h1>
      <p className="mt-4 text-base leading-7 text-content-body">
        {t(
          "We'll look at your audience and plan and decide soon. Come back to this page to see the result; once you're approved, your link and dashboard appear right here."
        )}
      </p>

      {application.message && (
        <div className="mt-8">
          <TeamMessage message={application.message} />
        </div>
      )}

      <ol className={`mt-8 grid gap-4 ${card} p-6 sm:grid-cols-3`}>
        {steps.map((step) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border text-xs font-semibold ${
                step.done
                  ? 'border-signal-green bg-signal-green text-canvas'
                  : step.current
                  ? 'border-signal-yellow text-signal-yellow'
                  : 'border-hairline text-content-ash'
              }`}
              aria-hidden="true"
            >
              {step.done ? (
                <Check className="h-4 w-4" />
              ) : (
                steps.indexOf(step) + 1
              )}
            </span>
            <div>
              <div
                className={`text-sm font-medium ${
                  step.done || step.current
                    ? 'text-content'
                    : 'text-content-muted'
                }`}
              >
                {t(step.title)}
              </div>
              <div className="mt-0.5 text-xs leading-5 text-content-muted">
                {t(step.body)}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-content">
          {t('What you sent')}
        </h2>
        <button type="button" onClick={onEdit} className={secondaryButton}>
          {t('Update application')}
        </button>
      </div>
      <div className="mt-4">
        <Details application={application} />
      </div>
      <p className="mt-6 text-sm text-content-muted">
        <I18nText
          source={'Questions in the meantime? Email {p0} from this account.'}
          values={{
            p0: (
              <a
                href={localizePath(`mailto:${SUPPORT_EMAIL}`, locale)}
                className="text-signal-blue hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            ),
          }}
        />
      </p>
    </div>
  )
}

export function RejectedNotice({ message }: { message?: string | null }) {
  const { t, locale } = useI18n()

  const email = (
    <a
      href={localizePath(`mailto:${SUPPORT_EMAIL}`, locale)}
      className="text-signal-blue hover:underline"
    >
      {SUPPORT_EMAIL}
    </a>
  )
  return (
    <Notice tone="warn" title={t("We couldn't approve your last application")}>
      {message ? (
        <>
          <span className="block whitespace-pre-line break-words text-content-body">
            <LinkedText body={message} />
          </span>
          <span className="mt-2 block">
            <I18nText
              source={
                "You're welcome to apply again below, or email {p0} with questions."
              }
              values={{ p0: email }}
            />
          </span>
        </>
      ) : (
        <>
          {t(
            "This usually means we couldn't tell who you reach or how you'd share Enconvo. You're welcome to apply again with more detail below, or email "
          )}
          {email} {t(' to ask why.')}
        </>
      )}
    </Notice>
  )
}
