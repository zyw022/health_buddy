/**
 * Resize treehouse + furniture overlays to the same dimensions and
 * emit hitbox percentages for interactive hotspots.
 *
 * Run: npm run resize:materials
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const TREEHOUSE = path.join(ROOT, 'assetstore/materials/treehouse/treehouse.png')
const FURN_DIR = path.join(ROOT, 'assetstore/materials/furniture')
const OUT_BBOX = path.join(ROOT, 'src/pages/TreehouseReport/furniture-bboxes.json')

// Match electron window aspect (600×522) and existing compressed treehouse
const TARGET_W = 1200
const TARGET_H = 1042

const ALPHA_THRESH = 20

interface BBox { x1: number; y1: number; x2: number; y2: number }

function isFg(r: number, g: number, b: number, a: number): boolean {
  return a > ALPHA_THRESH || r > 25 || g > 25 || b > 25
}

function largestBBox(data: Uint8Array, w: number, h: number, ch: number): BBox | null {
  const vis = new Uint8Array(w * h)
  let best: BBox | null = null
  let bestArea = 0
  const at = (x: number, y: number) => (y * w + x) * ch

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (vis[y * w + x]) continue
      const o = at(x, y)
      if (!isFg(data[o], data[o + 1], data[o + 2], data[o + 3])) continue
      let x1 = x, y1 = y, x2 = x + 1, y2 = y + 1
      let area = 0
      const stack = [x, y]
      vis[y * w + x] = 1
      while (stack.length) {
        const cy = stack.pop()!
        const cx = stack.pop()!
        area++
        if (cx < x1) x1 = cx
        if (cy < y1) y1 = cy
        if (cx + 1 > x2) x2 = cx + 1
        if (cy + 1 > y2) y2 = cy + 1
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || vis[ny * w + nx]) continue
          const no = at(nx, ny)
          if (!isFg(data[no], data[no + 1], data[no + 2], data[no + 3])) continue
          vis[ny * w + nx] = 1
          stack.push(nx, ny)
        }
      }
      if (area > bestArea) {
        bestArea = area
        best = { x1, y1, x2, y2 }
      }
    }
  }
  return best
}

async function resizePng(filePath: string): Promise<{ data: Uint8Array; w: number; h: number; ch: number }> {
  const { data, info } = await sharp(filePath)
    .resize(TARGET_W, TARGET_H, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), w: info.width, h: info.height, ch: info.channels }
}

async function savePng(filePath: string, raw: Uint8Array, w: number, h: number, ch: number) {
  await sharp(Buffer.from(raw), { raw: { width: w, height: h, channels: ch } })
    .png({ compressionLevel: 9 })
    .toFile(filePath)
}

async function main() {
  const meta = await sharp(TREEHOUSE).metadata()
  console.log(`Source treehouse: ${meta.width}×${meta.height}`)
  console.log(`Target: ${TARGET_W}×${TARGET_H}\n`)

  // Treehouse
  const th = await resizePng(TREEHOUSE)
  await savePng(TREEHOUSE, th.data, th.w, th.h, th.ch)
  console.log(`  treehouse.png → ${TARGET_W}×${TARGET_H}`)

  const files = (await fs.readdir(FURN_DIR)).filter((f) => f.endsWith('.png')).sort()
  const bboxes: Record<string, { x: number; y: number; w: number; h: number }> = {}

  for (const name of files) {
    const fp = path.join(FURN_DIR, name)
    const srcMeta = await sharp(fp).metadata()
    if (srcMeta.width !== meta.width || srcMeta.height !== meta.height) {
      console.warn(`  WARN ${name} size ${srcMeta.width}×${srcMeta.height} ≠ treehouse`)
    }

    const frame = await resizePng(fp)
    await savePng(fp, frame.data, frame.w, frame.h, frame.ch)

    const bb = largestBBox(frame.data, frame.w, frame.h, frame.ch)
    const base = name.replace('.png', '')
    const id = base === 'pillow' ? 'sofa' : base
    if (bb) {
      const pad = 8
      const x1 = Math.max(0, bb.x1 - pad)
      const y1 = Math.max(0, bb.y1 - pad)
      const x2 = Math.min(frame.w, bb.x2 + pad)
      const y2 = Math.min(frame.h, bb.y2 + pad)
      bboxes[id] = {
        x: (x1 / frame.w) * 100,
        y: (y1 / frame.h) * 100,
        w: ((x2 - x1) / frame.w) * 100,
        h: ((y2 - y1) / frame.h) * 100,
      }
      console.log(`  ${name.padEnd(16)} hit ${bboxes[id].x.toFixed(1)}%,${bboxes[id].y.toFixed(1)}% ${bboxes[id].w.toFixed(1)}×${bboxes[id].h.toFixed(1)}%`)
    }
  }

  await fs.writeFile(OUT_BBOX, JSON.stringify(bboxes, null, 2))
  console.log(`\nWrote ${OUT_BBOX}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
