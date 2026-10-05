import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Head from 'next/head'

// Ship the decoration with the SSR markup, so refreshing never swaps a loading
// background for a different renderer. Keep these styles out of deferred CSS.
// Motion is transform-only, on static SVG layers the compositor moves. Redrawing
// this full-viewport SVG every frame (path morphs, dash offsets) saturated
// Safari's GPU process, which delayed clicks across the page.
const backdropStyles = `
[data-hero-backdrop] {
  position: absolute; inset: 0; overflow: hidden;
  pointer-events: none; user-select: none;
  background: radial-gradient(ellipse at 75% 10%, rgba(87,131,255,.075), transparent 50%),
    radial-gradient(ellipse at 14% 72%, rgba(63,189,177,.09), transparent 42%),
    radial-gradient(ellipse at 88% 76%, rgba(87,131,255,.07), transparent 40%),
    radial-gradient(ellipse 48% 16% at 50% 92%, rgba(63,189,177,.12), transparent);
  -webkit-mask-image: linear-gradient(#000 74%, rgba(0,0,0,.75) 88%, transparent);
  mask-image: linear-gradient(#000 74%, rgba(0,0,0,.75) 88%, transparent);
}
[data-aurora-defs] { position: absolute; width: 0; height: 0; }
[data-aurora-layer] {
  position: absolute; inset: 0; will-change: transform;
  animation: enconvo-aurora-drift 12s ease-in-out infinite alternate;
}
[data-aurora-layer] svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
[data-aurora-layer='main'] { animation-name: enconvo-aurora-main; animation-duration: 10s; }
[data-aurora-layer='return'] { animation-name: enconvo-aurora-return; }
[data-aurora-layer='lower'] { animation-name: enconvo-aurora-lower; animation-duration: 14s; }
[data-aurora-sweep] {
  position: absolute; top: 0; bottom: 0; left: 0; width: 24%; overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
}
[data-aurora-sweep] > div { position: absolute; top: 0; bottom: 0; left: 0; width: 416.667%; }
[data-aurora-sweep], [data-aurora-sweep] > div { will-change: transform; animation: enconvo-aurora-sweep 5s linear infinite; }
[data-aurora-sweep] > div { animation-name: enconvo-aurora-sweep-track; }
[data-aurora-sweep='return'], [data-aurora-sweep='return'] > div { animation-duration: 7s; animation-delay: -2s; }
[data-aurora-sweep='lower'], [data-aurora-sweep='lower'] > div { animation-duration: 6s; animation-delay: -3s; }
[data-hero-backdrop][data-motion='paused'] :is([data-aurora-layer], [data-aurora-sweep], [data-aurora-sweep] > div) { animation-play-state: paused; }
[data-aurora-shade] {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 38% 30% at 50% 21%, rgba(7,8,10,.8) 15%, rgba(7,8,10,.45) 60%, transparent),
    linear-gradient(rgba(7,8,10,.4), transparent 120px);
}
[data-aurora-grain] {
  position: absolute; inset: 0; opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23fff' filter='url(%23grain)' opacity='.5' d='M0 0h160v160H0z'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
[data-aurora-guides] {
  position: absolute; top: 0; bottom: 0; left: 50%;
  width: min(1168px, calc(100% - 64px)); transform: translateX(-50%);
  border-inline: 1px solid rgba(207,228,242,.06);
  -webkit-mask-image: linear-gradient(transparent, #000 15%, transparent 90%);
  mask-image: linear-gradient(transparent, #000 15%, transparent 90%);
}
@keyframes enconvo-aurora-drift { to { transform: translate(2%, -2%) scale(1.05); } }
@keyframes enconvo-aurora-main { to { transform: translate(2.5%, -3%) scale(1.04, 1.08); } }
@keyframes enconvo-aurora-return { to { transform: translate(-2%, 3%) scale(1.03, 1.1); } }
@keyframes enconvo-aurora-lower { to { transform: translate(2%, -3%) scale(1.06, 1.04); } }
/* The window crosses the backdrop while its track moves back as far, so the line stays put. */
@keyframes enconvo-aurora-sweep { from { transform: translateX(-100%); } to { transform: translateX(416.667%); } }
@keyframes enconvo-aurora-sweep-track { from { transform: translateX(24%); } to { transform: translateX(-100%); } }
@media (max-width: 639px) {
  [data-aurora-layer] svg { width: 960px; max-width: none; left: 50%; transform: translateX(-50%); opacity: .8; }
  [data-aurora-shade] { background: radial-gradient(ellipse 64% 36% at 50% 24%, rgba(7,8,10,.75), transparent); }
  [data-aurora-guides] { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-aurora-layer] { animation: none; }
  [data-aurora-sweep] { display: none; }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {
  [data-hero-backdrop] { display: none; }
}
`

const ribbon = 'M -180 680 C 170 470 360 680 650 400 S 1020 100 1550 -140'
const returnRibbon = 'M -180 40 C 140 -60 360 0 410 210 S 430 480 690 530 S 1220 420 1690 590'
const lowerRibbon = 'M -180 490 C 20 570 100 750 500 762 S 1170 650 1760 850'

function AuroraSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1600 800" fill="none" preserveAspectRatio="none" focusable="false">
      {children}
    </svg>
  )
}

// A highlight travelling along a ribbon: a soft window slides over a static copy of the line.
function Sweep({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-aurora-sweep={name}>
      <div>
        <AuroraSvg>{children}</AuroraSvg>
      </div>
    </div>
  )
}

