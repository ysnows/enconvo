import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { ArrowUpRight, Play, X } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { useCases, type UseCase } from '@/data/useCases'

const ALL_CATEGORY = 'All'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function watchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`
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

function Thumbnail({
  youtubeId,
  alt,
  className,
}: {
  youtubeId: string
  alt: string
  className?: string
}) {
  const [src, setSrc] = useState(
    `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`
  )

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() =>
        setSrc(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`)
      }
    />
  )
}

function PlayOverlay({ title }: { title: string }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-sm transition group-hover:scale-110 group-hover:border-cyan-200/50"
      >
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </span>
      <span className="sr-only">Play {title}</span>
    </span>
  )
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="rounded border border-cyan-200/20 bg-cyan-200/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
      {category}
    </span>
  )
}

function CardMeta({
  useCase,
  onOpenDocs,
}: {
  useCase: UseCase
  onOpenDocs: (event: React.MouseEvent) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CategoryChip category={useCase.category} />
        <span className="text-xs text-slate-500">
          {formatDate(useCase.date)}
        </span>
      </div>
      {useCase.docsUrl && (
        <a
          href={useCase.docsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onOpenDocs}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-white"
        >
          Read the guide
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export default function UseCasesPage() {
  const { featured, rest, all, categories } = useMemo(() => {
    const featuredCases = useCases.filter((useCase) => useCase.featured)
    const restCases = useCases
      .filter((useCase) => !useCase.featured)
      .sort((a, b) => b.date.localeCompare(a.date))
    const allCases = [...featuredCases, ...restCases]

    return {
      featured: featuredCases,
      rest: restCases,
      all: allCases,
      categories: Array.from(
        new Set(allCases.map((useCase) => useCase.category))
      ),
    }
  }, [])

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [activeCase, setActiveCase] = useState<UseCase | null>(null)

  const filtered = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) {
      return all
    }
    return all.filter((useCase) => useCase.category === activeCategory)
  }, [all, activeCategory])

  const showFeaturedRow = activeCategory === ALL_CATEGORY && featured.length > 0
  const gridCases = showFeaturedRow ? rest : filtered

  function openCase(useCase: UseCase) {
    setActiveCase(useCase)
    window.history.replaceState(null, '', `#${useCase.slug}`)
  }

  function closeCase() {
    setActiveCase(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  // Deep link: /use-cases#<slug> scrolls to the card and opens the player,
  // both on initial load and on same-page hash navigation.
  useEffect(() => {
    function openFromHash() {
      const slug = window.location.hash.replace(/^#/, '')
      if (!slug) {
        return
      }

      const target = useCases.find((useCase) => useCase.slug === slug)
      if (!target) {
        return
      }

      document.getElementById(slug)?.scrollIntoView({ block: 'center' })
      setActiveCase(target)
    }

    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  useEffect(() => {
    if (!activeCase) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeCase()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeCase])

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: all.map((useCase, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'VideoObject',
            name: useCase.title,
            description: useCase.description,
            thumbnailUrl: `https://i.ytimg.com/vi/${useCase.youtubeId}/hqdefault.jpg`,
            uploadDate: useCase.date,
            embedUrl: `https://www.youtube-nocookie.com/embed/${useCase.youtubeId}`,
            contentUrl: watchUrl(useCase.youtubeId),
            url: `https://enconvo.com/use-cases#${useCase.slug}`,
          },
        })),
      }),
    [all]
  )

  return (
    <>
      <Head>
        <title>EnConvo Use Cases - Video Walkthroughs</title>
        <meta
          name="description"
          content="Watch how people get real work done with EnConvo: provider setup, office automation, workflows, OCR, and agent-built apps — one video per use case."
        />
        <meta property="og:title" content="EnConvo Use Cases" />
        <meta
          property="og:description"
          content="Watch how people get real work done with EnConvo — one video per use case."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </Head>
      <div
        className="min-h-screen bg-[#07080a] text-[#f4f4f6]"
        style={{ fontFeatureSettings: '"calt", "kern", "liga", "ss03"' }}
      >
        <SiteNav />

        <main>
          <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(7,8,10,0.98)_0%,rgba(7,16,20,0.94)_48%,rgba(13,13,13,0.9)_100%)]" />
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
              className="pointer-events-none absolute -left-16 top-28 h-64 w-40 border border-cyan-100/20 bg-cyan-100/10 opacity-50 backdrop-blur-md sm:left-[3%]"
              points="50% 0%, 100% 28%, 78% 100%, 10% 86%, 0% 25%"
            />
            <CrystalShard
              className="pointer-events-none absolute right-[6%] top-24 hidden h-72 w-52 border border-amber-100/20 bg-amber-100/10 opacity-50 backdrop-blur-md lg:block"
              points="24% 0%, 100% 18%, 76% 100%, 0% 82%"
            />

            <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-24 sm:px-6 sm:pt-32 lg:px-8">
              <div className="max-w-3xl">
                <div className="border-white/15 inline-flex items-center gap-2 rounded-md border bg-white/10 px-3 py-2 text-sm font-medium text-cyan-50 backdrop-blur-md">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {all.length} video walkthroughs
                </div>
                <h1 className="mt-8 text-5xl font-semibold tracking-normal text-white sm:text-6xl">
                  Use cases
                </h1>
                <div className="mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-200 via-amber-200 to-transparent" />
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                  See how to get real work done with EnConvo — connecting your
                  model subscriptions, automating office files and email, and
                  letting agents build things for you. One short video per use
                  case.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter use cases by category"
            >
              {[ALL_CATEGORY, ...categories].map((category) => {
                const isActive = category === activeCategory

                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      isActive
                        ? 'border-cyan-200/40 bg-cyan-200/10 text-cyan-100'
                        : 'border-[#242728] bg-[#101111] text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>

            {showFeaturedRow && (
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {featured.map((useCase) => (
                  <article
                    key={useCase.slug}
                    id={useCase.slug}
                    onClick={() => openCase(useCase)}
                    className="group scroll-mt-28 cursor-pointer rounded-lg border border-[#242728] bg-[#0d0d0d] p-3 transition hover:border-white/20"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-md border border-white/10 bg-slate-950">
                      <Thumbnail
                        youtubeId={useCase.youtubeId}
                        alt={useCase.title}
                        className="h-full w-full object-cover"
                      />
                      <PlayOverlay title={useCase.title} />
                    </div>
                    <div className="px-2 pb-2 pt-4">
                      <h2 className="text-lg font-semibold text-white">
                        {useCase.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {useCase.description}
                      </p>
                      <CardMeta
                        useCase={useCase}
                        onOpenDocs={(event) => event.stopPropagation()}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridCases.map((useCase) => (
                <article
                  key={useCase.slug}
                  id={useCase.slug}
                  onClick={() => openCase(useCase)}
                  className="group scroll-mt-28 cursor-pointer rounded-lg border border-[#242728] bg-[#121212] p-3 transition hover:border-white/20 hover:bg-[#101111]"
                >
                  <div className="relative aspect-video overflow-hidden rounded-md border border-white/10 bg-slate-950">
                    <Thumbnail
                      youtubeId={useCase.youtubeId}
                      alt={useCase.title}
                      className="h-full w-full object-cover"
                    />
                    <PlayOverlay title={useCase.title} />
                  </div>
                  <div className="px-1 pb-1 pt-4">
                    <h2 className="text-base font-semibold text-white">
                      {useCase.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400 line-clamp-3">
                      {useCase.description}
                    </p>
                    <CardMeta
                      useCase={useCase}
                      onOpenDocs={(event) => event.stopPropagation()}
                    />
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-16 border-t border-[#242728] pt-8 text-sm text-slate-500">
              Want more? Subscribe to the{' '}
              <a
                href="https://www.youtube.com/@enconvo"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-200 underline decoration-cyan-200/30 underline-offset-4 hover:text-white"
              >
                EnConvo YouTube channel
              </a>{' '}
              — new walkthroughs land there first.
            </p>
          </section>
        </main>

        <Footer />

        {activeCase && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={activeCase.title}
            onClick={closeCase}
          >
            <div
              className="w-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="truncate text-sm font-semibold text-white sm:text-base">
                  {activeCase.title}
                </h2>
                <button
                  type="button"
                  onClick={closeCase}
                  aria-label="Close video"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-slate-300 transition hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg border border-white/15 bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeCase.youtubeId}?autoplay=1&rel=0`}
                  title={activeCase.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-400">
                <span>
                  {activeCase.category} · {formatDate(activeCase.date)}
                </span>
                <a
                  href={watchUrl(activeCase.youtubeId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-cyan-200 hover:text-white"
                >
                  Watch on YouTube
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
