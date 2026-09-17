/** Keep media work within the visible player, preserving an explicit pause. */
export function observeVideoPlayback(
  container: HTMLElement,
  video: HTMLVideoElement | null,
  onActive: (active: boolean) => void
) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection
  let resume = !preference.matches && !connection?.saveData
  let visible = false
  let active = false
  let disposed = false

  const sync = () => {
    const next = visible && !document.hidden
    if (next === active) return
    active = next
    onActive(active)
    if (!video) return
    if (!active) {
      resume = !video.paused && !video.ended
      video.pause()
    } else if (resume) {
      void video
        .play()
        .then(() => {
          // A pending play request can settle after scrolling away or unmounting.
          if (!active || disposed) video.pause()
        })
        .catch(() => {
          /* Autoplay may be blocked; the Play button remains available. */
        })
    }
  }
  const preferenceChanged = () => {
    if (preference.matches) {
      resume = false
      video?.pause()
    }
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      sync()
    },
    { threshold: 0.01 }
  )
  observer.observe(container)
  document.addEventListener('visibilitychange', sync)
  preference.addEventListener('change', preferenceChanged)

  return () => {
    disposed = true
    active = false
    observer.disconnect()
    document.removeEventListener('visibilitychange', sync)
    preference.removeEventListener('change', preferenceChanged)
    video?.pause()
  }
}
