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
  const [failed, setFailed] = useState(false)
  return (
    <span className={styles.preview}>
      {failed ? (
        <span className={styles.previewFallback}>
          Enconvo · {item.category}
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
        <Play size={12} aria-hidden="true" /> Walkthrough
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
  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(ALL_USE_CASES)
  const [query, setQuery] = useState('')
  const categories = useCaseCategories(items)
  const filtered = filterUseCases(items, category, query)
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
          aria-label="Filter walkthroughs by category"
        >
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              aria-controls={`${id}-results`}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div
          className={styles.search}
          role="search"
          aria-label="Walkthrough search"
        >
          <Search size={17} aria-hidden="true" />
          <label htmlFor={`${id}-search`} className="sr-only">
            Search walkthroughs
          </label>
          <input
            ref={searchRef}
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find something to do…"
            aria-controls={`${id}-results`}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
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
        {shown.length < filtered.length ? `${shown.length} of ` : ''}
        {filtered.length}{' '}
        {filtered.length === 1 ? 'walkthrough' : 'walkthroughs'}
        {category !== ALL_USE_CASES ? ` in ${category}` : ''}
        {query.trim() ? ` matching “${query.trim()}”` : ''}
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
              href={`/use-cases#${item.slug}`}
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
                <span>{item.category}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className={styles.cardAction}>
                Watch walkthrough <span aria-hidden="true">↗</span>
              </span>
            </a>
            {item.docsUrl && (
              <a
                className={styles.guide}
                href={item.docsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Read the guide <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </article>
        ))}
      </div>
      {shown.length < filtered.length && (
        <div className={styles.more}>
          <Link href="/use-cases" className={styles.allLink}>
            See all {filtered.length} walkthroughs{' '}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Search size={24} aria-hidden="true" />
          <h3>No matching walkthroughs</h3>
          <p>Try a different task, like Excel, writing, or a website.</p>
          <button type="button" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
