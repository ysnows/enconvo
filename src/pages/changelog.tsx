import fs from 'fs/promises'
import path from 'path'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { ArrowRight, CalendarDays } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import mainVisual from '@/images/main.jpg'
import appScreenshot from '@/images/screenshots/app-screenshot.png'

interface ReleaseSection {
  title: string
  items: string[]
}

interface Release {
  version: string
  date: string
  dateLabel: string
  slug: string
  sections: ReleaseSection[]
  highlights: string[]
  itemCount: number
}

interface ChangelogPageProps {
  releases: Release[]
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
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
    .replace(/\uD83D\uDE80/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseChangelog(source: string): Release[] {
  const releases: Release[] = []
  let current: {
    version: string
    date: string
    sections: ReleaseSection[]
    highlights: string[]
  } | null = null
  let currentSection: ReleaseSection | null = null
  let inCodeBlock = false

  function pushCurrent() {
    if (!current) {
      return
    }

    const sections = current.sections.filter((section) => section.items.length)
    if (!sections.length) {
      current = null
      currentSection = null
      return
    }

    const itemCount = sections.reduce(
      (total, section) => total + section.items.length,
      0
    )

    releases.push({
      version: current.version,
      date: current.date,
      dateLabel: formatDate(current.date),
      slug: slugForVersion(current.version),
      sections,
      highlights: current.highlights,
      itemCount,
    })

    current = null
    currentSection = null
  }

  function startRelease(version: string, date: string) {
    pushCurrent()
    current = {
      version,
      date,
      sections: [],
      highlights: [],
    }
    currentSection = null
  }

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trimEnd()

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
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
      currentSection = {
        title: cleanHeading(sectionMatch[1]),
        items: [],
      }
      current.sections.push(currentSection)
      continue
    }

    const itemMatch = line.match(/^\s*-\s+(.+)$/)
    if (current && itemMatch) {
      if (!currentSection) {
        currentSection = {
          title: 'Highlights',
          items: [],
        }
        current.sections.push(currentSection)
      }

      const item = cleanHeading(itemMatch[1])
      currentSection.items.push(item)

      if (current.highlights.length < 4) {
        current.highlights.push(item)
      }
    }
  }

  pushCurrent()

  return releases
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

export default function ChangelogPage({ releases }: ChangelogPageProps) {
  const latest = releases[0]
  const firstRelease = releases[releases.length - 1]
  const totalItems = releases.reduce(
    (total, release) => total + release.itemCount,
    0
  )

  return (
    <>
      <Head>
        <title>EnConvo Releases - Changelog</title>
        <meta
          name="description"
          content="Read the latest EnConvo release notes, product updates, improvements, and fixes."
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
                  fixes from the EnConvo changelog.
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
                      className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e8e8e8]"
                    >
                      Read v{latest.version}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
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
                    <Stat label="Updates" value={totalItems} />
                    <Stat label="Source" value="Docs" />
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
                <div className="mt-4 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                  {releases.map((release) => (
                    <a
                      key={release.slug}
                      href={`#${release.slug}`}
                      className="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <span className="font-semibold">v{release.version}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {release.date}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-8">
              {releases.map((release, releaseIndex) => (
                <article
                  key={release.slug}
                  id={release.slug}
                  className="scroll-mt-28 border-t border-[#242728] pt-8 first:border-t-0 first:pt-0"
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
                        EnConvo {release.version}
                      </h2>
                      <div className="mt-4 h-px w-32 bg-gradient-to-r from-cyan-200/80 to-transparent" />
                    </div>
                    {releaseIndex === 0 && (
                      <span className="w-fit rounded-md border border-emerald-200/25 bg-emerald-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                        Latest
                      </span>
                    )}
                  </div>

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

                  <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    {release.sections.map((section, sectionIndex) => {
                      const accent =
                        sectionAccentClasses[
                          sectionIndex % sectionAccentClasses.length
                        ]

                      return (
                        <section
                          key={`${release.slug}-${section.title}`}
                          className="rounded-lg border border-[#242728] bg-[#121212] p-4 transition hover:border-white/20 hover:bg-[#101111]"
                        >
                          <div
                            className={`mb-4 h-0.5 w-16 bg-gradient-to-r ${accent.bar}`}
                          />
                          <h3
                            className={`text-base font-semibold ${accent.title}`}
                          >
                            {section.title}
                          </h3>
                          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                            {section.items.map((item, itemIndex) => (
                              <li
                                key={`${section.title}-${itemIndex}`}
                                className="flex gap-3"
                              >
                                <span
                                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-sm ${accent.marker}`}
                                />
                                <span>
                                  <FormattedText text={item} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )
                    })}
                  </div>
                </article>
              ))}
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

  return {
    props: {
      releases: parseChangelog(changelog),
    },
  }
}
