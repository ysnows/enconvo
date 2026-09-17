import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/visibleVideo.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function fixture({ reduced = false, saveData = false, pending = false, noVideo = false } = {}) {
  let intersection, resolvePlay
  const listeners = new Map(), preferences = new Map(), states = []
  const preference = { matches: reduced, addEventListener: (k, v) => preferences.set(k, v), removeEventListener: k => preferences.delete(k) }
  const document = { hidden: false, addEventListener: (k, v) => listeners.set(k, v), removeEventListener: k => listeners.delete(k) }
  const video = { paused: true, ended: false, muted: false, plays: 0, pauses: 0,
    play() { this.paused = false; this.plays++; return pending ? new Promise(r => { resolvePlay = r }) : Promise.resolve() },
    pause() { this.paused = true; this.pauses++ },
  }
  let disconnected = false
  const context = { exports: {}, document, navigator: { connection: { saveData } }, window: { matchMedia: () => preference },
    IntersectionObserver: class { constructor(fn) { intersection = fn } observe() {} disconnect() { disconnected = true } },
  }
  vm.runInNewContext(code, context)
  const stop = context.exports.observeVideoPlayback({}, noVideo ? null : video, active => states.push(active))
  return { video, states, stop, listeners, preferences,
    visible: value => intersection([{ isIntersecting: value }]),
    hidden: value => { document.hidden = value; listeners.get('visibilitychange')?.() },
    reduce: value => { preference.matches = value; preferences.get('change')?.() },
    settle: () => resolvePlay?.(), disconnected: () => disconnected,
  }
}

const normal = fixture()
normal.visible(false)
assert.equal(normal.video.plays, 0, 'offscreen media never starts')
normal.visible(true)
assert.equal(normal.video.plays, 1)
normal.hidden(true)
assert.equal(normal.video.paused, true, 'hidden page pauses')
normal.hidden(false)
assert.equal(normal.video.plays, 2, 'previously playing video resumes')
normal.video.pause()
normal.visible(false)
normal.visible(true)
assert.equal(normal.video.plays, 2, 'manual pause survives leaving and returning')
assert.equal(normal.video.muted, false, 'visibility changes preserve the sound preference')
normal.stop()
assert.ok(normal.disconnected())
assert.equal(normal.listeners.size + normal.preferences.size, 0)

for (const options of [{ reduced: true }, { saveData: true }]) {
  const f = fixture(options)
  f.visible(true)
  assert.equal(f.video.plays, 0, 'reduced-motion/save-data prevents automatic playback')
  await f.video.play()
  f.visible(false)
  f.visible(true)
  assert.equal(f.video.plays, 2, 'explicit playback can resume')
  f.reduce(true)
  assert.equal(f.video.paused, true)
  f.stop()
}
const race = fixture({ pending: true })
race.visible(true)
race.visible(false)
race.settle()
await Promise.resolve()
assert.equal(race.video.paused, true, 'late play resolution cannot restart offscreen media')
race.stop()
const placeholder = fixture({ noVideo: true })
placeholder.visible(true)
placeholder.visible(false)
assert.deepEqual(placeholder.states, [true, false], 'non-video rotation follows visibility too')
placeholder.stop()
console.log('PASS: media visibility, manual pause, sound preference, reduced motion, data saving, async race, cleanup, placeholder activity')
