import { useEffect, useRef } from 'react'

/** Progressive enhancement: the server-rendered content is always visible. */
export function useSectionEffects() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const animations = new Set<Animation>()
    let active: HTMLElement | null = null
    let frame = 0
    let x = 0
    let y = 0

    const clear = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      active?.removeAttribute('data-lit')
      active = null
    }
    const move = (event: PointerEvent) => {
      if (!pointer.matches || motion.matches || event.pointerType === 'touch')
        return
      const card = (event.target as Element).closest<HTMLElement>(
        '[data-spotlight]'
      )
      if (active !== card) {
        clear()
        active = card
      }
      if (!active) return
      x = event.clientX
      y = event.clientY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!active) return
        const rect = active.getBoundingClientRect()
        active.style.setProperty('--spot-x', `${x - rect.left}px`)
        active.style.setProperty('--spot-y', `${y - rect.top}px`)
        active.setAttribute('data-lit', '')
      })
    }
    const preferenceChanged = () => {
      clear()
      if (motion.matches) animations.forEach((animation) => animation.cancel())
    }

    // Animate each group once, without hidden styles or a JS-dependent reveal gate.
    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                observer?.unobserve(entry.target)
                if (
                  motion.matches ||
                  typeof entry.target.animate !== 'function'
                )
                  return
                const animation = entry.target.animate(
                  [
                    { opacity: 0.45, transform: 'translateY(16px)' },
                    { opacity: 1, transform: 'translateY(0)' },
                  ],
                  { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
                )
                animations.add(animation)
                const release = () => animations.delete(animation)
                animation.onfinish = release
                animation.oncancel = release
              })
            },
            { threshold: 0.08 }
          )
        : null

    root
      .querySelectorAll('[data-reveal]')
      .forEach((element) => observer?.observe(element))
    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerleave', clear)
    window.addEventListener('scroll', clear, { passive: true })
    motion.addEventListener('change', preferenceChanged)
    pointer.addEventListener('change', preferenceChanged)

    return () => {
      clear()
      observer?.disconnect()
      animations.forEach((animation) => animation.cancel())
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', clear)
      window.removeEventListener('scroll', clear)
      motion.removeEventListener('change', preferenceChanged)
      pointer.removeEventListener('change', preferenceChanged)
    }
  }, [])

  return ref
}
