import { I18nText } from '@/i18n/I18nText'
import { localizePath } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import { Mail, Share2 } from 'lucide-react'
import { affiliateLink, affiliateShortLink } from '@/lib/affiliate-program'
import { toolButton } from './ui'

// One-click sharing in the promotion kit. Each button opens a post with the kit's short post and
// the disclosure, and tags the link with the network as its sub ID, so the link results show which
// network brings customers. Facebook and LinkedIn take only a link, and credit it to the og:url of
// the page it lands on, so they get the short link (src/pages/go keeps og:url on it) and the post
// and disclosure go to the clipboard for pasting.

const NETWORKS = [
  {
    sub: 'x',
    label: 'X',
    url: (text: string) =>
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
  },
  {
    sub: 'threads',
    label: 'Threads',
    url: (text: string) =>
      `https://www.threads.com/intent/post?text=${encodeURIComponent(text)}`,
  },
  {
    sub: 'bluesky',
    label: 'Bluesky',
    url: (text: string) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`,
  },
] as const

const LINK_NETWORKS = [
  {
    sub: 'facebook',
    label: 'Facebook',
    url: (link: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        link
      )}`,
  },
  {
    sub: 'linkedin',
    label: 'LinkedIn',
    url: (link: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        link
      )}`,
  },
] as const

const SUBJECT = 'Enconvo, an AI assistant for Mac'

export function ShareButtons({
  code,
  post,
  disclosure,
}: {
  code: string
  post: (link: string) => string
  disclosure: string
}) {
  const { t, locale } = useI18n()

  const text = (sub: string, link = affiliateLink(code, '/', sub)) =>
    `${post(link)}\n\n${disclosure}`
  // The share sheet exists only in some browsers, so it's offered after mounting to keep the first render the same as the server's.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])
  const [copiedFor, setCopiedFor] = useState<string | null>(null)

  return (
    <div className="mt-6 border-t border-hairline pt-4">
      <h3 className="text-sm font-medium text-content">{t('Share')}</h3>
      <p className="mt-1 text-xs leading-5 text-content-muted">
        <I18nText
          source={
            'Opens a post with the short post above and the disclosure. Each button tags your link with a sub ID such as {p0}, so your results show which network brings customers.'
          }
          values={{
            p0: <span className="font-mono text-content-body">{t('x')}</span>,
          }}
        />
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {NETWORKS.map((network) => (
          <a
            key={network.sub}
            href={localizePath(network.url(text(network.sub)), locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={toolButton}
          >
            {t(network.label)}
          </a>
        ))}
        {LINK_NETWORKS.map((network) => {
          const link = affiliateShortLink(code, network.sub)
          return (
            <a
              key={network.sub}
              href={localizePath(network.url(link), locale)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // The post opens either way; without clipboard access the kit's copy buttons remain.
                navigator.clipboard
                  ?.writeText(text(network.sub, link))
                  .then(() => setCopiedFor(network.label))
                  .catch(() => {})
              }}
              className={toolButton}
            >
              {t(network.label)}
            </a>
          )
        })}
        <a
          href={localizePath(
            `mailto:?subject=${encodeURIComponent(
              SUBJECT
            )}&body=${encodeURIComponent(text('email'))}`,
            locale
          )}
          className={toolButton}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {t('Email')}
        </a>
        {canShare && (
          <button
            type="button"
            onClick={() => {
              // Closing the share sheet rejects the promise; there's nothing to report.
              navigator
                .share({ title: SUBJECT, text: text('share') })
                .catch(() => {})
            }}
            className={toolButton}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t('More')}
          </button>
        )}
      </div>
      <p role="status" className="mt-2 text-xs leading-5 text-content-muted">
        {copiedFor
          ? t('Post and disclosure copied: paste them into your {p0} post.', {
              p0: copiedFor,
            })
          : t(
              'Facebook and LinkedIn open with your link only, and copy the post and disclosure for you to paste.'
            )}
      </p>
    </div>
  )
}
