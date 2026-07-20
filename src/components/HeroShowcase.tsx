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

function formatTime(s: number) {
    if (!Number.isFinite(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

export function HeroShowcase() {
    const [tabIndex, setTabIndex] = useState(0)
    const [sceneIndex, setSceneIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)
    const [soundOn, setSoundOn] = useState(false)
    const [playing, setPlaying] = useState(true)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const playerRef = useRef<HTMLDivElement | null>(null)

    const activeTab = heroTabs[tabIndex]
    const activeScene = activeTab.subScenes[sceneIndex]

    // Any manual interaction pauses the rotation briefly, then it resumes.
    const noteInteraction = useCallback(() => {
        setAutoPlay(false)
        if (resumeTimer.current) clearTimeout(resumeTimer.current)
        resumeTimer.current = setTimeout(() => setAutoPlay(true), INTERACTION_PAUSE_MS)
    }, [])

    const select = useCallback((nextTab: number, nextScene: number) => {
        setTabIndex(nextTab)
        setSceneIndex(nextScene)
        setSoundOn(false)
        noteInteraction()
    }, [noteInteraction])

    const togglePlay = useCallback(() => {
        const v = videoRef.current
        if (!v) return
        if (v.paused) void v.play()
        else v.pause()
        noteInteraction()
    }, [noteInteraction])

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void playerRef.current?.requestFullscreen?.()
        noteInteraction()
    }, [noteInteraction])

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
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

            <div ref={playerRef} className="group relative mt-4 aspect-video overflow-hidden rounded-lg border border-hairline-strong bg-surface-elevated shadow-2xl">
                {activeScene.media?.type === 'video' ? (
                    <video
                        key={activeScene.media.src}
                        ref={videoRef}
                        src={activeScene.media.src}
                        autoPlay
                        muted={!soundOn}
                        onEnded={() => { if (autoPlay) advance() }}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
                        onLoadedMetadata={e => {
                            setDuration(e.currentTarget.duration)
                            setCurrentTime(e.currentTarget.currentTime)
                            setPlaying(!e.currentTarget.paused)
                        }}
                        onClick={togglePlay}
                        playsInline
                        preload="metadata"
                        className={clsx(
                            'absolute inset-0 h-full w-full cursor-pointer',
                            isFullscreen ? 'bg-black object-contain' : 'object-cover'
                        )}
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
                    <span className="absolute left-4 top-4 z-10 rounded bg-black/45 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-content backdrop-blur">
                        {activeTab.productName}
                    </span>
                )}
                {activeScene.media?.type === 'video' && (
                    <button
                        onClick={() => setSoundOn(!soundOn)}
                        aria-label={soundOn ? 'Mute' : 'Play with sound'}
                        className={clsx(
                            'absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-xs font-medium text-content backdrop-blur transition-opacity hover:bg-black/75',
                            playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                        )}
                    >
                        {soundOn ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.4 5.6a9 9 0 0 1 0 12.8" /></svg>
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                        )}
                        {soundOn ? 'Sound on' : 'Play with sound'}
                    </button>
                )}
                {activeScene.media?.type === 'video' ? (
                    <div
                        className={clsx(
                            'absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 transition-opacity',
                            playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                        )}
                    >
                        <button
                            onClick={togglePlay}
                            aria-label={playing ? 'Pause' : 'Play'}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-content transition-colors hover:bg-black/70"
                        >
                            {playing ? (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            ) : (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>
                        <input
                            type="range"
                            aria-label="Seek"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={Math.min(currentTime, duration || 0)}
                            onChange={e => {
                                const t = Number(e.currentTarget.value)
                                if (videoRef.current) videoRef.current.currentTime = t
                                setCurrentTime(t)
                                noteInteraction()
                            }}
                            style={{
                                background: `linear-gradient(to right, rgba(255,255,255,0.95) ${duration ? Math.min(currentTime / duration, 1) * 100 : 0}%, rgba(255,255,255,0.22) ${duration ? Math.min(currentTime / duration, 1) * 100 : 0}%)`,
                            }}
                            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none transition-[height] hover:h-1.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                        />
                        <span className="shrink-0 text-[11px] tabular-nums text-content-body">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <button
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-content transition-colors hover:bg-black/70"
                        >
                            {isFullscreen ? (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
                            ) : (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                            )}
                        </button>
                    </div>
                ) : activeScene.media ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-content backdrop-blur">
                            {activeTab.productName}
                        </span>
                        <span className="truncate text-xs text-content-body">
                            {activeScene.caption}
                        </span>
                    </div>
                ) : null}
            </div>

            <p className="mt-3 text-center text-sm text-content-muted">
                <span className="font-medium text-content-body">{activeTab.productName}</span>
                {' — '}
                {activeTab.tagline}
            </p>
        </div>
    )
}
