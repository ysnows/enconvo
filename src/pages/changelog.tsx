import { I18nText } from '@/i18n/I18nText'
import { localizePath } from '@/i18n/locale'
import { withI18nProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import fs from 'fs/promises'
import path from 'path'
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import clsx from 'clsx'
import { Popover, Transition } from '@headlessui/react'
import { ArrowRight, ChevronDown, Download, Search, X } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { trackEvent } from '@/lib/analytics'

interface ReleaseSection {
  title: string
  lede: string
  items: string[]
}

interface Release {
  version: string
  date: string
  dateLabel: string
  shortDateLabel: string
  slug: string
  intro: string
  sections: ReleaseSection[]
  highlights: string[]
  itemCount: number
  searchText: string
}

interface BetaRelease extends Release {
  targetVersion: string
  betaNumber: number
}

interface ChangelogPageProps {
  releases: Release[]
  betas: BetaRelease[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-signal-blue underline decoration-signal-blue/35 underline-offset-[3px] transition-colors hover:decoration-signal-blue">$1</a>'
    )
    .replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold text-content">$1</strong>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-white/[0.08] px-[5px] py-px font-mono text-[0.88em] text-content">$1</code>'
    )
}

function plainText(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')
}

function formatDate(
  date: string,
  month: 'long' | 'short' = 'long',
  locale = 'en'
) {
  return new Intl.DateTimeFormat(locale, {
    month,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function slugForVersion(version: string) {
  return `v-${version}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanHeading(value: string) {
  return value.replace(/🚀/g, '').replace(/\s+/g, ' ').trim()
}

function isProseLine(trimmed: string) {
  if (!trimmed) {
    return false
  }

  return !/^(#|<|!|\||>|-{3,}|import\s)/.test(trimmed)
}

function parseChangelog(source: string): Release[] {
  const releases: Release[] = []
  let current: {
    version: string
    date: string
    introLines: string[]
    sections: ReleaseSection[]
    highlights: string[]
  } | null = null
  let currentSection: ReleaseSection | null = null
  let inHighlights = false
  let lastItems: string[] | null = null
  let inCodeBlock = false

  function pushCurrent() {
    if (!current) {
      return
    }

    const sections = current.sections.filter((section) => section.items.length)
    if (!sections.length && !current.highlights.length) {
      current = null
      currentSection = null
      return
    }

    const itemCount = sections.reduce(
      (total, section) => total + section.items.length,
      0
    )

    const intro = current.introLines.join(' ').replace(/\s+/g, ' ').trim()
    const dateLabel = formatDate(current.date)
    const searchText = plainText(
      [
        current.version,
        `v${current.version}`,
        current.date,
        dateLabel,
        intro,
        ...current.highlights,
        ...sections.flatMap((section) => [
          section.title,
          section.lede,
          ...section.items,
        ]),
      ].join('\n')
    ).toLowerCase()

    releases.push({
      version: current.version,
      date: current.date,
      dateLabel,
      shortDateLabel: formatDate(current.date, 'short'),
      slug: slugForVersion(current.version),
      intro,
      sections,
      highlights: current.highlights,
      itemCount,
      searchText,
    })

    current = null
    currentSection = null
  }

  function startRelease(version: string, date: string) {
    pushCurrent()
    current = {
      version,
      date,
      introLines: [],
      sections: [],
      highlights: [],
    }
    currentSection = null
    inHighlights = false
    lastItems = null
  }

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      lastItems = null
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const fullReleaseMatch = line.match(
      /^#\s+Enconvo\s+([^\s]+)\s+Changelog\s+\((\d{4}-\d{2}-\d{2})\)/i
    )
    const shortReleaseMatch = line.match(
      /^##\s+([0-9][\w.-]*)\s+\((\d{4}-\d{2}-\d{2})\)/
    )

    if (fullReleaseMatch || shortReleaseMatch) {
      const match = fullReleaseMatch || shortReleaseMatch
      startRelease(match![1], match![2])
      continue
    }

    const sectionMatch = line.match(/^#{2,4}\s+(.+)$/)
    if (current && sectionMatch) {
      const title = cleanHeading(sectionMatch[1])
      lastItems = null

      if (/^highlights$/i.test(title)) {
        inHighlights = true
        currentSection = null
      } else {
        inHighlights = false
        currentSection = {
          title,
          lede: '',
          items: [],
        }
        current.sections.push(currentSection)
      }
      continue
    }

    const itemMatch = line.match(/^\s*-\s+(.+)$/)
    if (current && itemMatch) {
      const item = cleanHeading(itemMatch[1])

      if (inHighlights) {
        current.highlights.push(item)
        lastItems = current.highlights
        continue
      }

      if (!currentSection) {
        currentSection = {
          title: 'Updates',
          lede: '',
          items: [],
        }
        current.sections.push(currentSection)
      }

      currentSection.items.push(item)
      lastItems = currentSection.items
      continue
    }

    // Wrapped bullet: an indented plain line continues the previous item.
    const continuationMatch = rawLine.match(/^\s{2,}(\S.*)$/)
    if (current && lastItems?.length && continuationMatch) {
      lastItems[lastItems.length - 1] += ` ${cleanHeading(
        continuationMatch[1]
      )}`
      continue
    }

    if (!trimmed) {
      lastItems = null
      continue
    }

    if (current && isProseLine(trimmed)) {
      if (!currentSection && !inHighlights) {
        current.introLines.push(trimmed)
      } else if (currentSection && !currentSection.items.length) {
        currentSection.lede = currentSection.lede
          ? `${currentSection.lede} ${trimmed}`
          : trimmed
      }
    }
  }

  pushCurrent()

  return releases
}

interface BetaIndexEntry {
  version: string
  beta: number
  file: string
  date: string
}

function parseBetaRelease(
  source: string,
  entry: BetaIndexEntry
): BetaRelease | null {
  const body = source
    .replace(/^#\s+[^\n]*\r?\n/, '')
    .split('\n')
    // Working beta files may carry in-progress percentage prefixes; the
    // published notes never show them (same rule as the Sparkle pipeline).
    .map((line) => line.replace(/^(\s*[-*]\s+)\[[0-9]+%\]\s+/, '$1'))
    .join('\n')

  const synthetic = `# Enconvo ${entry.version}-beta.${entry.beta} Changelog (${entry.date})\n\n${body}`
  const parsed = parseChangelog(synthetic)[0]
  if (!parsed) {
    return null
  }

  return {
    ...parsed,
    searchText:
      `${parsed.searchText}\nbeta ${entry.beta}\n${entry.version} beta ${entry.beta}`.toLowerCase(),
    targetVersion: entry.version,
    betaNumber: entry.beta,
  }
}

async function readChangelogSource() {
  const candidates = [
    path.join(process.cwd(), '..', 'mintlify-docs', 'changelog.mdx'),
    path.join(process.cwd(), 'src', 'data', 'changelog.mdx'),
  ]

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8')
    } catch {
      continue
    }
  }

  return ''
}

async function readBetaReleases(): Promise<BetaRelease[]> {
  const betaDir = path.join(process.cwd(), 'src', 'data', 'beta')

  let index: BetaIndexEntry[]
  try {
    index = JSON.parse(
      await fs.readFile(path.join(betaDir, 'index.json'), 'utf8')
    )
  } catch {
    return []
  }

  const betas: BetaRelease[] = []
  for (const entry of index) {
    try {
      const source = await fs.readFile(path.join(betaDir, entry.file), 'utf8')
      const parsed = parseBetaRelease(source, entry)
      if (parsed) {
        betas.push(parsed)
      }
    } catch {
      continue
    }
  }

  return betas
}

const DOWNLOAD_URL = 'https://api.enconvo.com/app/download'
// Fixed site nav height plus a little air, used for anchors and scroll targets.
const NAV_OFFSET = 88
const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]'

