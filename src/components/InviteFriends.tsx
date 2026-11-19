import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { CheckCircle2, X } from 'lucide-react'
import { useInviteRedeemed } from '@/lib/invite-auto-redeem'
import {
  claimInviteRewards,
  clearInviteCookie,
  formatPoints,
  formatRewardUsd,
  getInviteSummary,
  INVITE_DEVICE_COPY,
  INVITER_TERMS,
  inviteArrivalMessage,
  normalizeInviteCode,
  redeemInvite,
  sumRewardsUsd,
  type InviterState,
  type InviteReward,
  type InviteSummary,
} from '@/lib/invite'

// What the Inviter's share of each Invite shows; a Worker without `inviter_state`
// falls back to the row's `status`.
const STATE_LABEL: Record<InviterState, string> = {
  pending_payment: 'Waiting for first payment',
  on_hold: 'In refund window',
  earned: 'Earned',
  refunded: 'Refunded',
  expired: 'No payment in time',
  credited_to_affiliate: 'Went to another link',
  revoked: 'Revoked',
}

const STATE_CLASS: Record<InviterState, string> = {
  pending_payment: 'text-gray-400',
  on_hold: 'text-yellow-300',
  earned: 'text-green-400',
  refunded: 'text-gray-500',
  expired: 'text-gray-500',
  credited_to_affiliate: 'text-gray-500',
  revoked: 'text-red-400',
}