export function HeroBackdrop({ paused = false }: { paused?: boolean }) {
  const id = `hero-light-${useId().replace(/:/g, '')}`
  const backdropRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop) return
    const rect = backdrop.getBoundingClientRect()
    let onScreen = rect.bottom > 0 && rect.top < window.innerHeight
    const sync = () => setActive(onScreen && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    observer.observe(backdrop)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return (
    <div ref={backdropRef} data-hero-backdrop data-motion={paused || !active ? 'paused' : 'running'} aria-hidden="true">
      <Head>
        <style id="enconvo-hero-backdrop" key="enconvo-hero-backdrop" dangerouslySetInnerHTML={{ __html: backdropStyles }} />
      </Head>
      <svg data-aurora-defs focusable="false">
        <defs>
          <linearGradient id={`${id}-spectrum`} x1="180" y1="600" x2="1350" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#59d499" stopOpacity="0" />
            <stop offset="0.22" stopColor="#59d4cf" />
            <stop offset="0.48" stopColor="#57c1ff" />
            <stop offset="0.72" stopColor="#7197ff" />
            <stop offset="0.9" stopColor="#ad9bff" />
            <stop offset="1" stopColor="#ad9bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-return`} x1="80" y1="100" x2="1480" y2="570" gradientUnits="userSpaceOnUse">
            <stop stopColor="#57c1ff" stopOpacity="0" />
            <stop offset="0.15" stopColor="#57c1ff" />
            <stop offset="0.4" stopColor="#62dec5" />
            <stop offset="0.7" stopColor="#57c1ff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#57c1ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-edge`} x1="250" y1="620" x2="1290" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ce6d6" stopOpacity="0" />
            <stop offset="0.3" stopColor="#b6f7e9" stopOpacity="0.8" />
            <stop offset="0.48" stopColor="#57c1ff" stopOpacity="0.15" />
            <stop offset="0.75" stopColor="#d7e4ff" />
            <stop offset="1" stopColor="#bcc6ff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-bloom`} x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
      </svg>

      <div data-aurora-layer="bloom">
        <AuroraSvg>
          <g filter={`url(#${id}-bloom)`} opacity="0.6">
            <path d={ribbon} stroke={`url(#${id}-spectrum)`} strokeWidth="64" />
            <path d={returnRibbon} stroke={`url(#${id}-return)`} strokeWidth="36" opacity="0.65" />
            <path d={lowerRibbon} stroke={`url(#${id}-spectrum)`} strokeWidth="48" opacity="0.65" />
          </g>
          <path d={ribbon} stroke={`url(#${id}-spectrum)`} strokeWidth="12" opacity="0.45" filter={`url(#${id}-soft)`} />
          <path d={returnRibbon} stroke={`url(#${id}-return)`} strokeWidth="5" opacity="0.45" filter={`url(#${id}-soft)`} />
        </AuroraSvg>
      </div>

      <div data-aurora-layer="main">
        <AuroraSvg>
          {Array.from({ length: 18 }, (_, index) => (
            <path
              key={`ribbon-${index}`}
              d={`M -180 ${680 + index * 5} C 170 ${470 + index * 2} ${360 + index * 3} ${680 + index * 2} ${650 + index * 3} ${400 + index * 3} S ${1020 + index * 5} ${100 + index * 3} ${1550 + index * 2} -140`}
              stroke={`url(#${id}-spectrum)`}
              strokeWidth={index === 0 ? 1.5 : 0.7}
              opacity={index === 0 ? 0.75 : 0.3 - index * 0.011}
            />
          ))}
          <path d={ribbon} stroke={`url(#${id}-edge)`} strokeWidth="1.5" opacity="0.55" />
        </AuroraSvg>
        <Sweep name="main">
          <path d={ribbon} stroke={`url(#${id}-edge)`} strokeWidth="3" />
        </Sweep>
      </div>

      <div data-aurora-layer="return">
        <AuroraSvg>
          {Array.from({ length: 10 }, (_, index) => (
            <path
              key={`return-${index}`}
              d={`M -180 ${40 + index * 6} C 140 ${-60 + index * 3} ${360 - index * 4} 0 ${410 - index * 3} ${210 + index * 2} S ${430 - index * 3} ${480 + index * 4} 690 ${530 + index * 3} S 1220 ${420 + index * 3} 1690 ${590 + index * 2}`}
              stroke={`url(#${id}-return)`}
              strokeWidth="0.75"
              opacity={0.25 - index * 0.017}
            />
          ))}
        </AuroraSvg>
        <Sweep name="return">
          <path d={returnRibbon} stroke="#83e8dc" strokeWidth="2" opacity="0.65" />
        </Sweep>
      </div>

      <div data-aurora-layer="lower">
        <AuroraSvg>
          {Array.from({ length: 12 }, (_, index) => (
            <path
              key={`lower-${index}`}
              d={`M -180 ${490 + index * 5} C 20 ${570 + index * 4} 100 ${750 + index * 2} 500 ${762 + index * 2} S 1170 ${650 + index * 4} 1760 ${850 + index * 3}`}
              stroke={`url(#${id}-spectrum)`}
              strokeWidth={index === 0 ? 1.5 : 0.75}
              opacity={index === 0 ? 0.6 : 0.25 - index * 0.012}
            />
          ))}
        </AuroraSvg>
        <Sweep name="lower">
          <path d={lowerRibbon} stroke={`url(#${id}-spectrum)`} strokeWidth="2.5" />
        </Sweep>
      </div>

      <div data-aurora-shade />
      <div data-aurora-grain />
      <div data-aurora-guides />
    </div>
  )
}
