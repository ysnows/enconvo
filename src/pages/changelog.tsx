import fs from 'fs/promises'
import path from 'path'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'

import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import mainVisual from '@/images/main.jpg'
import appScreenshot from '@/images/screenshots/app-screenshot.png'

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
      '<a href="$2" target="_blank" rel="noreferrer" class="font-semibold text-cyan-200 underline decoration-cyan-200/30 underline-offset-4 hover:text-white">$1</a>'
    )
    .replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-100">$1</code>'
    )
}

function FormattedText({ text }: { text: string }) {
  return (
    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
  )
}

function plainText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
}

function formatDate(date: string, month: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat('en', {
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
  return value
    .replace(/🚀/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
    searchText: `${parsed.searchText}\nbeta ${entry.beta}\n${entry.version} beta ${entry.beta}`.toLowerCase(),
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

function CrystalShard({
  className,
  points,
}: {
  className: string
  points: string
}) {
  return (
    <div
      className={className}
      style={{ clipPath: `polygon(${points})` }}
      aria-hidden="true"
    />
  )
}

const sectionAccentClasses = [
  {
    marker: 'bg-cyan-200',
    bar: 'from-cyan-200/80 via-cyan-200/30 to-transparent',
    title: 'text-cyan-50',
  },
  {
    marker: 'bg-amber-200',
    bar: 'from-amber-200/80 via-amber-200/30 to-transparent',
    title: 'text-amber-50',
  },
  {
    marker: 'bg-emerald-200',
    bar: 'from-emerald-200/80 via-emerald-200/30 to-transparent',
    title: 'text-emerald-50',
  },
  {
    marker: 'bg-[#ff6161]',
    bar: 'from-[#ff6161]/80 via-[#ff6161]/30 to-transparent',
    title: 'text-rose-50',
  },
]

const verbBadgeClasses: Record<string, string> = {
  Added: 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100',
  Fixed: 'border-cyan-200/25 bg-cyan-200/10 text-cyan-100',
  Resolved: 'border-cyan-200/25 bg-cyan-200/10 text-cyan-100',
  Changed: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  Improved: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  Updated: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  Enhanced: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  Removed: 'border-[#ff6161]/25 bg-[#ff6161]/10 text-rose-100',
  Deprecated: 'border-[#ff6161]/25 bg-[#ff6161]/10 text-rose-100',
}

function splitChangeVerb(item: string): { verb: string | null; rest: string } {
  const match = item.match(
    /^(Added|Fixed|Resolved|Changed|Improved|Updated|Enhanced|Removed|Deprecated)\b[:,]?\s+(.+)$/
  )

  if (!match) {
    return { verb: null, rest: item }
  }

  return { verb: match[1], rest: match[2] }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-white/15 border-l pl-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
    </div>
  )
}

function BetaBadge({ label }: { label: string }) {
  return (
    <span className="w-fit shrink-0 rounded-md border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
      {label}
    </span>
  )
}

function ReleaseBody({ release }: { release: Release }) {
  return (
    <>
      {release.intro && (
        <p className="max-w-3xl pb-6 text-[15px] leading-7 text-[#9c9c9d]">
          <FormattedText text={release.intro} />
        </p>
      )}

      {release.highlights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {release.highlights.map((highlight) => (
            <div
              key={highlight}
              className="border-l border-[#ffc533]/50 bg-[#0d0d0d] px-4 py-3 text-sm leading-6 text-[#cdcdcd]"
            >
              <FormattedText text={highlight} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2 first:mt-0">
        {release.sections.map((section, sectionIndex) => {
          const accent =
            sectionAccentClasses[sectionIndex % sectionAccentClasses.length]

          return (
            <section
              key={`${release.slug}-${section.title}`}
              className="rounded-lg border border-[#242728] bg-[#121212] p-4 transition hover:border-white/20 hover:bg-[#101111]"
            >
              <div
                className={`mb-4 h-0.5 w-16 bg-gradient-to-r ${accent.bar}`}
              />
              <h3 className={`text-base font-semibold ${accent.title}`}>
                {section.title}
              </h3>
              {section.lede && (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  <FormattedText text={section.lede} />
                </p>
              )}
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {section.items.map((item, itemIndex) => {
                  const { verb, rest } = splitChangeVerb(item)

                  return (
                    <li
                      key={`${section.title}-${itemIndex}`}
                      className="flex gap-3"
                    >
                      {verb ? (
                        <span
                          className={`mt-0.5 inline-flex h-fit shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${verbBadgeClasses[verb]}`}
                        >
                          {verb}
                        </span>
                      ) : (
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-sm ${accent.marker}`}
                        />
                      )}
                      <span>
                        <FormattedText text={verb ? rest : item} />
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}

function BetaRow({
  beta,
  expanded,
  onToggle,
}: {
  beta: BetaRelease
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      id={beta.slug}
      className="scroll-mt-28 rounded-lg border border-[#242728] bg-[#0d0d0d] transition hover:border-white/20"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronRight
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
        <span className="shrink-0 font-semibold text-white">
          Beta {beta.betaNumber}
        </span>
        <time
          dateTime={beta.date}
          className="shrink-0 text-xs uppercase tracking-[0.14em] text-slate-500"
        >
          {beta.shortDateLabel}
        </time>
        {!expanded && beta.intro && (
          <span className="hidden min-w-0 flex-1 truncate text-sm text-slate-500 sm:block">
            {plainText(beta.intro)}
          </span>
        )}
        <a
          href={`#${beta.slug}`}
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            window.history.replaceState(null, '', `#${beta.slug}`)
          }}
          aria-label={`Link to Beta ${beta.betaNumber}`}
          className="ml-auto shrink-0 text-slate-600 transition hover:text-white"
        >
          #
        </a>
      </button>
      {expanded && (
        <div className="border-t border-[#242728] px-4 pb-6 pt-5 sm:px-5">
          <ReleaseBody release={beta} />
        </div>
      )}
    </div>
  )
}

function scrollToRelease(slug: string) {
  const target = document.getElementById(slug)
  if (!target) {
    return
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${slug}`)
}

function narrowToQuery<T extends Release>(release: T, query: string): T | null {
  if (!release.searchText.includes(query)) {
    return null
  }

  const metaMatch =
    `v${release.version}`.toLowerCase().includes(query) ||
    release.date.includes(query) ||
    release.dateLabel.toLowerCase().includes(query)

  if (metaMatch) {
    return release
  }

  const highlights = release.highlights.filter((highlight) =>
    plainText(highlight).toLowerCase().includes(query)
  )
  const sections = release.sections
    .map((section) => {
      if (
        plainText(`${section.title} ${section.lede}`)
          .toLowerCase()
          .includes(query)
      ) {
        return section
      }

      return {
        ...section,
        items: section.items.filter((item) =>
          plainText(item).toLowerCase().includes(query)
        ),
      }
    })
    .filter((section) => section.items.length)

  if (!highlights.length && !sections.length) {
    return release
  }

  return { ...release, highlights, sections }
}

interface InBetaGroup {
  version: string
  slug: string
  betas: BetaRelease[]
}

export default function ChangelogPage({
  releases,
  betas,
}: ChangelogPageProps) {
  const latest = releases[0]
  const firstRelease = releases[releases.length - 1]
  const totalItems = releases.reduce(
    (total, release) => total + release.itemCount,
    0
  )

  const betasByVersion = useMemo(() => {
    const map = new Map<string, BetaRelease[]>()
    for (const beta of betas) {
      const list = map.get(beta.targetVersion) ?? []
      list.push(beta)
      map.set(beta.targetVersion, list)
    }
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => b.betaNumber - a.betaNumber)
    }
    return map
  }, [betas])

  const inBetaGroups = useMemo<InBetaGroup[]>(() => {
    const releasedVersions = new Set(releases.map((release) => release.version))
    return Array.from(betasByVersion.entries())
      .filter(([version]) => !releasedVersions.has(version))
      .map(([version, list]) => ({
        version,
        slug: slugForVersion(version),
        betas: list,
      }))
      .sort((a, b) => b.betas[0].date.localeCompare(a.betas[0].date))
  }, [betasByVersion, releases])

  const defaultExpandedBetas = useMemo(
    () =>
      new Set(
        inBetaGroups
          .map((group) => group.betas[0]?.slug)
          .filter(Boolean) as string[]
      ),
    [inBetaGroups]
  )

  const [query, setQuery] = useState('')
  const [activeSlug, setActiveSlug] = useState(
    inBetaGroups[0]?.slug ?? latest?.slug ?? ''
  )
  const [expandedBetas, setExpandedBetas] = useState<Set<string> | null>(null)
  const [openHistories, setOpenHistories] = useState<Set<string>>(
    () => new Set()
  )
  const articleRefs = useRef(new Map<string, HTMLElement>())
  const indexListRef = useRef<HTMLDivElement>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const searching = normalizedQuery.length > 0
  const effectiveExpanded = expandedBetas ?? defaultExpandedBetas

  function toggleBeta(slug: string) {
    setExpandedBetas((previous) => {
      const next = new Set(previous ?? defaultExpandedBetas)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  function toggleHistory(version: string) {
    setOpenHistories((previous) => {
      const next = new Set(previous)
      if (next.has(version)) {
        next.delete(version)
      } else {
        next.add(version)
      }
      return next
    })
  }

  const display = useMemo(() => {
    if (!searching) {
      return {
        inBeta: inBetaGroups,
        stable: releases,
        betaMatches: null as Map<string, BetaRelease[]> | null,
      }
    }

    const inBeta = inBetaGroups
      .map((group) => ({
        ...group,
        betas: group.betas
          .map((beta) => narrowToQuery(beta, normalizedQuery))
          .filter(Boolean) as BetaRelease[],
      }))
      .filter((group) => group.betas.length)

    const stable: Release[] = []
    const betaMatches = new Map<string, BetaRelease[]>()

    for (const release of releases) {
      const narrowed = narrowToQuery(release, normalizedQuery)
      const matchedBetas = (betasByVersion.get(release.version) ?? [])
        .map((beta) => narrowToQuery(beta, normalizedQuery))
        .filter(Boolean) as BetaRelease[]

      if (!narrowed && !matchedBetas.length) {
        continue
      }

      if (matchedBetas.length) {
        betaMatches.set(release.version, matchedBetas)
      }

      stable.push(
        narrowed ?? { ...release, intro: '', highlights: [], sections: [] }
      )
    }

    return { inBeta, stable, betaMatches }
  }, [searching, normalizedQuery, inBetaGroups, releases, betasByVersion])

  function historyBetasFor(version: string): BetaRelease[] {
    if (display.betaMatches) {
      return display.betaMatches.get(version) ?? []
    }
    return betasByVersion.get(version) ?? []
  }

  const indexEntries = useMemo(
    () => [
      ...display.inBeta.map((group) => ({
        slug: group.slug,
        title: `v${group.version}`,
        subtitle: `In beta · ${group.betas.length} builds`,
        isBeta: true,
      })),
      ...display.stable.map((release) => ({
        slug: release.slug,
        title: `v${release.version}`,
        subtitle: release.shortDateLabel,
        isBeta: false,
      })),
    ],
    [display]
  )

  // Deep link: scroll to a version or expand a specific beta build, both on
  // initial load and on same-page hash navigation.
  useEffect(() => {
    function revealFromHash() {
      const slug = window.location.hash.replace(/^#/, '')
      if (!slug) {
        return
      }

      const beta = betas.find((candidate) => candidate.slug === slug)
      if (beta) {
        setOpenHistories((previous) => {
          const next = new Set(previous)
          next.add(beta.targetVersion)
          return next
        })
        setExpandedBetas((previous) => {
          const next = new Set(previous ?? defaultExpandedBetas)
          next.add(slug)
          return next
        })
        window.setTimeout(() => {
          document.getElementById(slug)?.scrollIntoView({ block: 'start' })
        }, 80)
        return
      }

      document.getElementById(slug)?.scrollIntoView({ block: 'start' })
    }

    revealFromHash()
    window.addEventListener('hashchange', revealFromHash)
    return () => window.removeEventListener('hashchange', revealFromHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll spy: keep the release index in sync with the reading position.
  useEffect(() => {
    let ticking = false

    function update() {
      ticking = false
      let currentSlug = indexEntries[0]?.slug ?? ''

      for (const entry of indexEntries) {
        const element = articleRefs.current.get(entry.slug)
        if (!element) {
          continue
        }
        if (element.getBoundingClientRect().top <= 176) {
          currentSlug = entry.slug
        } else {
          break
        }
      }

      setActiveSlug((previous) =>
        previous === currentSlug ? previous : currentSlug
      )
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [indexEntries])

  useEffect(() => {
    const list = indexListRef.current
    if (!list || !activeSlug) {
      return
    }

    const item = list.querySelector<HTMLElement>(`[data-slug="${activeSlug}"]`)
    if (!item) {
      return
    }

    const top = item.offsetTop
    const bottom = top + item.offsetHeight
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 2 + item.offsetHeight / 2
    }
  }, [activeSlug])

  const totalMatches = display.stable.length + display.inBeta.length

  return (
    <>
      <Head>
        <title>EnConvo Releases - Changelog</title>
        <meta
          name="description"
          content="Read the latest EnConvo release notes, beta build updates, product improvements, and fixes."
        />
        <meta property="og:title" content="EnConvo Releases - Changelog" />
        <meta
          property="og:description"
          content="Read the latest EnConvo release notes, beta build updates, product improvements, and fixes."
        />
      </Head>
      <div
        className="min-h-screen bg-[#07080a] text-[#f4f4f6]"
        style={{ fontFeatureSettings: '"calt", "kern", "liga", "ss03"' }}
      >
        <SiteNav />

        <main>
          <section className="relative isolate overflow-hidden">
            <Image
              src={mainVisual}
              alt=""
              fill
              priority
              sizes="100vw"
              className="absolute inset-0 -z-20 scale-105 object-cover opacity-10 blur-sm"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(7,8,10,0.98)_0%,rgba(7,16,20,0.94)_48%,rgba(13,13,13,0.9)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#07080a] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
            <div
              className="pointer-events-none absolute left-0 top-0 -z-10 h-24 w-full overflow-hidden"
              aria-hidden="true"
            >
              <div className="from-[#ff6161]/45 absolute left-[7%] top-0 h-20 w-64 -skew-x-12 bg-gradient-to-r to-[#a1131a]/20" />
              <div className="absolute left-[19%] top-0 h-20 w-40 -skew-x-12 bg-gradient-to-r from-[#ff6161]/30 to-[#a1131a]/10" />
              <div className="absolute left-[31%] top-0 h-20 w-24 -skew-x-12 bg-gradient-to-r from-[#ff6161]/20 to-transparent" />
            </div>
            <CrystalShard
              className="pointer-events-none absolute -left-16 top-24 h-72 w-44 border border-cyan-100/20 bg-cyan-100/10 opacity-50 backdrop-blur-md sm:left-[3%]"
              points="50% 0%, 100% 28%, 78% 100%, 10% 86%, 0% 25%"
            />
            <CrystalShard
              className="pointer-events-none absolute right-[7%] top-20 hidden h-96 w-64 border border-amber-100/20 bg-amber-100/10 opacity-60 backdrop-blur-md lg:block"
              points="24% 0%, 100% 18%, 76% 100%, 0% 82%"
            />
            <CrystalShard
              className="border-[#ff6161]/15 opacity-45 pointer-events-none absolute bottom-12 right-[26%] hidden h-48 w-72 border bg-[#ff6161]/10 backdrop-blur-md md:block"
              points="0% 35%, 64% 0%, 100% 72%, 22% 100%"
            />

            <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">
              <div className="max-w-3xl">
                <div className="border-white/15 inline-flex items-center gap-2 rounded-md border bg-white/10 px-3 py-2 text-sm font-medium text-cyan-50 backdrop-blur-md">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {latest
                    ? `Latest release: ${latest.dateLabel}`
                    : 'Release notes'}
                </div>
                <h1 className="mt-8 text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
                  EnConvo releases
                </h1>
                <div className="mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-200 via-amber-200 to-transparent" />
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                  Product updates, model providers, workflow improvements, and
                  fixes from the EnConvo changelog — including every beta
                  build.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <span className="rounded-md border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-cyan-100">
                    Crystal timeline
                  </span>
                  <span className="rounded-md border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-amber-100">
                    {firstRelease
                      ? `${firstRelease.date} to ${latest?.date}`
                      : 'Release history'}
                  </span>
                </div>
                {latest && (
                  <div className="mt-10 flex flex-wrap gap-3">
                    <a
                      href={`#${latest.slug}`}
                      onClick={(event) => {
                        event.preventDefault()
                        scrollToRelease(latest.slug)
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e8e8e8]"
                    >
                      Read v{latest.version}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    {inBetaGroups[0] && (
                      <a
                        href={`#${inBetaGroups[0].slug}`}
                        onClick={(event) => {
                          event.preventDefault()
                          scrollToRelease(inBetaGroups[0].slug)
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-200/50"
                      >
                        v{inBetaGroups[0].version} beta
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="rounded-lg border border-[#242728] bg-[#0d0d0d] p-3 backdrop-blur-xl">
                  <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-[#57c1ff] via-[#ffc533] to-[#ff6161]" />
                  <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10 bg-slate-950">
                    <Image
                      src={appScreenshot}
                      alt="EnConvo app interface"
                      fill
                      sizes="(min-width: 1024px) 480px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 px-3 py-5">
                    <Stat
                      label="Latest"
                      value={latest ? `v${latest.version}` : '--'}
                    />
                    <Stat label="Releases" value={releases.length} />
                    <Stat label="Beta builds" value={betas.length} />
                    <Stat label="Updates" value={totalItems} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-lg border border-[#242728] bg-[#0d0d0d] p-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  Release index
                </h2>
                <div className="mt-3 h-px bg-gradient-to-r from-cyan-200/70 to-transparent" />
                <div className="relative mt-4">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search updates"
                    aria-label="Search release notes"
                    className="w-full rounded-md border border-[#242728] bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/40 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition hover:text-white"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {searching && (
                  <p className="mt-2 text-xs text-slate-500">
                    {totalMatches} {totalMatches === 1 ? 'release' : 'releases'}{' '}
                    match
                  </p>
                )}

                <select
                  value={activeSlug}
                  onChange={(event) => scrollToRelease(event.target.value)}
                  aria-label="Jump to release"
                  className="mt-4 w-full rounded-md border border-[#242728] bg-[#101111] px-3 py-2 text-sm text-white focus:border-cyan-200/40 focus:outline-none lg:hidden"
                >
                  {indexEntries.map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.title}
                      {entry.isBeta ? ' (beta)' : ''} - {entry.subtitle}
                    </option>
                  ))}
                </select>

                <div
                  ref={indexListRef}
                  className="relative mt-4 hidden max-h-[60vh] space-y-1 overflow-y-auto pr-1 lg:block"
                >
                  {indexEntries.map((entry) => {
                    const isActive = entry.slug === activeSlug

                    return (
                      <a
                        key={entry.slug}
                        data-slug={entry.slug}
                        href={`#${entry.slug}`}
                        onClick={(event) => {
                          event.preventDefault()
                          scrollToRelease(entry.slug)
                        }}
                        aria-current={isActive ? 'true' : undefined}
                        className={`block rounded-md border-l-2 px-3 py-2 text-sm transition ${
                          isActive
                            ? `${
                                entry.isBeta
                                  ? 'border-amber-200'
                                  : 'border-cyan-200'
                              } bg-white/10 text-white`
                            : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          {entry.title}
                          {entry.isBeta && (
                            <span className="rounded border border-amber-200/25 bg-amber-200/10 px-1 py-px text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                              Beta
                            </span>
                          )}
                        </span>
                        <span
                          className={`mt-1 block text-xs ${
                            isActive ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {entry.subtitle}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            </aside>

            <div className="space-y-8">
              {totalMatches === 0 && (
                <div className="rounded-lg border border-[#242728] bg-[#0d0d0d] px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-white">
                    No releases match &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Try a different keyword, version number, or date.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mt-6 inline-flex items-center gap-2 rounded-md border border-[#242728] bg-[#101111] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {display.inBeta.map((group) => (
                <article
                  key={group.slug}
                  id={group.slug}
                  ref={(element) => {
                    if (element) {
                      articleRefs.current.set(group.slug, element)
                    } else {
                      articleRefs.current.delete(group.slug)
                    }
                  }}
                  className="scroll-mt-28 border-t border-[#242728] pt-8 [content-visibility:auto] [contain-intrinsic-size:auto_900px] first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <time
                        dateTime={group.betas[0]?.date}
                        className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200"
                      >
                        {group.betas[0]?.dateLabel}
                      </time>
                      <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">
                        <a
                          href={`#${group.slug}`}
                          onClick={(event) => {
                            event.preventDefault()
                            scrollToRelease(group.slug)
                          }}
                          className="group inline-flex items-baseline gap-2"
                        >
                          EnConvo {group.version}
                          <span
                            aria-hidden="true"
                            className="text-xl text-slate-600 opacity-0 transition group-hover:opacity-100"
                          >
                            #
                          </span>
                        </a>
                      </h2>
                      <div className="mt-4 h-px w-32 bg-gradient-to-r from-amber-200/80 to-transparent" />
                    </div>
                    <BetaBadge
                      label={`In Beta · ${group.betas.length} builds`}
                    />
                  </div>

                  <div className="space-y-3">
                    {group.betas.map((beta) => (
                      <BetaRow
                        key={beta.slug}
                        beta={beta}
                        expanded={searching || effectiveExpanded.has(beta.slug)}
                        onToggle={() => toggleBeta(beta.slug)}
                      />
                    ))}
                  </div>
                </article>
              ))}

              {display.stable.map((release) => {
                const historyBetas = historyBetasFor(release.version)
                const historyOpen =
                  searching || openHistories.has(release.version)

                return (
                  <article
                    key={release.slug}
                    id={release.slug}
                    ref={(element) => {
                      if (element) {
                        articleRefs.current.set(release.slug, element)
                      } else {
                        articleRefs.current.delete(release.slug)
                      }
                    }}
                    className="scroll-mt-28 border-t border-[#242728] pt-8 [content-visibility:auto] [contain-intrinsic-size:auto_900px] first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <time
                          dateTime={release.date}
                          className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200"
                        >
                          {release.dateLabel}
                        </time>
                        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">
                          <a
                            href={`#${release.slug}`}
                            onClick={(event) => {
                              event.preventDefault()
                              scrollToRelease(release.slug)
                            }}
                            className="group inline-flex items-baseline gap-2"
                          >
                            EnConvo {release.version}
                            <span
                              aria-hidden="true"
                              className="text-xl text-slate-600 opacity-0 transition group-hover:opacity-100"
                            >
                              #
                            </span>
                          </a>
                        </h2>
                        <div className="mt-4 h-px w-32 bg-gradient-to-r from-cyan-200/80 to-transparent" />
                      </div>
                      {release.slug === latest?.slug && (
                        <span className="w-fit rounded-md border border-emerald-200/25 bg-emerald-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                          Latest
                        </span>
                      )}
                    </div>

                    <ReleaseBody release={release} />

                    {historyBetas.length > 0 && (
                      <div className="mt-8">
                        <button
                          type="button"
                          onClick={() => toggleHistory(release.version)}
                          aria-expanded={historyOpen}
                          className="flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
                        >
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform ${
                              historyOpen ? 'rotate-90' : ''
                            }`}
                          />
                          Beta history · {historyBetas.length}{' '}
                          {historyBetas.length === 1 ? 'build' : 'builds'}
                        </button>
                        {historyOpen && (
                          <div className="mt-4 space-y-3">
                            {historyBetas.map((beta) => (
                              <BetaRow
                                key={beta.slug}
                                beta={beta}
                                expanded={
                                  searching || effectiveExpanded.has(beta.slug)
                                }
                                onToggle={() => toggleBeta(beta.slug)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps<ChangelogPageProps> = async () => {
  const changelog = await readChangelogSource()
  const betas = await readBetaReleases()

  return {
    props: {
      releases: parseChangelog(changelog),
      betas,
    },
  }
}
