'use client'

import { useEffect, useRef } from 'react'
import {
  MOTION_CHANGE_EVENT,
  readMotionPreference,
  resolveMotionEnabled,
} from '@/lib/motion-preference'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  phase: number
  sway: number
  tint: number
}

interface Bokeh {
  x: number
  y: number
  radius: number
  alpha: number
  drift: number
  phase: number
  tint: number
}

/** Tonos de la marca: azul, cian, índigo y turquesa. */
const TINTS = ['56,189,248', '99,102,241', '14,165,233', '45,212,191']

const LINK_DISTANCE = 150

function createGlowSprite(rgb: string, size = 64) {
  const sprite = document.createElement('canvas')
  sprite.width = size
  sprite.height = size
  const context = sprite.getContext('2d')
  if (!context) return sprite

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, `rgba(255,255,255,0.95)`)
  gradient.addColorStop(0.28, `rgba(${rgb},0.85)`)
  gradient.addColorStop(0.62, `rgba(${rgb},0.22)`)
  gradient.addColorStop(1, `rgba(${rgb},0)`)

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  return sprite
}

/**
 * Campo de partículas moderno para la pantalla de inicio de sesión.
 * - Canvas 2D con sprites de brillo pre-renderizados (rendimiento estable).
 * - Se adapta al tamaño real del contenedor y al devicePixelRatio.
 * - Pausa cuando la pestaña no está visible y se detiene si la persona
 *   desactiva las animaciones de la interfaz.
 */
export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const sprites = TINTS.map((rgb) => createGlowSprite(rgb))

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let bokeh: Bokeh[] = []
    let frame = 0
    let lastTime = 0
    let motionEnabled = resolveMotionEnabled(readMotionPreference())
    const pointer = { x: -9999, y: -9999 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.max(44, Math.min(110, Math.round((width * height) / 9500)))
      const bokehTarget = Math.max(4, Math.min(9, Math.round(width / 240)))

      particles = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(0.14 + Math.random() * 0.34),
        radius: 1.3 + Math.random() * 2.6,
        alpha: 0.38 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        sway: 0.4 + Math.random() * 0.9,
        tint: Math.floor(Math.random() * TINTS.length),
      }))

      bokeh = Array.from({ length: bokehTarget }, () => ({
        x: Math.random() * width,
        y: height * (0.25 + Math.random() * 0.75),
        radius: 70 + Math.random() * 150,
        alpha: 0.09 + Math.random() * 0.1,
        drift: 0.08 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        tint: Math.floor(Math.random() * TINTS.length),
      }))
    }

    const draw = (time: number) => {
      const delta = lastTime ? Math.min(48, time - lastTime) : 16
      lastTime = time
      const step = delta / 16.67

      context.clearRect(0, 0, width, height)

      // Círculos de luz (bokeh) para dar profundidad
      for (const orb of bokeh) {
        const sprite = sprites[orb.tint]
        const wobble = Math.sin(time / 2600 + orb.phase) * 18 * orb.drift
        context.globalAlpha = orb.alpha
        context.drawImage(
          sprite,
          orb.x + wobble - orb.radius,
          orb.y - orb.radius,
          orb.radius * 2,
          orb.radius * 2
        )
      }
      context.globalAlpha = 1

      // Partículas
      for (const particle of particles) {
        particle.phase += 0.012 * step
        particle.x += (particle.vx + Math.sin(particle.phase) * 0.28 * particle.sway) * step
        particle.y += particle.vy * step

        // Ligera reacción al puntero
        const dx = pointer.x - particle.x
        const dy = pointer.y - particle.y
        const distance = Math.hypot(dx, dy)
        if (distance < 150 && distance > 0.01) {
          const push = (1 - distance / 150) * 0.32
          particle.x -= (dx / distance) * push * step
          particle.y -= (dy / distance) * push * step
        }

        if (particle.y < -20) {
          particle.y = height + 20
          particle.x = Math.random() * width
        }
        if (particle.x < -20) particle.x = width + 20
        if (particle.x > width + 20) particle.x = -20

        const sprite = sprites[particle.tint]
        const size = particle.radius * 8.5
        context.globalAlpha = particle.alpha
        context.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size)
      }
      context.globalAlpha = 1

      // Conexiones entre partículas cercanas
      context.lineWidth = 0.9
      for (let i = 0; i < particles.length; i += 1) {
        const first = particles[i]
        for (let j = i + 1; j < particles.length; j += 1) {
          const second = particles[j]
          const dx = first.x - second.x
          const dy = first.y - second.y
          const distance = Math.hypot(dx, dy)
          if (distance > LINK_DISTANCE) continue

          const opacity = (1 - distance / LINK_DISTANCE) * 0.32
          context.strokeStyle = `rgba(${TINTS[first.tint]},${opacity.toFixed(3)})`
          context.beginPath()
          context.moveTo(first.x, first.y)
          context.lineTo(second.x, second.y)
          context.stroke()
        }
      }
    }

    const loop = (time: number) => {
      if (!motionEnabled) return
      draw(time)
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(frame)
      lastTime = 0
      if (motionEnabled) frame = requestAnimationFrame(loop)
      else draw(0)
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
      } else {
        start()
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }

    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    const syncMotion = () => {
      motionEnabled = resolveMotionEnabled(readMotionPreference())
      start()
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (!motionEnabled) draw(0)
    })
    observer.observe(canvas)

    resize()
    start()

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener(MOTION_CHANGE_EVENT, syncMotion)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener(MOTION_CHANGE_EVENT, syncMotion)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 32%, #000 72%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 32%, #000 72%)',
      }}
    />
  )
}
