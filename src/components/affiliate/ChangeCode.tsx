import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { useState, type FormEvent } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import {
  affiliateLink,
  changeAffiliateCode,
  formatDay,
  isAffiliateCode,
  normalizeAffiliateCode,
  type AffiliateApplication,
} from '@/lib/affiliate-program'
import { input } from './ui'

// Changing the link code on /affiliate. The old code becomes a former code, so links and QR codes
// already shared keep crediting the Affiliate and no one else can take it. The Worker allows one
// change every 30 days and the dashboard says when the next one is.

const saveButton =
  'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'

export function ChangeCode({
  code,
  accessToken,
  changeableAt,
  onChanged,
}: {
  code: string
  accessToken: string
  changeableAt: string | null
  onChanged: (affiliate: AffiliateApplication) => void
}) {
  const { t, locale } = useI18n()

  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    error: boolean
    text: string
  } | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (draft === null || saving) return
    const next = normalizeAffiliateCode(draft)
    if (!isAffiliateCode(next) || next === code) return
    setSaving(true)
    setMessage(null)
    const result = await changeAffiliateCode(accessToken, next)
    setSaving(false)
    if (result.ok) {
      onChanged(result.data)
      setDraft(null)
      setMessage({
        error: false,
        text: 'Saved. Use your new link from now on.',
      })
    } else {
      setMessage({ error: true, text: result.message })
    }
  }

  if (draft === null) {
    return (
      <div className="mt-2 space-y-1 text-xs leading-5 text-content-muted">
        {message && (
          <p role="status" className="text-signal-green">
            {t(message.text)}
          </p>
        )}
        {changeableAt ? (
          <p>
            <I18nText
              source={'You can change your code again on {p0}.'}
              values={{ p0: formatDay(changeableAt, locale) }}
            />
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(code)
              setMessage(null)
            }}
            className="inline-flex min-h-[28px] items-center gap-1.5 font-medium transition-colors hover:text-content"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t('Change code')}
          </button>
        )}
      </div>
    )
  }

  const next = normalizeAffiliateCode(draft)
  const invalid = draft.trim() !== '' && !isAffiliateCode(next)
  return (
    <form
      onSubmit={save}
      className="mt-4 rounded-xl border border-hairline p-4"
      noValidate
    >
      <label className="block max-w-sm">
        <span className="text-sm font-medium text-content">
          {t('New code')}
        </span>
        <input
          className={`${input} mt-2 font-mono`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setMessage(null)
          }}
          maxLength={32}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={invalid}
          aria-describedby="change-code-hint"
          autoFocus
        />
      </label>
      <p
        id="change-code-hint"
        className="mt-2 text-xs leading-5 text-content-muted"
      >
        <I18nText
          source={
            '{p0} Links and QR codes you already shared keep working and stay yours. You can change your code once every 30 days.'
          }
          values={{
            p0: invalid ? (
              <span className="text-signal-red">
                {t(
                  'Use 3 to 32 letters, digits, - or _, starting with a letter or digit.'
                )}
              </span>
            ) : (
              <>
                {t('Your link becomes')}{' '}
                <span className="break-all font-mono text-content-body">
                  {affiliateLink(isAffiliateCode(next) ? next : code)}
                </span>
                .
              </>
            ),
          }}
        />
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!isAffiliateCode(next) || next === code || saving}
          className={saveButton}
        >
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {t('Save code')}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(null)
            setMessage(null)
          }}
          disabled={saving}
          className="min-h-[40px] rounded-lg px-3 text-sm font-medium text-content-muted transition-colors hover:text-content disabled:opacity-50"
        >
          {t('Cancel')}
        </button>
        {message?.error && (
          <span role="status" className="text-xs text-signal-red">
            {t(message.text)}
          </span>
        )}
      </div>
    </form>
  )
}
