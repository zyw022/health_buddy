import React, { useEffect, useRef, useState } from 'react'
import type { PetAction, PetSpecies } from '../store/types'
import { getSpriteConfig } from '../engine/spriteConfig'

interface Props {
  action:   PetAction
  species?: PetSpecies
  size?:    number
  className?: string
}

// Canvas-based sprite sheet animation component.
// Slices the sheet horizontally: frame i starts at sx = i * (imgW / cols).
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

  // Load / reload sprite sheet when action or species changes
  useEffect(() => {
    const cfg = getSpriteConfig(species, action)
    const src = cfg.file  // served from assetstore/ via Vite publicDir

    if (stateRef.current.currentSrc === src && stateRef.current.img?.complete) {
      // Same sheet — just reset frame index
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

  // rAF animation loop
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

      const cfg     = getSpriteConfig(species, action)
      const frameW  = img.naturalWidth / cfg.cols
      const frameH  = img.naturalHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const scale = Math.min(canvas.width / frameW, canvas.height / frameH)
      const dw    = frameW * scale
      const dh    = frameH * scale
      const dx    = (canvas.width  - dw) / 2
      const dy    = (canvas.height - dh) / 2

      ctx.drawImage(
        img,
        s.frameIdx * frameW, 0,   // source x, y
        frameW, frameH,            // source w, h
        dx, dy, dw, dh,            // dest x, y, w, h
      )
    }

    function loop(ts: number) {
      const cfg = getSpriteConfig(species, action)
      const interval = 1000 / cfg.fps

      if (ts - s.lastTick >= interval) {
        s.frameIdx  = (s.frameIdx + 1) % cfg.cols
        s.lastTick  = ts
        draw()
      }

      s.animId = requestAnimationFrame(loop)
    }

    draw()  // draw immediately on first load
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
