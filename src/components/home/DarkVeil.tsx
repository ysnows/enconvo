import { useEffect, useRef, useState } from 'react'
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'
import { fragment, vertex } from './darkVeilShader'
import styles from '@/styles/Home.module.css'

interface DarkVeilProps {
  paused?: boolean
  hueShift?: number
  noiseIntensity?: number
  scanlineIntensity?: number
  speed?: number
  scanlineFrequency?: number
  warpAmount?: number
  resolutionScale?: number
}

// Adapted from React Bits DarkVeil; see DarkVeil.LICENSE.md.
export default function DarkVeil({
  paused = false,
  hueShift = 0,
  noiseIntensity = 0.015,
  scanlineIntensity = 0,
  speed = 0.8,
  scanlineFrequency = 0,
  warpAmount = 0.35,
  resolutionScale = 0.7,
}: DarkVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const syncRef = useRef<(() => void) | null>(null)
  const elapsedRef = useRef(8)
  const [contextGeneration, setContextGeneration] = useState(0)

  useEffect(() => {
    pausedRef.current = paused
    syncRef.current?.()
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hideDecoration = window.matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)')
    let renderer: Renderer | undefined
    let geometry: Triangle | undefined
    let program: Program | undefined
    let frame = 0
    let lastTick = 0
    let lastDraw = 0
    let lost = false
    let disposed = false
    let visible = false

    const releaseGraphics = () => {
      if (!renderer?.gl || renderer.gl.isContextLost()) return
      geometry?.remove()
      if (program) {
        renderer.gl.deleteShader(program.vertexShader)
        renderer.gl.deleteShader(program.fragmentShader)
        program.remove()
      }
    }

    try {
      renderer = new Renderer({ canvas, dpr: 1, alpha: false, depth: false, antialias: false, powerPreference: 'low-power' })
      const gl = renderer.gl
      geometry = new Triangle(gl)
      program = new Program(gl, {
        vertex,
        fragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: elapsedRef.current * speed },
          uResolution: { value: new Vec2() },
          uHueShift: { value: hueShift },
          uNoise: { value: noiseIntensity },
          uScan: { value: scanlineIntensity },
          uScanFreq: { value: scanlineFrequency },
          uWarp: { value: warpAmount },
          uLightMode: { value: 0 },
        },
      })
      if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) throw new Error('DarkVeil shader unavailable')
    } catch {
      canvas.dataset.ready = 'false'
      canvas.dataset.motion = 'unavailable'
      releaseGraphics()
      return
    }

    const activeRenderer = renderer
    const activeProgram = program
    const mesh = new Mesh(activeRenderer.gl, { geometry, program: activeProgram })

    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      lastTick = 0
    }

    const draw = () => {
      if (disposed || lost || hideDecoration.matches || document.hidden || !visible) return
      activeProgram.uniforms.uTime.value = elapsedRef.current * speed
      activeRenderer.render({ scene: mesh })
      canvas.dataset.ready = 'true'
    }

    const canAnimate = () => visible && !document.hidden && !lost && !disposed &&
      !pausedRef.current && !reducedMotion.matches && !hideDecoration.matches

    const loop = (now: number) => {
      frame = 0
      if (!canAnimate()) return
      // Limit the expensive shader to 30fps, independent of display refresh rate.
      if (now - lastDraw >= 1000 / 30 - 0.5) {
        if (lastTick) elapsedRef.current += Math.min((now - lastTick) / 1000, 0.1)
        lastTick = now
        lastDraw = now
        draw()
      }
      frame = requestAnimationFrame(loop)
    }

    const sync = () => {
      stop()
      canvas.dataset.motion = canAnimate() ? 'running' : 'paused'
      if (canAnimate()) frame = requestAnimationFrame(loop)
      else draw()
    }

    const resize = () => {
      const { width, height, top, bottom } = parent.getBoundingClientRect()
      visible = width > 0 && height > 0 && bottom > 0 && top < window.innerHeight
      if (!width || !height || lost) return
      activeRenderer.dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1 : 1.5) * resolutionScale
      activeRenderer.setSize(width, height)
      // gl_FragCoord is in drawing-buffer pixels, including DPR and render scale.
      activeProgram.uniforms.uResolution.value.set(activeRenderer.gl.drawingBufferWidth, activeRenderer.gl.drawingBufferHeight)
      draw()
      sync()
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      lost = true
      stop()
      canvas.dataset.ready = 'false'
      canvas.dataset.motion = 'unavailable'
    }
    const onContextRestored = () => setContextGeneration(value => value + 1)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    const resizeObserver = new ResizeObserver(resize)

    syncRef.current = sync
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('resize', resize)
    reducedMotion.addEventListener('change', sync)
    hideDecoration.addEventListener('change', sync)
    visibilityObserver.observe(parent)
    resizeObserver.observe(parent)
    resize()

    return () => {
      disposed = true
      stop()
      syncRef.current = null
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('resize', resize)
      reducedMotion.removeEventListener('change', sync)
      hideDecoration.removeEventListener('change', sync)
      releaseGraphics()
    }
  }, [contextGeneration, hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale])

  return <canvas ref={canvasRef} className={styles.darkVeil} aria-hidden="true" />
}
