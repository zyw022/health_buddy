/**
 * Rebuild bird sprite sheets: 6 cols × 2 rows.
 * - Slice each sheet on a uniform grid (gaps between cells are fine)
 * - Per frame: keep only the largest connected opaque region (drops zzz noise etc.)
 * - Align all frames on a shared cell canvas (bottom-centered)
 *
 * Run: npm run rebuild:sprites
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SPRITE_DIR = path.join(ROOT, 'assetstore', 'pets', 'birds', 'gentle')

const COLS = 6
const ROWS = 2
const NFRAMES = COLS * ROWS
const CELL_OUT = 160
const PAD = 6
const ALPHA_THRESH = 20

interface BBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

function isForeground(r: number, g: number, b: number, a: number): boolean {
  return a > ALPHA_THRESH || (r > 25 || g > 25 || b > 25)
}

/** Flood-fill largest 4-connected foreground component; return its bbox. */
function largestComponentBBox(
  data: Uint8Array,
  w: number,
  h: number,
  channels: number,
): BBox | null {
  const visited = new Uint8Array(w * h)
  let best: BBox | null = null
  let bestArea = 0

  const idx = (x: number, y: number) => (y * w + x) * channels
  const vis = (x: number, y: number) => visited[y * w + x]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (vis(x, y)) continue
      const o = idx(x, y)
      if (!isForeground(data[o], data[o + 1], data[o + 2], data[o + 3])) continue

      let x1 = x, y1 = y, x2 = x, y2 = y
      let area = 0
      const stack: number[] = [x, y]
      visited[y * w + x] = 1

      while (stack.length) {
        const cy = stack.pop()!
        const cx = stack.pop()!
        area++
        if (cx < x1) x1 = cx
        if (cy < y1) y1 = cy
        if (cx + 1 > x2) x2 = cx + 1
        if (cy + 1 > y2) y2 = cy + 1

        const neighbors = [
          [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1],
        ]
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          if (vis(nx, ny)) continue
          const no = idx(nx, ny)
          if (!isForeground(data[no], data[no + 1], data[no + 2], data[no + 3])) continue
          visited[ny * w + nx] = 1
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

async function loadFrames(filePath: string) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const fw = Math.floor(width / COLS)
  const fh = Math.floor(height / ROWS)

  const frames: { data: Uint8Array; w: number; h: number; channels: number }[] = []

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sx = col * fw
      const sy = row * fh
      const slice = new Uint8Array(fw * fh * channels)
      for (let y = 0; y < fh; y++) {
        const srcOff = ((sy + y) * width + sx) * channels
        const dstOff = y * fw * channels
        slice.set(data.subarray(srcOff, srcOff + fw * channels), dstOff)
      }
      frames.push({ data: slice, w: fw, h: fh, channels })
    }
  }
  return { frames, fw, fh }
}

async function cropToBBox(
  frame: { data: Uint8Array; w: number; h: number; channels: number },
  bb: BBox,
): Promise<Buffer> {
  const { x1, y1, x2, y2 } = bb
  const cw = x2 - x1
  const ch = y2 - y1
  const out = Buffer.alloc(cw * ch * 4)
  const { data, w, channels } = frame

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y1 + y) * w + (x1 + x)) * channels
      const di = (y * cw + x) * 4
      out[di] = data[si]
      out[di + 1] = data[si + 1]
      out[di + 2] = data[si + 2]
      out[di + 3] = channels >= 4 ? data[si + 3] : 255
    }
  }
  return sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer()
}

