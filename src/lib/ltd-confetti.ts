// A short, dependency-free confetti burst for the campaign page. It draws on a
// temporary full-screen canvas that removes itself, never intercepts clicks,
// and is skipped entirely for visitors who prefer reduced motion.
// The default palette is Crystal blue; a co-branded page can pass its own colors.
const COLORS = ['#57c1ff', '#86d3ff', '#2563eb', '#d1e4ee', '#f4f4f6']
const DURATION_MS = 1700

export function burstConfetti(origin?: { x: number; y: number }, colors: readonly string[] = COLORS, count = 90) {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const width = window.innerWidth
  const height = window.innerHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '80' })
  document.body.appendChild(canvas)
  context.scale(ratio, ratio)

  const x = origin?.x ?? width / 2
  const y = origin?.y ?? height / 3
  const pieces = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1
    const speed = 5 + Math.random() * 8
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  })

  const start = performance.now()
  let last = start
  function frame(now: number) {
    // Scale physics by elapsed time so 120 Hz displays do not double the speed.
    const step = Math.min((now - last) / 16.67, 3)
    last = now
    const elapsed = now - start
    context!.clearRect(0, 0, width, height)
    context!.globalAlpha = Math.min(1, (DURATION_MS - elapsed) / (DURATION_MS * 0.35))
    for (const piece of pieces) {
      piece.vy += 0.3 * step
      piece.vx *= 0.985 ** step
      piece.x += piece.vx * step
      piece.y += piece.vy * step
      piece.spin += piece.spinSpeed * step
      context!.save()
      context!.translate(piece.x, piece.y)
      context!.rotate(piece.spin)
      context!.fillStyle = piece.color
      context!.fillRect(-piece.size / 2, -piece.size, piece.size, piece.size * 2 * Math.abs(Math.cos(piece.spin)) + 1)
      context!.restore()
    }
    if (elapsed < DURATION_MS) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
