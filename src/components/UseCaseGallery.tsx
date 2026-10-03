import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { localizePath } from '@/i18n/locale'
import { useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Play, Search, X } from 'lucide-react'
import type { UseCase } from '@/data/useCases'
import {
  ALL_USE_CASES,
  filterUseCases,
  useCaseCategories,
} from '@/lib/useCaseDiscovery'
import styles from '@/styles/Discovery.module.css'

function Preview({ item }: { item: UseCase }) {
  const { t, locale } = useI18n()

  const [failed, setFailed] = useState(false)
  return (
    <span className={styles.preview}>
      {failed ? (
        <span className={styles.previewFallback}>
          {t('Enconvo · ')}
          {t(item.category)}
        </span>
      ) : (
        // YouTube's standard thumbnail is available for every published demo.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
          alt=""
          width={480}
          height={360}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      <span className={styles.previewLabel}>
        <Play size={12} aria-hidden="true" /> {t(' Walkthrough')}
      </span>
      <span className={styles.play} aria-hidden="true">
        <Play size={20} />
      </span>
    </span>
  )
}

/** Shared discovery UI: real links on home, an accessible player on use cases. */
export function UseCaseGallery({
  items,
  onOpen,
  limit,
}: {
  items: UseCase[]
  onOpen?: (item: UseCase) => void
  /** Show at most this many matches, then link to the full catalogue. */
  limit?: number
}) {
  const { t, locale } = useI18n()

  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(ALL_USE_CASES)
  const [query, setQuery] = useState('')
  const categories = useCaseCategories(items)
  const filtered = filterUseCases(items, category, query, t)
  const shown = limit ? filtered.slice(0, limit) : filtered

  function reset() {
    setCategory(ALL_USE_CASES)
    setQuery('')
    searchRef.current?.focus()
  }

  return (
    <div className={styles.browser}>
      <div className={styles.toolbar}>
        <div
          className={styles.filters}
          role="group"
          aria-label={t('Filter walkthroughs by category')}
        >
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              aria-controls={`${id}-results`}
              onClick={() => setCategory(name)}
            >
              {t(name)}
            </button>
          ))}
        </div>
        <div
          className={styles.search}
          role="search"
          aria-label={t('Walkthrough search')}
        >
          <Search size={17} aria-hidden="true" />
          <label htmlFor={`${id}-search`} className="sr-only">
            {t('Search walkthroughs')}
          </label>
          <input
            ref={searchRef}
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Find something to do…')}
            aria-controls={`${id}-results`}
          />
          {query && (
            <button
              type="button"
              aria-label={t('Clear search')}
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p
        className={styles.resultCount}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {shown.length < filtered.length
          ? t('{p0} of ', { p0: shown.length })
          : ''}
        {filtered.length}{' '}
        {filtered.length === 1 ? t('walkthrough') : t('walkthroughs')}
        {category !== ALL_USE_CASES ? t(' in {p0}', { p0: category }) : ''}
        {query.trim() ? t(' matching “{p0}”', { p0: query.trim() }) : ''}
      </p>

      <div id={`${id}-results`} className={styles.gallery}>
        {shown.map((item) => (
          <article
            key={item.slug}
            id={onOpen ? item.slug : undefined}
            className={styles.card}
          >
            <a
              className={styles.cardLink}
              href={localizePath(`/use-cases#${item.slug}`, locale)}
              onClick={(event) => {
                if (
                  !onOpen ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return
                event.preventDefault()
                onOpen(item)
              }}
            >
              <Preview item={item} />
              <span className={styles.cardMeta}>
                <span>{t(item.category)}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.description)}</p>
              <span className={styles.cardAction}>
                <I18nText
                  source={'Watch walkthrough {p0}'}
                  values={{ p0: <span aria-hidden="true">↗</span> }}
                />
              </span>
            </a>
            {item.docsUrl && (
              <a
                className={styles.guide}
                href={localizePath(item.docsUrl, locale)}
                target="_blank"
                rel="noreferrer"
              >
                {t('Read the guide ')}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </article>
        ))}
      </div>
      {shown.length < filtered.length && (
        <div className={styles.more}>
          <Link href="/use-cases" className={styles.allLink}>
            {t('See all ')}
            {filtered.length} {t(' walkthroughs')}{' '}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Search size={24} aria-hidden="true" />
          <h3>{t('No matching walkthroughs')}</h3>
          <p>{t('Try a different task, like Excel, writing, or a website.')}</p>
          <button type="button" onClick={reset}>
            {t('Reset filters')}
          </button>
        </div>
      )}
    </div>
  )
}
