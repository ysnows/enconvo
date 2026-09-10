import Head from 'next/head'
import styles from '@/styles/Home.module.css'

// Next's development CSS chunks can arrive separately. Ship the small layout
// subset in the SSR head so the first paint already matches the styled Hero.
// Keep geometry in sync with Home.module.css; check-hero-first-paint.mjs
// exercises both the delayed-CSS and fully styled versions of the real markup.
const layout = `
.${styles.page} {
  background: #07080a; color: #f4f4f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  font-feature-settings: 'calt', 'kern', 'liga', 'ss03';
  -webkit-font-smoothing: antialiased;
}
.${styles.page} :is(h1, h2, h3, p, a, button, span, th) { letter-spacing: 0; }
.${styles.hero} { position: relative; z-index: 2; isolation: isolate; overflow: hidden; }
.${styles.hero} header { isolation: isolate; background: transparent; border-color: transparent; backdrop-filter: none; }
.${styles.hero} header nav { max-width: 1240px; min-height: 64px; margin: 0 auto; padding: 12px 24px; }
.${styles.hero} header nav > div > a > svg { height: 28px; }
.${styles.hero} header nav a { font-weight: 500; }
.${styles.heroContent} { position: relative; z-index: 1; padding: 108px 24px 64px; }
.${styles.heroInner} { width: 100%; max-width: 1168px; margin: 0 auto; }
.${styles.heroCopy} { max-width: 820px; margin: 0 auto; text-align: center; }
.${styles.heroTitle} { font-size: 56px; font-weight: 600; line-height: 1.1; text-wrap: balance; }
:where(.${styles.heroTitleAccent}) { color: #d1e4ee; }
.${styles.heroDescription} { max-width: 680px; margin: 20px auto 0; color: #cdcdcd; font-size: 18px; line-height: 1.6; text-wrap: pretty; }
.${styles.heroActions} { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 24px; }
.${styles.downloadButton} { min-height: 48px; padding: 12px 22px; border-radius: 10px; font-size: 14px; }
.${styles.requirements} { font-size: 12px; line-height: 18px; color: #9c9c9d; }
.${styles.showcase} { width: 100%; max-width: 1120px; margin: 28px auto 0; }
.${styles.tabScroller} { overflow-x: auto; padding: 5px; scrollbar-width: thin; }
.${styles.tabs} { display: flex; width: max-content; gap: 4px; margin: 0 auto; padding: 4px; border: 1px solid var(--home-stroke, rgba(255,255,255,.1)); border-radius: 12px; background: rgba(13,16,19,.88); }
.${styles.tab} { flex: none; min-height: 40px; padding: 8px 14px; border: 1px solid transparent; border-radius: 8px; color: #9c9c9d; font-size: 13px; font-weight: 500; white-space: nowrap; }
.${styles.tab}[aria-selected='true'] { color: #f4f4f6; border-color: var(--home-stroke-strong, rgba(255,255,255,.2)); background: rgba(255,255,255,.085); }
.${styles.scenes} { display: flex; justify-content: center; gap: 4px; min-height: 32px; margin-top: 4px; overflow-x: auto; scrollbar-width: thin; }
.${styles.scenes} button { flex: none; min-height: 32px; }
.${styles.scenesHidden} { visibility: hidden; }
.${styles.player} { position: relative; isolation: isolate; aspect-ratio: 16 / 9; margin-top: 8px; overflow: hidden; border: 1px solid var(--home-stroke-strong, rgba(255,255,255,.2)); border-radius: 12px; background: #101111; }
.${styles.player}:fullscreen { border: 0; border-radius: 0; }
.${styles.playerMedia} { position: absolute; inset: 0; width: 100%; height: 100%; }
.${styles.playerControls} { display: flex; align-items: center; gap: 12px; position: absolute; inset: auto 0 0; z-index: 10; padding: 24px 12px 8px; background: linear-gradient(transparent,rgba(0,0,0,.8)); }
.${styles.playerButton} { display: flex; flex: none; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid rgba(255,255,255,.18); border-radius: 8px; background: rgba(0,0,0,.4); color: #f4f4f6; }
.${styles.player} .${styles.seek} { height: 36px; background-color: transparent; background-size: 100% 4px; background-repeat: no-repeat; background-position: center; }
.${styles.soundButton} { min-height: 40px; border-radius: 8px; }
.${styles.showcaseCaption} { max-width: 680px; min-height: 40px; margin: 16px auto 0; text-align: center; font-size: 13px; line-height: 1.6; color: #9c9c9d; }
@media (max-width: 1023px) {
  .${styles.tab} { min-height: 44px; }
  .${styles.heroTitle} { font-size: 48px; }
  .${styles.scenes} { justify-content: flex-start; }
  .${styles.scenes} button:first-child { margin-left: auto; }
  .${styles.scenes} button:last-child { margin-right: auto; }
}
@media (max-width: 639px) {
  .${styles.heroContent} { padding: 100px 20px 48px; }
  .${styles.heroTitle} { font-size: 34px; line-height: 1.15; }
  .${styles.heroDescription} { font-size: 16px; line-height: 1.65; margin-top: 16px; }
  .${styles.heroActions} { margin-top: 20px; }
  .${styles.showcase} { margin-top: 24px; }
  .${styles.tabScroller} { margin-inline: -4px; }
  .${styles.tab} { padding-inline: 12px; }
  .${styles.tabs} { margin: 0; }
  .${styles.scenes} { min-height: 36px; }
  .${styles.scenes} button { min-height: 36px; }
  .${styles.player} { border-radius: 10px; }
  .${styles.playerControls} { gap: 8px; padding: 20px 8px 4px; }
  .${styles.playerButton}, .${styles.player} .${styles.seek} { height: 44px; }
  .${styles.playerButton} { width: 44px; }
  .${styles.player} .${styles.soundButton} { top: 8px; right: 8px; min-height: 44px; padding-inline: 10px; }
  .${styles.showcaseCaption} { min-height: 62px; margin-top: 12px; font-size: 12px; }
}
`

export function HeroLayout() {
  return (
    <Head>
      <style id="enconvo-hero-layout" key="enconvo-hero-layout">
        {layout}
      </style>
    </Head>
  )
}
