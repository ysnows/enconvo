import { useEffect, useState, type RefObject } from 'react'
import styles from '@/styles/Home.module.css'

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Progress events update only the timeline, not every tab and scene in the showcase.
export function VideoTimeline({
  videoRef,
  onSeek,
}: {
  videoRef: RefObject<HTMLVideoElement>
  onSeek: () => void
}) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const sync = () => {
      setCurrentTime(video.currentTime)
      setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    }
    const events = ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied']
    events.forEach((event) => video.addEventListener(event, sync))
    sync()
    return () =>
      events.forEach((event) => video.removeEventListener(event, sync))
  }, [videoRef])
  return (
    <>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => {
          const t = Number(e.currentTarget.value)
          if (videoRef.current) videoRef.current.currentTime = t
          setCurrentTime(t)
          onSeek()
        }}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.95) ${
            duration ? Math.min(currentTime / duration, 1) * 100 : 0
          }%, rgba(255,255,255,0.22) ${
            duration ? Math.min(currentTime / duration, 1) * 100 : 0
          }%)`,
        }}
        className={`${styles.seek} min-w-0 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white`}
      />
      <span className="shrink-0 text-[11px] tabular-nums text-content-body">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </>
  )
}
