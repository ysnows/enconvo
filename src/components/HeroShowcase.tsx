import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { heroTabs } from '@/data/heroShowcase'

const SUB_SCENE_MS = 7000
const INTERACTION_PAUSE_MS = 20000

// Styled stand-in shown until a sub-scene's demo clip is recorded — a mock
// window frame in the Product Screenshot Panel style so the future video
// drops into the same visual slot.
function ScenePlaceholder({
    productName,
    caption,
}: {
    productName: string
    caption: string
}) {
    return (
        <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center gap-2 border-b border-hairline bg-surface px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-signal-red/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-signal-yellow/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-signal-green/70" />
                <span className="ml-3 text-xs font-medium tracking-wide text-content-muted">
                    {productName}
                </span>
            </div>
            <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-8 top-8 h-2 w-1/3 rounded bg-white/[0.04]" />
                    <div className="absolute left-8 top-14 h-2 w-1/2 rounded bg-white/[0.03]" />
                    <div className="absolute left-8 top-20 h-2 w-1/4 rounded bg-white/[0.03]" />
                    <div className="absolute bottom-8 right-8 h-24 w-56 rounded-lg border border-hairline bg-white/[0.02]" />
                </div>
                <p className="relative max-w-md text-base text-content-body sm:text-lg">
                    {caption}
                </p>
                <span className="relative rounded-md border border-hairline bg-surface-elevated px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-content-ash">
                    Demo video coming soon
                </span>
            </div>
        </div>
    )
}

export function HeroShowcase() {
    const [tabIndex, setTabIndex] = useState(0)
    const [sceneIndex, setSceneIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)
    const [soundOn, setSoundOn] = useState(false)
    const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const activeTab = heroTabs[tabIndex]
    const activeScene = activeTab.subScenes[sceneIndex]

    // Any manual pick pauses the rotation briefly, then it resumes.
    const select = useCallback((nextTab: number, nextScene: number) => {
        setTabIndex(nextTab)
        setSceneIndex(nextScene)
        setSoundOn(false)
        setAutoPlay(false)
        if (resumeTimer.current) clearTimeout(resumeTimer.current)
        resumeTimer.current = setTimeout(() => setAutoPlay(true), INTERACTION_PAUSE_MS)
    }, [])

    const advance = useCallback(() => {
        const tab = heroTabs[tabIndex]
        setSoundOn(false)
        if (sceneIndex + 1 < tab.subScenes.length) {
            setSceneIndex(sceneIndex + 1)
        } else {
            setTabIndex((tabIndex + 1) % heroTabs.length)
            setSceneIndex(0)
        }
    }, [tabIndex, sceneIndex])

    useEffect(() => {
        if (typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setAutoPlay(false)
            return
        }
    }, [])

    // Timer drives placeholder/image scenes only — videos advance when they
    // finish playing (onEnded), so a film is always watched to the end.
    useEffect(() => {
        if (!autoPlay) return
        if (activeScene.media?.type === 'video') return
        const timer = setTimeout(advance, SUB_SCENE_MS)
        return () => clearTimeout(timer)
    }, [autoPlay, tabIndex, sceneIndex, activeScene, advance])

    useEffect(() => () => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current)
    }, [])

    return (
        <div className="mx-auto mt-14 w-full max-w-5xl">
            <div
                className="flex flex-wrap justify-center gap-2"
                role="tablist"
                aria-label="Enconvo capabilities"
            >
                {heroTabs.map((tab, i) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={i === tabIndex}
                        onClick={() => select(i, 0)}
                        className={clsx(
                            'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                            i === tabIndex
                                ? 'border-hairline-strong bg-surface-elevated text-content'
                                : 'border-hairline bg-surface text-content-muted hover:text-content-body'
                        )}
                    >
                        {tab.benefitLabel}
                    </button>
                ))}
            </div>

            {/* invisible (not hidden) when single-scene so the layout height stays stable across tabs */}
            <div className={clsx('mt-4 flex flex-wrap justify-center gap-2', activeTab.subScenes.length <= 1 && 'invisible')}>
                {activeTab.subScenes.map((scene, i) => (
                    <button
                        key={scene.id}
                        onClick={() => select(tabIndex, i)}
                        className={clsx(
                            'whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                            i === sceneIndex
                                ? 'border-hairline-strong bg-surface-card text-content'
                                : 'border-transparent text-content-ash hover:text-content-muted'
                        )}
                    >
                        {i + 1}. {scene.label}
                    </button>
                ))}
            </div>

            <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-hairline-strong bg-surface-elevated shadow-2xl">
                {activeScene.media?.type === 'video' ? (
                    <video
                        key={activeScene.media.src}
                        src={activeScene.media.src}
                        autoPlay
                        muted={!soundOn}
                        onEnded={() => { if (autoPlay) advance() }}
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : activeScene.media?.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={activeScene.media.src}
                        src={activeScene.media.src}
                        alt={activeScene.caption}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <ScenePlaceholder
                        productName={activeTab.productName}
                        caption={activeScene.caption}
                    />
                )}

                {activeScene.media?.type === 'video' && (
                    <button
                        onClick={() => setSoundOn(!soundOn)}
                        aria-label={soundOn ? 'Mute' : 'Play with sound'}
                        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-xs font-medium text-content backdrop-blur transition-colors hover:bg-black/75"
                    >
                        {soundOn ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.4 5.6a9 9 0 0 1 0 12.8" /></svg>
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                        )}
                        {soundOn ? 'Sound on' : 'Play with sound'}
                    </button>
                )}
                {activeScene.media && (
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-content backdrop-blur">
                            {activeTab.productName}
                        </span>
                        <span className="truncate text-xs text-content-body">
                            {activeScene.caption}
                        </span>
                    </div>
                )}
            </div>

            <p className="mt-3 text-center text-sm text-content-muted">
                <span className="font-medium text-content-body">{activeTab.productName}</span>
                {' — '}
                {activeTab.tagline}
            </p>
        </div>
    )
}