async function main() {
  const files = (await fs.readdir(SPRITE_DIR))
    .filter((f) => f.endsWith('.png'))
    .sort()

  if (!files.length) {
    console.error('No PNG files in', SPRITE_DIR)
    process.exit(1)
  }

  console.log(`Found ${files.length} sheets — grid ${COLS}×${ROWS}\n`)

  // Pass 1: largest-component bbox per frame → union (in cell-normalised coords)
  const normBoxes: BBox[] = []
  const perFile: Map<string, Awaited<ReturnType<typeof loadFrames>>> = new Map()

  for (const name of files) {
    const fp = path.join(SPRITE_DIR, name)
    const meta = await sharp(fp).metadata()
    const loaded = await loadFrames(fp)
    perFile.set(name, loaded)

    console.log(`  ${name.padEnd(20)} ${meta.width}×${meta.height}  cell ${loaded.fw}×${loaded.fh}`)

    for (const frame of loaded.frames) {
      const bb = largestComponentBBox(frame.data, frame.w, frame.h, frame.channels)
      if (!bb) continue
      normBoxes.push({
        x1: bb.x1 / loaded.fw,
        y1: bb.y1 / loaded.fh,
        x2: bb.x2 / loaded.fw,
        y2: bb.y2 / loaded.fh,
      })
    }
  }

  if (!normBoxes.length) {
    console.error('No foreground pixels found.')
    process.exit(1)
  }

  const union: BBox = {
    x1: Math.min(...normBoxes.map((b) => b.x1)),
    y1: Math.min(...normBoxes.map((b) => b.y1)),
    x2: Math.max(...normBoxes.map((b) => b.x2)),
    y2: Math.max(...normBoxes.map((b) => b.y2)),
  }

  console.log(`\nUnion content (normalised): (${union.x1.toFixed(3)},${union.y1.toFixed(3)}) → (${union.x2.toFixed(3)},${union.y2.toFixed(3)})`)
  console.log(`Output sheet: ${CELL_OUT * COLS}×${CELL_OUT * ROWS}, cell ${CELL_OUT}px\n`)

  const sheetW = CELL_OUT * COLS
  const sheetH = CELL_OUT * ROWS
  const maxInner = CELL_OUT - PAD * 2

  for (const name of files) {
    const loaded = perFile.get(name)!
    const { frames, fw, fh } = loaded

    const cx1 = Math.floor(union.x1 * fw)
    const cy1 = Math.floor(union.y1 * fh)
    const cx2 = Math.min(fw, Math.ceil(union.x2 * fw))
    const cy2 = Math.min(fh, Math.ceil(union.y2 * fh))

    const composites: sharp.OverlayOptions[] = []

    for (let idx = 0; idx < NFRAMES; idx++) {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const frame = frames[idx]
      const bb = largestComponentBBox(frame.data, frame.w, frame.h, frame.channels)
      const useBb = bb ?? { x1: cx1, y1: cy1, x2: cx2, y2: cy2 }

      // Intersect with union so all frames share the same crop window
      const crop: BBox = {
        x1: Math.max(useBb.x1, cx1),
        y1: Math.max(useBb.y1, cy1),
        x2: Math.min(useBb.x2, cx2),
        y2: Math.min(useBb.y2, cy2),
      }
      if (crop.x2 <= crop.x1 || crop.y2 <= crop.y1) continue

      let png = await cropToBBox(frame, crop)
      const meta = await sharp(png).metadata()
      const cw = meta.width!
      const ch = meta.height!
      const scale = Math.min(maxInner / cw, maxInner / ch, 1)
      const nw = Math.max(1, Math.round(cw * scale))
      const nh = Math.max(1, Math.round(ch * scale))

      if (scale < 1) {
        png = await sharp(png).resize(nw, nh, { kernel: sharp.kernel.nearest }).png().toBuffer()
      }

      // Bottom-center alignment in cell
      const left = col * CELL_OUT + Math.floor((CELL_OUT - nw) / 2)
      const top = row * CELL_OUT + (CELL_OUT - PAD - nh)

      composites.push({ input: png, left, top })
    }

    const base = await sharp({
      create: {
        width: sheetW,
        height: sheetH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toBuffer()

    const outPath = path.join(SPRITE_DIR, name)
    await fs.writeFile(outPath, base)
    const kb = (await fs.stat(outPath)).size / 1024
    console.log(`  rebuilt ${name.padEnd(20)} ${sheetW}×${sheetH}  ${kb.toFixed(1)} KB`)
  }

  console.log('\nDone. spriteConfig: cols=6, rows=2')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
