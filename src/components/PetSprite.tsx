import React, { useEffect, useRef, useState } from 'react'
import type { PetAction, PetSpecies } from '../store/types'
import { getSpriteConfig } from '../engine/spriteConfig'

interface Props {
  action:   PetAction
  species?: PetSpecies
  size?:    number
  className?: string
}

// Canvas sprite animation: grid slice cols × rows, row-major frame order.
export const PetSprite: React.FC<Props> = ({ action, species = 'sparrow', size = 120, className = '' }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const stateRef   = useRef({
    img:        null as HTMLImageElement | null,
    frameIdx:   0,
    lastTick:   0,
    animId:     0,
    currentSrc: '',
  })

  const [loaded, setLoaded] = useState(false)

  // For idle action: pause on frame 0 between blink cycles (simulate occasional blinking)
  const idlePauseRef = useRef<{ pauseUntil: number }>({ pauseUntil: 0 })

  // Whether the sprite is currently flipped horizontally (idle only)
  const flipRef = useRef<boolean>(false)

  useEffect(() => {
    const cfg = getSpriteConfig(species, action)
    const src = cfg.file

    if (stateRef.current.currentSrc === src && stateRef.current.img?.complete) {
      stateRef.current.frameIdx = 0
      idlePauseRef.current.pauseUntil = 0
      if (action !== 'idle') flipRef.current = false
      return
    }

    stateRef.current.currentSrc = src
    stateRef.current.frameIdx   = 0
    stateRef.current.img        = null
    setLoaded(false)

    const img = new Image()
    img.src   = src
    img.onload = () => {
      stateRef.current.img = img
      setLoaded(true)
    }
    img.onerror = () => {
      console.warn(`[PetSprite] failed to load ${src}`)
    }
  }, [action, species])

  useEffect(() => {
    const s = stateRef.current
    if (!loaded) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!ctx || !canvas) return
      const img = s.img
      if (!img || !img.complete || img.naturalWidth === 0) return

      const cfg        = getSpriteConfig(species, action)
      const frameW     = img.naturalWidth / cfg.cols
      const frameH     = img.naturalHeight / cfg.rows
      const col        = s.frameIdx % cfg.cols
      const row        = Math.floor(s.frameIdx / cfg.cols)
      const srcX       = col * frameW
      const srcY       = row * frameH

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const drawScale = Math.min(canvas.width / frameW, canvas.height / frameH)
      const dw    = frameW * drawScale
      const dh    = frameH * drawScale
      const dx    = (canvas.width  - dw) / 2
      const dy    = (canvas.height - dh) / 2

      if (flipRef.current) {
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, srcX, srcY, frameW, frameH, canvas.width - dx - dw, dy, dw, dh)
        ctx.restore()
      } else {
        ctx.drawImage(img, srcX, srcY, frameW, frameH, dx, dy, dw, dh)
      }
    }

    function loop(ts: number) {
      const cfg = getSpriteConfig(species, action)
      const totalFrames = cfg.cols * cfg.rows

      if (action === 'idle') {
        // Occasional blink: play through all frames once, then pause on frame 0 for 2-4s
        if (ts < idlePauseRef.current.pauseUntil) {
          // In pause phase — hold frame 0, wait
        } else {
          const blinkInterval = 1000 / cfg.fps
          if (ts - s.lastTick >= blinkInterval) {
            const next = s.frameIdx + 1
            if (next >= totalFrames) {
              // Finished one blink cycle — return to frame 0 and schedule a pause
              s.frameIdx = 0
              const pauseMs = 2000 + Math.random() * 2000  // 2–4 s
              idlePauseRef.current.pauseUntil = ts + pauseMs
              // ~30% chance to flip direction when settling after a blink
              if (Math.random() < 0.3) {
                flipRef.current = !flipRef.current
              }
            } else {
              s.frameIdx = next
            }
            s.lastTick = ts
            draw()
          }
        }
      } else {
        const interval = 1000 / cfg.fps
        if (ts - s.lastTick >= interval) {
          s.frameIdx = (s.frameIdx + 1) % totalFrames
          s.lastTick = ts
          draw()
        }
      }

      s.animId = requestAnimationFrame(loop)
    }

    draw()
    s.animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(s.animId)
    }
  }, [loaded, action, species])

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
    </div>
  )
}