const STATUS_STATE = {
  pending: 'pending_payment',
  qualified: 'earned',
  revoked: 'revoked',
} as const

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function copyText(text: string) {
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

/** The summary without rewards this page has just marked seen. */
function withoutUnseen(summary: InviteSummary, ids: string[]): InviteSummary {
  const unseen = summary.unseen
  if (!unseen) return summary
  const rewards = unseen.rewards.filter((reward) => !ids.includes(reward.id))
  const removed = unseen.rewards.length - rewards.length
  return {
    ...summary,
    unseen: { ...unseen, rewards, count: Math.max(0, unseen.count - removed) },
  }
}

/** Account page "Affiliate" (points tier): the user's code and link, results, and code entry. */
export default function InviteFriends({
  accessToken,
}: {
  accessToken: string
}) {
  const { t, locale } = useI18n()

  const [summary, setSummary] = useState<InviteSummary | null>(null)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState('')
  const [arrival, setArrival] = useState<InviteReward[]>([])
  const loadId = useRef(0)
  const summaryToken = useRef('')
  const claiming = useRef(new Set<string>())

  const load = useCallback(async () => {
    const id = ++loadId.current
    setLoadError('')
    const result = await getInviteSummary(accessToken)
    if (id !== loadId.current) return
    if (result.ok) {
      summaryToken.current = accessToken
      setSummary(result.data)
    } else {
      setLoadError(result.message)
    }
  }, [accessToken])

  useEffect(() => {
    claiming.current = new Set()
    setArrival([])
    void load()
  }, [accessToken, load])

  // `useInviteAutoRedeem` in `_app` redeems an Invite link's code; show its result here.
  useInviteRedeemed((outcome) => {
    if (outcome.ok) void load()
  })

  // Claim first, then announce: only rewards this call newly marked seen are shown,
  // so a reward already announced in the app or another tab is not announced again.
  useEffect(() => {
    if (!summary || summaryToken.current !== accessToken) return
    const ids = (summary.unseen?.rewards ?? [])
      .map((reward) => reward.id)
      .filter((id) => !claiming.current.has(id))
    if (ids.length === 0) return
    const rewards = summary.unseen.rewards
    ids.forEach((id) => claiming.current.add(id))
    void claimInviteRewards(accessToken, ids).then((claimed) => {
      if (summaryToken.current !== accessToken) return
      if (claimed === null) {
        ids.forEach((id) => claiming.current.delete(id))
        return
      }
      setSummary((current) => (current ? withoutUnseen(current, ids) : current))
      const announced = rewards.filter((reward) => claimed.includes(reward.id))
      if (announced.length > 0) {
        setArrival((current) => [
          ...current,
          ...announced.filter(
            (reward) => !current.some((shown) => shown.id === reward.id)
          ),
        ])
      }
    })
  }, [summary, accessToken])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(null), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async (kind: 'code' | 'link', text: string) => {
    if (await copyText(text)) setCopied(kind)
  }

  const handleRedeem = async (event: FormEvent) => {
    event.preventDefault()
    const code = normalizeInviteCode(codeInput)
    if (!code) {
      setRedeemError('Enter a valid invite code.')
      return
    }
    setRedeeming(true)
    setRedeemError('')
    const result = await redeemInvite(accessToken, code, 'code')
    setRedeeming(false)
    if (!result.ok) {
      setRedeemError(result.message)
      return
    }
    clearInviteCookie()
    setCodeInput('')
    await load()
  }

  const hasNewReward = arrival.length > 0 || (summary?.unseen?.count ?? 0) > 0

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <I18nText
          source={'Affiliate{p0}'}
          values={{
            p0: hasNewReward && (
              <span
                className="h-2 w-2 flex-none rounded-full bg-signal-red"
                aria-label={t('New invite reward')}
              />
            ),
          }}
        />
      </h3>

      {!summary && !loadError && (
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 rounded bg-gray-800"></div>
          <div className="h-10 rounded bg-gray-800"></div>
          <div className="h-10 rounded bg-gray-800"></div>
        </div>
      )}

      {!summary && loadError && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-red-400" role="status">
            {t(loadError)}
          </span>
          <button
            onClick={() => void load()}
            className="rounded-md bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700"
          >
            {t('Retry')}
          </button>
        </div>
      )}

      {summary &&
        (() => {
          const inviteePoints = formatPoints(summary.reward_points)
          const ratePercent =
            summary.inviter_rate_percent ?? INVITER_TERMS.ratePercent
          const windowDays =
            summary.inviter_window_days ?? INVITER_TERMS.windowDays
          const holdDays = summary.inviter_hold_days ?? INVITER_TERMS.holdDays
          const { redemption } = summary
          return (
            <div className="space-y-4">
              {arrival.length > 0 && (
                <div
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"
                  role="status"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 flex-none text-green-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">
                      <I18nText
                        source={'+{p0} in Cloud points'}
                        values={{ p0: formatRewardUsd(sumRewardsUsd(arrival)) }}
                      />
                    </p>
                    <p className="mt-0.5 text-gray-400">
                      {t(inviteArrivalMessage(arrival))}
                    </p>
                  </div>
                  <button
                    onClick={() => setArrival([])}
                    className="flex-none rounded-md p-1 text-gray-500 transition-colors hover:text-gray-300"
                    aria-label={t('Dismiss')}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="space-y-2 text-sm leading-6 text-gray-400">
                <p>
                  {t(
                    'Share your link. A friend who signs up with it gets {p0} Cloud points when they sign in to the Enconvo app on {p1}.',
                    { p0: inviteePoints, p1: t(INVITE_DEVICE_COPY) }
                  )}
                </p>
                <p>
                  {t(
                    'You get {p0}% of their first payment in Cloud points, when they pay within {p1} days of signing up. A plan counts at once; a lifetime license counts after its {p2}-day refund window.',
                    { p0: ratePercent, p1: windowDays, p2: holdDays }
                  )}
                </p>
                <p>
                  <I18nText
                    source={'Want cash instead? {p0}'}
                    values={{
                      p0: (
                        <Link
                          href="/affiliate"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {t('Apply to the Affiliate program')}
                        </Link>
                      ),
                    }}
                  />
                </p>
              </div>

              {summary.code_disabled && (
                <div
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200"
                  role="status"
                >
                  {t(
                    "Your invite code is no longer active, so new friends can't use it."
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                <div>
                  <label className="block text-sm text-gray-400">
                    {t('Your invite code')}
                  </label>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-gray-800 p-3">
                    <span
                      className={`font-mono tracking-wider ${
                        summary.code_disabled
                          ? 'text-gray-500 line-through'
                          : ''
                      }`}
                    >
                      {summary.code}
                    </span>
                    <button
                      onClick={() => void handleCopy('code', summary.code)}
                      disabled={summary.code_disabled}
                      className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                    >
                      {copied === 'code' ? t('Copied') : t('Copy')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400">
                    {t('Invite link')}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className={`min-w-0 flex-1 truncate rounded-md bg-gray-800 p-3 ${
                        summary.code_disabled ? 'text-gray-500' : ''
                      }`}
                    >
                      {summary.link}
                    </div>
                    <button
                      onClick={() => void handleCopy('link', summary.link)}
                      disabled={summary.code_disabled}
                      className="flex-none rounded-md bg-blue-500 px-4 py-3 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
                    >
                      {copied === 'link' ? t('Copied') : t('Copy link')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Invited', value: String(summary.stats.invited) },
                  { label: 'Paid', value: String(summary.stats.qualified) },
                  {
                    label: 'Earned',
                    value: formatRewardUsd(summary.stats.usd_earned),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                  >
                    <div className="text-xs text-gray-500">{t(stat.label)}</div>
                    <div className="mt-1 text-lg font-semibold">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {summary.invitees.length > 0 && (
                <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.025]">
                  {summary.invitees.map((invitee) => {
                    const state =
                      invitee.inviter_state && invitee.inviter_state in STATE_LABEL
                        ? invitee.inviter_state
                        : STATUS_STATE[invitee.status]
                    return (
                      <li
                        key={invitee.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-gray-200">
                          {invitee.email}
                        </span>
                        <span className="flex-none text-xs">
                          <span className={STATE_CLASS[state]}>
                            {t(STATE_LABEL[state])}
                          </span>
                          <span className="ml-2 text-gray-500">
                            {formatDate(
                              invitee.qualified_at || invitee.redeemed_at
                            )}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {summary.stats.invited > summary.invitees.length &&
                summary.invitees.length > 0 && (
                  <p className="-mt-2 text-xs text-gray-500">
                    <I18nText
                      source={'Showing the latest {p0} of {p1} invites.'}
                      values={{
                        p0: summary.invitees.length,
                        p1: summary.stats.invited,
                      }}
                    />
                  </p>
                )}

              {redemption.redeemed && (
                <p className="text-sm text-gray-400" role="status">
                  <I18nText
                    source={
                      'You joined with an invite from {p0}. {p1} {p2} {p3}'
                    }
                    values={{
                      p0: redemption.inviter,
                      p1:
                        redemption.status === 'qualified' &&
                        t('You got {p0} Cloud points.', {
                          p0: formatPoints(redemption.reward_points),
                        }),
                      p2:
                        redemption.status === 'pending' &&
                        t(
                          'Sign in to the Enconvo app on {p0} to get your {p1} Cloud points.',
                          {
                            p0: t(INVITE_DEVICE_COPY),
                            p1: formatPoints(redemption.reward_points),
                          }
                        ),
                      p3:
                        redemption.status === 'revoked' &&
                        t('This invite was revoked.'),
                    }}
                  />
                </p>
              )}

              {redemption.can_redeem && (
                <form onSubmit={handleRedeem}>
                  <label
                    htmlFor="invite-code"
                    className="block text-sm text-gray-400"
                  >
                    {t('Have an invite code?')}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="invite-code"
                      value={codeInput}
                      onChange={(event) => {
                        setCodeInput(event.target.value)
                        setRedeemError('')
                      }}
                      placeholder={t('Enter code')}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-800 p-3 font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={redeeming || !codeInput.trim()}
                      className="flex-none rounded-md bg-blue-500 px-4 py-3 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
                    >
                      {redeeming ? t('Redeeming…') : t('Redeem')}
                    </button>
                  </div>
                  {redeemError ? (
                    <p className="mt-2 text-xs text-red-400" role="status">
                      {redeemError}
                    </p>
                  ) : (
                    redemption.window_ends_at && (
                      <p className="mt-2 text-xs text-gray-500">
                        <I18nText
                          source={'You can use one invite code until {p0}.'}
                          values={{ p0: formatDate(redemption.window_ends_at) }}
                        />
                      </p>
                    )
                  )}
                </form>
              )}
            </div>
          )
        })()}
    </div>
  )
}