const CHANGE_VERB =
  /^(Added|Fixed|Resolved|Changed|Improved|Updated|Enhanced|Removed|Deprecated)\b/
// Section titles too generic to stand in as a release headline.
const GENERIC_SECTION =
  /^(new features?|features|improvements?|optimi[sz]ations?|optimi[sz]ed features?|bug ?fixes|fixes|others?|changes|enhancements?)$/i

type Channel = 'all' | 'stable' | 'beta'

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'stable', label: 'Stable' },
  { value: 'beta', label: 'Beta' },
]

interface Entry {
  kind: 'stable' | 'beta'
  id: string
  version: string
  build: number
  title: string
  label: string
  date: string
  dateLabel: string
  shortDateLabel: string
  intro: string
  highlights: string[]
  sections: ReleaseSection[]
  count: number
  searchText: string
  headline: string
  summary: string
  latest: boolean
  // Set on the newest build of a version that has no stable release yet.
  groupId: string | null
  buildCount: number
}

interface ChangelogData {
  stable: Entry[]
  builds: Entry[]
  heads: Entry[]
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

function clip(value: string, max: number) {
  if (value.length <= max) {
    return value
  }

  return `${value.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

function compareVersions(a: string, b: string) {
  const x = a.split('.').map(Number)
  const y = b.split('.').map(Number)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] || 0) - (y[i] || 0)
    if (diff) {
      return diff
    }
  }

  return 0
}

function boldLead(value: string) {
  const match = value.match(/^\*\*(.+?)\*\*/)
  return match ? match[1].replace(/[:：]\s*$/, '') : null
}

function headlineFor(release: Release, fallback: string) {
  const lead = release.highlights.length
    ? boldLead(release.highlights[0])
    : null
  if (lead) {
    return lead
  }

  for (const section of release.sections) {
    for (const item of section.items) {
      const itemLead = boldLead(item)
      if (itemLead) {
        return itemLead
      }
    }
  }

  const named = release.sections.find(
    (section) => !GENERIC_SECTION.test(section.title.trim())
  )
  if (named) {
    return plainText(named.title)
  }

  const first = release.sections[0]?.items[0]
  return first ? clip(plainText(first), 84) : fallback
}

function summaryFor(release: Release, headline: string) {
  if (release.highlights.length > 1) {
    const rest = release.highlights
      .slice(1)
      .map((highlight) => boldLead(highlight) || plainText(highlight))
    return (
      rest.slice(0, 2).join(' · ') +
      (rest.length > 2 ? ` · +${rest.length - 2} more` : '')
    )
  }

  return release.sections
    .flatMap((section) => section.items)
    .map(plainText)
    .filter((item) => !item.startsWith(headline))
    .slice(0, 3)
    .map((item) => clip(item, 90))
    .join(' · ')
}

function buildEntries(
  releases: Release[],
  betas: BetaRelease[]
): ChangelogData {
  function toEntry(
    release: Release,
    meta: Pick<Entry, 'kind' | 'id' | 'version' | 'build' | 'title' | 'label'>
  ): Entry {
    const headline = headlineFor(release, meta.title)
    return {
      ...meta,
      date: release.date,
      dateLabel: release.dateLabel,
      shortDateLabel: release.shortDateLabel,
      intro: release.intro,
      highlights: release.highlights,
      sections: release.sections,
      count: release.itemCount,
      searchText: release.searchText,
      headline,
      summary: summaryFor(release, headline),
      latest: false,
      groupId: null,
      buildCount: 0,
    }
  }

  const stable = releases.map((release) =>
    toEntry(release, {
      kind: 'stable',
      id: release.slug,
      version: release.version,
      build: 0,
      title: `Enconvo ${release.version}`,
      label: `v${release.version}`,
    })
  )
  if (stable[0]) {
    stable[0].latest = true
  }

  const builds = betas
    .map((beta) =>
      toEntry(beta, {
        kind: 'beta',
        id: beta.slug,
        version: beta.targetVersion,
        build: beta.betaNumber,
        title: `Enconvo ${beta.targetVersion} Beta ${beta.betaNumber}`,
        label: `v${beta.targetVersion} Beta ${beta.betaNumber}`,
      })
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        compareVersions(b.version, a.version) ||
        b.build - a.build
    )

  // In "All", a version still in beta shows only its newest build.
  const released = new Set(stable.map((entry) => entry.version))
  const heads: Entry[] = []
  for (const build of builds) {
    if (
      released.has(build.version) ||
      heads.some((head) => head.version === build.version)
    ) {
      continue
    }

    heads.push({
      ...build,
      groupId: slugForVersion(build.version),
      buildCount: builds.filter((item) => item.version === build.version)
        .length,
    })
  }

  return { stable, builds, heads }
}

function entriesFor(data: ChangelogData, channel: Channel, query: string) {
  if (channel === 'stable') {
    return data.stable
  }

  if (channel === 'beta') {
    return data.builds
  }

  if (query) {
    return [...data.stable, ...data.builds].sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.kind === b.kind ? 0 : a.kind === 'stable' ? -1 : 1)
    )
  }

  return [...data.heads, ...data.stable]
}

function includesQuery(value: string, query: string) {
  return plainText(value).toLowerCase().includes(query)
}

function narrowToQuery(entry: Entry, query: string): Entry | null {
  if (!query) {
    return entry
  }

  const meta = [
    entry.version,
    entry.label,
    entry.title,
    entry.date,
    entry.dateLabel,
    entry.shortDateLabel,
  ]
    .join(' | ')
    .toLowerCase()
  if (meta.includes(query)) {
    return entry
  }

  if (!entry.searchText.includes(query)) {
    return null
  }

  const intro =
    entry.intro && includesQuery(entry.intro, query) ? entry.intro : ''
  const highlights = entry.highlights.filter((highlight) =>
    includesQuery(highlight, query)
  )
  const sections = entry.sections
    .map((section) => {
      // A matching section heading keeps every change under it.
      const sectionHit = includesQuery(
        `${section.title} ${section.lede}`,
        query
      )
      return {
        ...section,
        items: sectionHit
          ? section.items
          : section.items.filter((item) => includesQuery(item, query)),
      }
    })
    .filter((section) => section.items.length)

  if (!intro && !highlights.length && !sections.length) {
    return null
  }

  return {
    ...entry,
    intro,
    highlights,
    sections,
    count: sections.reduce((total, section) => total + section.items.length, 0),
  }
}

function unescapeHtml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Wraps query hits in <mark>, touching only text between tags so links,
// attributes, and entities stay intact.
function markQuery(html: string, query: string) {
  if (!query) {
    return html
  }

  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        return part
      }

      return unescapeHtml(part)
        .split(pattern)
        .map((piece, index) =>
          index % 2
            ? `<mark class="rounded-[3px] bg-signal-yellow/[0.26] px-px text-content">${escapeHtml(
                piece
              )}</mark>`
            : escapeHtml(piece)
        )
        .join('')
    })
    .join('')
}

function richText(value: string, query: string) {
  return { __html: markQuery(formatInlineMarkdown(value), query) }
}

function changeItemHtml(item: string, query: string) {
  const verb = item.match(CHANGE_VERB)?.[1]
  if (!verb) {
    return richText(item, query)
  }

  return {
    __html: `<span class="font-medium text-content">${verb}</span>${markQuery(
      formatInlineMarkdown(item.slice(verb.length)),
      query
    )}`,
  }
}

function ReleaseTag({ tone }: { tone: 'latest' | 'beta' }) {
  const { t, locale } = useI18n()

  return (
    <span className="inline-flex items-center gap-[7px] whitespace-nowrap text-[12.5px] font-medium text-content-muted">
      <span
        aria-hidden="true"
        className={clsx(
          'h-1.5 w-1.5 rounded-full',
          tone === 'latest'
            ? 'bg-signal-green shadow-[0_0_0_3px_rgba(89,212,153,0.15)]'
            : 'bg-signal-yellow shadow-[0_0_0_3px_rgba(255,197,51,0.15)]'
        )}
      />
      {tone === 'latest' ? t('Latest') : t('Beta')}
    </span>
  )
}

function ReleaseNotes({ entry, query }: { entry: Entry; query: string }) {
  return (
    <div lang="en">
      {entry.intro && (
        <p
          className="mb-7 text-[16px] leading-[1.75] text-content-body [overflow-wrap:anywhere]"
          dangerouslySetInnerHTML={richText(entry.intro, query)}
        />
      )}
      {entry.highlights.length > 0 && (
        <div className="grid gap-[18px]">
          {entry.highlights.map((highlight, index) => (
            <p
              key={index}
              className="text-[16px] leading-[1.7] text-content-muted [overflow-wrap:anywhere]"
              dangerouslySetInnerHTML={richText(highlight, query)}
            />
          ))}
        </div>
      )}
      {entry.sections.length > 0 && (
        <div className="mt-2">
          {entry.sections.map((section, index) => (
            <section
              key={`${section.title}-${index}`}
              className="mt-8 first:mt-6"
            >
              <h3
                className="mb-3 text-[15px] font-semibold leading-[1.4] text-content"
                dangerouslySetInnerHTML={richText(section.title, query)}
              />
              {section.lede && (
                <p
                  className="-mt-1 mb-3 text-[14px] text-content-muted"
                  dangerouslySetInnerHTML={richText(section.lede, query)}
                />
              )}
              <ul className="grid gap-3">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="relative pl-5 text-[15px] leading-[1.7] text-content-body [overflow-wrap:anywhere] before:absolute before:left-[5px] before:top-[0.78em] before:h-1 before:w-1 before:rounded-full before:bg-content-ash"
                    dangerouslySetInnerHTML={changeItemHtml(item, query)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function ReleaseEntry({
  entry,
  query,
  open,
  onToggle,
  onShowBetas,
}: {
  entry: Entry
  query: string
  open: boolean
  onToggle: () => void
  onShowBetas: () => void
}) {
  const { t, locale } = useI18n()

  const anchor = entry.groupId ?? entry.id
  const notesId = `notes-${entry.id}`
  const titleClass =
    'text-[23px] font-medium leading-[1.22] text-content [overflow-wrap:anywhere] [text-wrap:balance] sm:text-[28px]'

  return (
    <article
      id={anchor}
      className="group relative grid scroll-mt-[88px] md:grid-cols-[148px_minmax(0,640px)] md:gap-x-12 lg:grid-cols-[176px_minmax(0,640px)] lg:gap-x-[72px]"
    >
      {anchor !== entry.id && <span id={entry.id} className="sr-only" />}
      <div className="border-t border-white/[0.06] group-first:border-t-0 md:border-l md:border-t-0 md:border-hairline md:group-last:[border-image:linear-gradient(#242728,transparent)_1]">
        <a
          href={localizePath(`#${anchor}`, locale)}
          className="md:before:duration-[450ms] relative block pt-[26px] text-[13.5px] tabular-nums text-content-muted transition-colors duration-300 md:pl-5 md:pt-[37px] md:text-content-body md:before:absolute md:before:left-0 md:before:top-[calc(37px+0.72em)] md:before:h-px md:before:w-2.5 md:before:bg-white/[0.16] md:before:transition-all md:group-hover:text-content md:group-hover:before:w-[15px] md:group-hover:before:bg-content"
        >
          <time dateTime={entry.date}>
            {formatDate(entry.date, 'short', locale)}
          </time>
        </a>
      </div>

      <div className="pb-[52px] pt-2 md:pt-[34px]">
        <div className="mb-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13.5px] text-content-muted">
          <span
            dangerouslySetInnerHTML={{
              __html: markQuery(escapeHtml(entry.title), query),
            }}
          />
          {entry.latest ? (
            <ReleaseTag tone="latest" />
          ) : entry.kind === 'beta' ? (
            <ReleaseTag tone="beta" />
          ) : null}
        </div>

        {query ? (
          <>
            <h2
              className={titleClass}
              dangerouslySetInnerHTML={{
                __html: markQuery(escapeHtml(entry.headline), query),
              }}
            />
            <div className="mt-[22px]">
              <ReleaseNotes entry={entry} query={query} />
            </div>
          </>
        ) : (
          <>
            <h2 className={titleClass}>
              <button
                type="button"
                aria-controls={notesId}
                aria-expanded={open}
                onClick={onToggle}
                className="duration-[250ms] text-left transition-colors hover:text-white"
              >
                {entry.headline}
              </button>
            </h2>
            {entry.summary && (
              <p className="mt-3 line-clamp-2 text-[15.5px] leading-[1.6] text-content-muted [overflow-wrap:anywhere]">
                {t(entry.summary)}
              </p>
            )}
            <div className="mt-[18px] flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[14px]">
              <button
                type="button"
                aria-controls={notesId}
                aria-expanded={open}
                onClick={onToggle}
                className="inline-flex items-center gap-1.5 font-medium text-content"
              >
                {open ? t('Hide the notes') : t('Read the notes')}
                <ChevronDown
                  aria-hidden="true"
                  className={clsx(
                    'duration-[550ms] h-3.5 w-3.5 flex-none text-content-muted transition-transform',
                    EASE,
                    open && 'rotate-180'
                  )}
                />
              </button>
              <span className="tabular-nums text-content-ash">
                {entry.count
                  ? plural(entry.count, 'change')
                  : plural(entry.highlights.length, 'highlight')}
              </span>
              {entry.groupId && (
                <button
                  type="button"
                  onClick={onShowBetas}
                  className="text-signal-blue underline-offset-[3px] hover:underline"
                >
                  {t('All ')}
                  {entry.buildCount} {t(' beta builds')}
                </button>
              )}
            </div>
            <div
              id={notesId}
              className="cl-fold"
              data-open={open ? '' : undefined}
            >
              {/* React 18 has no inert prop; an empty string sets the attribute. */}
              <div {...(open ? {} : ({ inert: '' } as Record<string, string>))}>
                <div className="pt-[30px]">
                  <ReleaseNotes entry={entry} query="" />
                  <button
                    type="button"
                    aria-controls={notesId}
                    onClick={onToggle}
                    className="duration-[250ms] mt-7 text-[14px] text-content-muted transition-colors hover:text-content"
                  >
                    {t('Hide the notes')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function GuideStep({ step, children }: { step: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-white/[0.07] text-[11.5px] font-semibold tabular-nums text-content-body"
      >
        {step}
      </span>
      <div className="min-w-0 flex-1 text-[14px] leading-[1.5] text-content-body">
        {children}
      </div>
    </li>
  )
}

// Betas ship through the app's own updater, so the page explains where to
// switch the channel instead of linking a separate download.
function BetaGuide({ entry }: { entry: Entry }) {
  const { t, locale } = useI18n()

  const build = `${entry.version} Beta ${entry.build}`
  const strong = 'font-medium text-content'
  return (
    <Popover className="sm:relative">
      {({ open }) => (
        <>
          <Popover.Button
            onClick={() => {
              if (!open) {
                trackEvent('beta_guide_open', {
                  build: `${entry.version}-beta.${entry.build}`,
                  placement: 'changelog',
                })
              }
            }}
            className={clsx(
              'group inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-5 text-[15px] font-medium transition-colors duration-300',
              open
                ? 'border-white/20 bg-white/[0.08] text-content'
                : 'border-hairline bg-white/[0.04] text-content-body hover:border-white/20 hover:bg-white/[0.07] hover:text-content'
            )}
          >
            {t('Try the ')}
            {entry.version} {t(' beta')}
            <ArrowRight
              aria-hidden="true"
              className={clsx(
                'duration-[450ms] h-4 w-4 transition-transform',
                EASE,
                open ? 'rotate-90' : 'group-hover:translate-x-[3px]'
              )}
            />
          </Popover.Button>
          <Transition
            as={Fragment}
            enter={clsx('transition duration-300', EASE)}
            enterFrom="opacity-0 -translate-y-1 scale-[0.98]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0 -translate-y-0.5"
          >
            <Popover.Panel className="absolute left-0 top-full z-30 mt-3 w-[min(372px,calc(100vw-32px))] origin-top-left rounded-[18px] border border-white/10 bg-[#0d0f12] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
              <p className="flex items-center gap-2 text-[12.5px] font-medium text-signal-yellow">
                <I18nText
                  source={'{p0} Beta channel'}
                  values={{
                    p0: (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-signal-yellow"
                      />
                    ),
                  }}
                />
              </p>
              <h2 className="mt-2 text-[17px] font-semibold leading-snug text-content">
                {t('Get Enconvo ')}
                {build}
              </h2>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-content-muted">
                {t(
                  'Betas arrive through Enconvo’s own updates. Switch the update channel in the app once:'
                )}
              </p>
              <ol className="mt-4 space-y-3.5">
                <GuideStep step={1}>
                  {t('Click the Enconvo icon in the menu bar and choose')}{' '}
                  <strong className={strong}>{t('Settings')}</strong>.
                </GuideStep>
                <GuideStep step={2}>
                  {t('Open ')}
                  <strong className={strong}>{t('General')}</strong>
                  {t('. Under')}{' '}
                  <strong className={strong}>{t('Updates')}</strong>
                  {t(', set')}{' '}
                  <strong className={strong}>{t('Update Channel')}</strong>{' '}
                  {t(' to')} <strong className={strong}>{t('Beta')}</strong>.
                  <span
                    aria-hidden="true"
                    className="mt-2.5 flex items-center justify-between rounded-[10px] border border-white/[0.08] bg-white/[0.03] py-[7px] pl-3 pr-2 text-[13px]"
                  >
                    <span className="text-content-body">
                      {t('Update Channel')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] py-0.5 pl-2.5 pr-1.5 text-content">
                      {t('Beta')}
                      <ChevronDown className="h-3.5 w-3.5 text-content-muted" />
                    </span>
                  </span>
                </GuideStep>
                <GuideStep step={3}>
                  {t('From the menu bar icon again, choose')}{' '}
                  <strong className={strong}>{t('Check for Updates')}</strong>{' '}
                  {t(' to install ')}
                  {build}.
                </GuideStep>
              </ol>
              <p className="mt-5 border-t border-white/[0.07] pt-4 text-[13px] leading-[1.55] text-content-ash">
                <I18nText
                  source={
                    'New to Enconvo? {p0} . To leave the beta, set the channel back to Production.'
                  }
                  values={{
                    p0: (
                      <a
                        href={localizePath(DOWNLOAD_URL, locale)}
                        onClick={() =>
                          trackEvent('download_click', {
                            arch: 'auto',
                            placement: 'changelog_beta_guide',
                          })
                        }
                        className="duration-[250ms] text-content-body underline decoration-white/25 underline-offset-[3px] transition-[text-decoration-color] hover:decoration-content-body"
                      >
                        {t('Download it first')}
                      </a>
                    ),
                  }}
                />
              </p>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

// Kept in its own component so styled-jsx does not tag the page's elements.
function ChangelogStyles() {
  return (
    <style jsx global>
      {`
        .cl-page {
          --cl-ease: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cl-page :focus-visible {
          outline: 2px solid #57c1ff;
          outline-offset: 3px;
          border-radius: 4px;
        }
        .cl-page input:focus-visible {
          outline: none;
        }
        .cl-rise {
          animation: cl-rise 0.9s var(--cl-ease) both;
        }
        @keyframes cl-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
        }
        .cl-glow {
          background: radial-gradient(
              42% 58% at 24% 26%,
              rgba(87, 193, 255, 0.12),
              transparent 72%
            ),
            radial-gradient(
              30% 40% at 62% 6%,
              rgba(89, 212, 153, 0.055),
              transparent 70%
            );
        }
        .cl-pill[data-ready] {
          transition: transform 0.5s var(--cl-ease), width 0.5s var(--cl-ease);
        }
        /* Height animates through grid rows, so content never jumps. */
        .cl-fold {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.6s var(--cl-ease);
        }
        .cl-fold[data-open] {
          grid-template-rows: 1fr;
        }
        .cl-fold > div {
          min-height: 0;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-6px);
          transition: opacity 0.25s ease, transform 0.6s var(--cl-ease);
        }
        .cl-fold[data-open] > div {
          opacity: 1;
          transform: none;
          transition: opacity 0.5s ease 0.08s, transform 0.6s var(--cl-ease);
        }
        .cl-page article[data-reveal='wait'] {
          opacity: 0;
          transform: translateY(22px);
        }
        .cl-page article[data-reveal='in'] {
          opacity: 1;
          transform: none;
          transition: opacity 0.9s var(--cl-ease), transform 0.9s var(--cl-ease);
        }
        ::view-transition-group(*) {
          animation-duration: 0.5s;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 0.32s;
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-page *,
          .cl-page *::before,
          .cl-page *::after {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0.01ms !important;
            transition-delay: 0ms !important;
          }
          .cl-page article[data-reveal] {
            opacity: 1;
            transform: none;
          }
        }
      `}
    </style>
  )
}

export default function ChangelogPage({ releases, betas }: ChangelogPageProps) {
  const { t, locale } = useI18n()

  const data = useMemo(() => buildEntries(releases, betas), [releases, betas])
  const latest = data.stable[0]
  const oldest = data.stable[data.stable.length - 1]
  // Only a version newer than the latest stable release is still in beta.
  const betaHead =
    latest &&
    data.heads[0] &&
    compareVersions(data.heads[0].version, latest.version) > 0
      ? data.heads[0]
      : null

  const [channel, setChannel] = useState<Channel>('all')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => new Set())

  const controlsRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Record<Channel, HTMLButtonElement | null>>({
    all: null,
    stable: null,
    beta: null,
  })
  const channelRef = useRef(channel)
  const queryRef = useRef('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const revealStartedRef = useRef(false)
  const staggerRef = useRef(false)
  const pendingHashRef = useRef<string | null>(null)
  channelRef.current = channel

  const shown = useMemo(
    () =>
      entriesFor(data, channel, query)
        .map((entry) => narrowToQuery(entry, query))
        .filter((entry): entry is Entry => entry !== null),
    [data, channel, query]
  )
  const matchCount = shown.reduce(
    (total, entry) =>
      total + entry.count + entry.highlights.length + (entry.intro ? 1 : 0),
    0
  )

  const applyQuery = useCallback((value: string) => {
    const next = value.trim().toLowerCase()
    if (next === queryRef.current) {
      return
    }

    queryRef.current = next
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => unknown
    }
    if (
      doc.startViewTransition &&
      !prefersReducedMotion() &&
      !document.hidden
    ) {
      doc.startViewTransition(() => flushSync(() => setQuery(next)))
    } else {
      setQuery(next)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => applyQuery(input), 140)
    return () => window.clearTimeout(timer)
  }, [input, applyQuery])

  function clearSearch(focus: boolean) {
    setInput('')
    applyQuery('')
    if (focus) {
      searchRef.current?.focus()
    }
  }

  function selectChannel(next: Channel) {
    if (next === channel) {
      return
    }

    staggerRef.current = true
    setChannel(next)
  }

  function onTabsKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0
    if (!step) {
      return
    }

    event.preventDefault()
    const index = CHANNELS.findIndex((item) => item.value === channel)
    const next =
      CHANNELS[(index + step + CHANNELS.length) % CHANNELS.length].value
    selectChannel(next)
    tabRefs.current[next]?.focus()
  }

  function toggleNotes(entry: Entry) {
    const closing = openNotes.has(entry.id)
    setOpenNotes((current) => {
      const next = new Set(current)
      if (closing) {
        next.delete(entry.id)
      } else {
        next.add(entry.id)
      }
      return next
    })

    // Closing a long note from far below would leave the reader stranded.
    const article = document.getElementById(entry.groupId ?? entry.id)
    if (closing && article) {
      const top = article.getBoundingClientRect().top
      if (top < NAV_OFFSET) {
        window.scrollTo({
          top: window.scrollY + top - NAV_OFFSET,
          behavior: prefersReducedMotion()
            ? ('instant' as ScrollBehavior)
            : 'smooth',
        })
      }
    }
  }

  const placePill = useCallback((animate: boolean) => {
    const pill = pillRef.current
    const tab = tabRefs.current[channelRef.current]
    if (!pill || !tab) {
      return
    }

    if (!animate) {
      pill.removeAttribute('data-ready')
    }
    pill.style.width = `${tab.offsetWidth}px`
    pill.style.transform = `translateX(${tab.offsetLeft}px)`
    pill.style.opacity = '1'
    if (!animate) {
      void pill.offsetWidth
      pill.setAttribute('data-ready', '')
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    placePill(pillRef.current?.hasAttribute('data-ready') ?? false)
  }, [channel, placePill])

  useEffect(() => {
    const place = () => placePill(false)
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [placePill])

  const feedArticles = useCallback(
    () =>
      Array.from(
        feedRef.current?.querySelectorAll<HTMLElement>(':scope > article') ?? []
      ),
    []
  )

  const settleReveal = useCallback(() => {
    observerRef.current?.disconnect()
    for (const article of feedArticles()) {
      article.removeAttribute('data-reveal')
      article.style.transitionDelay = ''
    }
  }, [feedArticles])

  const landOn = useCallback(
    (id: string) => {
      const target = document.getElementById(id)
      if (!target) {
        return
      }

      settleReveal()
      const article = target.closest('article') ?? target
      article.scrollIntoView({
        block: 'start',
        behavior: 'instant' as ScrollBehavior,
      })
    },
    [settleReveal]
  )

  // Progressive enhancement: server-rendered entries are always visible.
  // Script only hides entries below the fold and lets them rise in on scroll.
  useIsomorphicLayoutEffect(() => {
    const feed = feedRef.current
    if (!feed) {
      return
    }

    const pending = pendingHashRef.current
    if (pending) {
      pendingHashRef.current = null
      staggerRef.current = false
      revealStartedRef.current = true
      landOn(pending)
      return
    }

    const firstRun = !revealStartedRef.current
    const stagger = staggerRef.current
    revealStartedRef.current = true
    staggerRef.current = false

    if (stagger && controlsRef.current) {
      const top =
        controlsRef.current.getBoundingClientRect().top +
        window.scrollY -
        NAV_OFFSET
      if (window.scrollY > top) {
        window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
      }
    }

    if (
      (!firstRun && !stagger) ||
      prefersReducedMotion() ||
      !('IntersectionObserver' in window)
    ) {
      settleReveal()
      return
    }

    observerRef.current?.disconnect()
    const observer =
      observerRef.current ??
      new IntersectionObserver(
        (records) => {
          let order = 0
          for (const record of records) {
            if (!record.isIntersecting) {
              continue
            }

            const article = record.target as HTMLElement
            article.style.transitionDelay = `${Math.min(order++, 3) * 90}ms`
            article.dataset.reveal = 'in'
            observer.unobserve(article)
          }
        },
        { rootMargin: '0px 0px -6% 0px' }
      )
    observerRef.current = observer

    const fold = window.innerHeight * 0.94
    const rising: HTMLElement[] = []
    for (const article of feedArticles()) {
      const top = article.getBoundingClientRect().top
      if (top >= fold) {
        article.style.transitionDelay = ''
        article.dataset.reveal = 'wait'
        observer.observe(article)
      } else if (stagger && top > -article.offsetHeight) {
        article.style.transitionDelay = ''
        article.dataset.reveal = 'wait'
        rising.push(article)
      } else {
        article.removeAttribute('data-reveal')
      }
    }

    if (rising.length) {
      void feed.offsetHeight
      rising.forEach((article, index) => {
        article.style.transitionDelay = `${Math.min(index, 3) * 90}ms`
        article.dataset.reveal = 'in'
      })
    }
  }, [channel, query, feedArticles, landOn, settleReveal])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  // Deep links keep the existing slugs: #v-2-5-5, #v-2-5-6 (still in beta),
  // and #v-2-5-6-beta-3 (a single build).
  useEffect(() => {
    function follow(initial: boolean) {
      let id = ''
      try {
        id = decodeURIComponent(window.location.hash.slice(1))
      } catch {
        return
      }
      if (!id) {
        return
      }

      // A shared link should show its notes, not just the headline.
      const noteId = data.heads.find((entry) => entry.groupId === id)?.id ?? id
      setOpenNotes((current) =>
        current.has(noteId) ? current : new Set(current).add(noteId)
      )

      if (document.getElementById(id)) {
        if (initial) {
          landOn(id)
        }
        return
      }

      const target: Channel | null = data.builds.some(
        (entry) => entry.id === id
      )
        ? 'beta'
        : data.stable.some((entry) => entry.id === id) ||
          data.heads.some((entry) => entry.groupId === id)
        ? 'all'
        : null
      if (!target || (target === channelRef.current && !queryRef.current)) {
        return
      }

      // The next render shows the entry; the reveal effect then lands on it.
      pendingHashRef.current = id
      setInput('')
      queryRef.current = ''
      setQuery('')
      setChannel(target)
    }

    follow(true)
    const onHashChange = () => follow(false)
    // Fonts and late layout can move the target, so land on it again once loaded.
    const onLoad = () => {
      if (window.scrollY < 40) {
        follow(true)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('load', onLoad)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('load', onLoad)
    }
  }, [data, landOn])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const active = document.activeElement as HTMLElement | null
      if (
        active &&
        (/^(input|textarea|select)$/i.test(active.tagName) ||
          active.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      if (window.scrollY > 200) {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion()
            ? ('instant' as ScrollBehavior)
            : 'smooth',
        })
      }
      searchRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Head>
        <title>{t('Enconvo Releases - Changelog')}</title>
        <link
          rel="canonical"
          href={canonicalUrl('/changelog', locale)}
          key="canonical"
        />
        <meta
          name="description"
          content={t(
            'Read the latest Enconvo release notes, beta build updates, product improvements, and fixes.'
          )}
        />
      </Head>
      <div className="cl-page min-h-screen overflow-x-clip bg-canvas text-content">
        <SiteNav />

        <main className="mx-auto max-w-[1120px] px-4 sm:px-8">
          <header className="relative isolate z-10 pt-32 [view-transition-name:cl-head] sm:pt-40">
            <div
              aria-hidden="true"
              className="cl-glow pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[640px] w-screen -translate-x-1/2"
            />
            <div className="cl-rise">
              {betaHead?.groupId && (
                <a
                  href={localizePath(`#${betaHead.groupId}`, locale)}
                  className="group inline-flex h-[34px] max-w-full items-center gap-2.5 rounded-full border border-hairline bg-white/[0.03] pl-1 pr-3 text-[13.5px] text-content-body transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <span className="inline-flex h-[26px] flex-none items-center gap-[7px] whitespace-nowrap rounded-full bg-signal-yellow/10 px-2.5 text-[12.5px] font-semibold text-signal-yellow">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-signal-yellow"
                    />
                    {betaHead.version} {t(' Beta ')}
                    {betaHead.build}
                  </span>
                  <span className="min-w-0 truncate">{betaHead.headline}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className={clsx(
                      'duration-[450ms] h-3.5 w-3.5 flex-none text-content-muted transition-transform group-hover:translate-x-[3px]',
                      EASE
                    )}
                  />
                </a>
              )}
              <h1
                className={clsx(
                  'text-[44px] font-semibold leading-[1.04] tracking-[-0.028em] text-content [text-wrap:balance] sm:text-[64px]',
                  betaHead && 'mt-[26px]'
                )}
              >
                {t('What’s new in Enconvo')}
              </h1>
              <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.6] text-content-muted sm:text-[16.5px]">
                <I18nText
                  source={
                    'New features, improvements, and fixes in every release{p0} .'
                  }
                  values={{
                    p0: oldest
                      ? t(' since Enconvo {p0}', {
                          p0: oldest.version.split('.').slice(0, 2).join('.'),
                        })
                      : '',
                  }}
                />
              </p>
            </div>

            {latest && (
              // z-20 keeps the beta guide above the controls, which are a later stacking context.
              <div className="cl-rise relative z-20 mt-8 [animation-delay:60ms]">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={localizePath(DOWNLOAD_URL, locale)}
                    onClick={() =>
                      trackEvent('download_click', {
                        arch: 'auto',
                        placement: 'changelog',
                      })
                    }
                    className="inline-flex h-11 items-center gap-2.5 whitespace-nowrap rounded-full bg-content pl-[18px] pr-5 text-[15px] font-semibold text-canvas transition-[background-color,transform] duration-300 hover:bg-white active:scale-[0.97]"
                  >
                    <Download
                      aria-hidden="true"
                      strokeWidth={2.2}
                      className="h-4 w-4"
                    />
                    {t('Download for macOS')}
                  </a>
                  {betaHead && <BetaGuide entry={betaHead} />}
                </div>
                <p className="mt-3.5 text-[13.5px] tabular-nums text-content-ash">
                  <I18nText
                    source={'Version {p0} · macOS 12 or later'}
                    values={{ p0: latest.version }}
                  />
                </p>
              </div>
            )}

            <div
              ref={controlsRef}
              className="cl-rise mt-11 flex flex-wrap items-center gap-4 [animation-delay:100ms] sm:mt-16 sm:flex-nowrap"
            >
              <div
                role="radiogroup"
                aria-label={t('Release channel')}
                onKeyDown={onTabsKeyDown}
                className="relative flex items-center gap-0.5"
              >
                <span
                  ref={pillRef}
                  aria-hidden="true"
                  className="cl-pill pointer-events-none absolute left-0 top-0 h-8 rounded-full bg-white/10 opacity-0"
                />
                {CHANNELS.map((item) => {
                  const checked = item.value === channel
                  return (
                    <button
                      key={item.value}
                      ref={(node) => {
                        tabRefs.current[item.value] = node
                      }}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      onClick={() => selectChannel(item.value)}
                      className={clsx(
                        'relative z-10 h-8 whitespace-nowrap rounded-full px-3.5 text-[14.5px] font-medium transition-colors duration-300',
                        checked
                          ? 'text-content'
                          : 'text-content-muted hover:text-content'
                      )}
                    >
                      {t(item.label)}
                    </button>
                  )
                })}
              </div>

              <div
                className={clsx(
                  'relative ml-auto transition-[width] duration-500 max-sm:order-first max-sm:ml-0 max-sm:!w-full',
                  EASE,
                  input ? 'w-[320px]' : 'w-[240px] focus-within:w-[320px]'
                )}
              >
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-content-ash"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      clearSearch(false)
                      event.currentTarget.blur()
                    }
                  }}
                  placeholder={t('Search releases')}
                  aria-label={t('Search releases')}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-[38px] w-full rounded-full border border-hairline bg-white/[0.025] px-[38px] text-[14px] text-content outline-none transition-colors duration-300 placeholder:text-content-ash focus:border-white/[0.22] focus:bg-white/5 [&::-webkit-search-cancel-button]:hidden"
                />
                {input ? (
                  <button
                    type="button"
                    aria-label={t('Clear search')}
                    onClick={() => clearSearch(true)}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-content-muted transition-colors hover:bg-white/[0.08] hover:text-content"
                  >
                    <X aria-hidden="true" className="h-[13px] w-[13px]" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[5px] border border-hairline px-1.5 font-mono text-[11.5px] leading-[18px] text-content-ash [@media(hover:none)]:hidden">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </header>

          <div aria-live="polite">
            {query &&
              (shown.length ? (
                <p className="mt-9 text-[14px] text-content-muted">
                  <b className="font-semibold text-content">
                    {t(plural(matchCount, 'match', 'matches'))}
                  </b>{' '}
                  {t('in ')}
                  {t(plural(shown.length, 'release'))} {t(' for “')}
                  {query}” ·{' '}
                  <button
                    type="button"
                    onClick={() => clearSearch(true)}
                    className="text-signal-blue underline-offset-[3px] hover:underline"
                  >
                    {t('Clear')}
                  </button>
                </p>
              ) : (
                <div className="py-24 text-center">
                  <h2 className="text-[22px] font-semibold text-content">
                    <I18nText
                      source={'No results for “{p0}”'}
                      values={{ p0: query }}
                    />
                  </h2>
                  <p className="mt-2.5 text-content-muted">
                    {t(
                      'Try a feature like “Dynamic Island”, or a version like'
                    )}{' '}
                    {latest?.version ?? '2.5.5'}.{' '}
                    <button
                      type="button"
                      onClick={() => clearSearch(true)}
                      className="text-signal-blue underline-offset-[3px] hover:underline"
                    >
                      {t('Clear search')}
                    </button>
                  </p>
                </div>
              ))}
          </div>

          <div
            ref={feedRef}
            className="cl-rise pb-[120px] pt-4 [animation-delay:200ms] md:pt-10"
          >
            {shown.map((entry) => (
              <ReleaseEntry
                key={entry.groupId ?? entry.id}
                entry={entry}
                query={query}
                open={openNotes.has(entry.id)}
                onToggle={() => toggleNotes(entry)}
                onShowBetas={() => selectChannel('beta')}
              />
            ))}
          </div>
        </main>

        <Footer />
      </div>
      <ChangelogStyles />
    </>
  )
}

export const getStaticProps: GetStaticProps<ChangelogPageProps> = withI18nProps(
  async () => {
    const changelog = await readChangelogSource()
    const betas = await readBetaReleases()

    return {
      props: {
        releases: parseChangelog(changelog),
        betas,
      },
    }
  },
  '/changelog'
)
