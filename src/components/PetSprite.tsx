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

  useEffect(() => {
    const cfg = getSpriteConfig(species, action)
    const src = cfg.file

    if (stateRef.current.currentSrc === src && stateRef.current.img?.complete) {
      stateRef.current.frameIdx = 0
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

      const scale = Math.min(canvas.width / frameW, canvas.height / frameH)
      const dw    = frameW * scale
      const dh    = frameH * scale
      const dx    = (canvas.width  - dw) / 2
      const dy    = (canvas.height - dh) / 2

      ctx.drawImage(
        img,
        srcX, srcY, frameW, frameH,
        dx, dy, dw, dh,
      )
    }

    function loop(ts: number) {
      const cfg = getSpriteConfig(species, action)
      const totalFrames = cfg.cols * cfg.rows
      const interval = 1000 / cfg.fps

      if (ts - s.lastTick >= interval) {
        s.frameIdx = (s.frameIdx + 1) % totalFrames
        s.lastTick = ts
        draw()
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
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: size * 0.35 }}>🐦</span>
        </div>
      )}
    </div>
  )
}
