import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart, DimensionChart, LineChart } from '../../components/HealthChart'
import { TreehouseShell } from '../../components/TreehouseShell'
import { getElectronAPI, usePetStore } from '../../store/petStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import { useAdviceHistoryStore } from '../../store/adviceHistoryStore'
import {
  FURNITURE,
  type ChartSeriesBundle,
  type FurnitureDef,
  type HotspotId,
} from './hotspots'

// ── CSS keyframe animations (injected once) ──────────────────────────────────
const FURNITURE_STYLE_ID = 'furniture-anim-styles'
function ensureFurnitureStyles() {
  if (document.getElementById(FURNITURE_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = FURNITURE_STYLE_ID
  style.textContent = `
    @keyframes furniturePulseScale {
      0%   { transform: scale(1); }
      25%  { transform: scale(1.28); }
      55%  { transform: scale(0.91); }
      80%  { transform: scale(1.14); }
      100% { transform: scale(1); }
    }
    @keyframes furnitureGlowNormal {
      0%,100% { filter: drop-shadow(0 0 0px  rgba(140,210,255,0)); }
      40%     { filter: drop-shadow(0 0 10px rgba(140,210,255,0.9)) drop-shadow(0 0 22px rgba(140,210,255,0.5)); }
      70%     { filter: drop-shadow(0 0 4px  rgba(140,210,255,0.35)); }
    }
    @keyframes furnitureGlowGoldHover {
      0%,100% { filter: drop-shadow(0 0 4px  rgba(255,200,30,0.55)) drop-shadow(0 0 8px rgba(255,180,0,0.35)); }
      50%     { filter: drop-shadow(0 0 14px rgba(255,215,50,1.0))  drop-shadow(0 0 28px rgba(255,200,0,0.7)); }
    }
    @keyframes furnitureGlowGoldIdle {
      0%,100% { filter: drop-shadow(0 0 3px  rgba(255,190,20,0.3)); }
      50%     { filter: drop-shadow(0 0 9px  rgba(255,205,30,0.65)) drop-shadow(0 0 18px rgba(255,190,0,0.4)); }
    }
    .furn-pulse           { animation: furniturePulseScale    2.5s ease-in-out infinite; }
    .furn-glow-normal     { animation: furnitureGlowNormal    2.5s ease-in-out infinite; }
    .furn-glow-gold-hover { animation: furnitureGlowGoldHover 1.6s ease-in-out infinite; }
    .furn-glow-gold-idle  { animation: furnitureGlowGoldIdle  3.2s ease-in-out infinite; }
  `
  document.head.appendChild(style)
}

// ── Panel sub-components ──────────────────────────────────────────────────────

interface PanelProps {
  item:    FurnitureDef
  series:  ChartSeriesBundle | null
  onClose: () => void
}

const LINE_COLORS: Partial<Record<HotspotId, string>> = {
  note: '#c4b5fd', clock: '#7dd3fc',
}
const BAR_COLORS: Partial<Record<HotspotId, string>> = {
  bowl: '#67e8f9', flower: '#86efac', lamp: '#fde68a', potion: '#fca5a5',
}

const ChartPanel: React.FC<PanelProps> = ({ item, series }) => {
  if (!series) return <p className="text-white/40 text-xs px-1 py-2">数据加载中…</p>
  if (item.panelType === 'chart-dimensions') {
    const d = series.dimensions
    return (
      <DimensionChart
        title={d.title}
        dims={[
          { label: '能量', value: d.energy,    color: '#86efac' },
          { label: '压力', value: d.stress,    color: '#fca5a5' },
          { label: '过劳', value: d.burnout,   color: '#fdba74' },
          { label: '久坐', value: d.sedentary, color: '#93c5fd' },
        ]}
        width={260} height={130}
      />
    )
  }
  const key = item.seriesKey as keyof Omit<ChartSeriesBundle, 'dimensions'> | undefined
  if (!key) return null
  const s = series[key]
  if (!s || !('points' in s)) return null
  if (item.panelType === 'chart-line')
    return <LineChart title={s.title} unit={s.unit} points={s.points}
      color={LINE_COLORS[item.id] ?? '#7dd3fc'} width={260} height={130} />
  return <BarChart title={s.title} unit={s.unit} points={s.points}
    color={BAR_COLORS[item.id] ?? '#86efac'} width={260} height={130} />
}

const PX = '"Press Start 2P", monospace'

const PreferencesPanel: React.FC<PanelProps> = ({ onClose: _onClose }) => {
  const { items, add, remove } = usePreferencesStore()
  const [draft, setDraft] = useState('')
  const submit = async () => { if (draft.trim()) { await add(draft); setDraft('') } }
  return (
    <div style={{ width: '100%' }}>
      <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 10 }}>
        {items.length === 0 && (
          <p style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,255,255,0.3)', lineHeight: 2 }}>
            还没有偏好，添加一条吧
          </p>
        )}
        {items.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: PX, fontSize: 6, color: '#fde68a', flexShrink: 0, marginTop: 1 }}>▸</span>
            <p style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.9, flex: 1 }}>{p.text}</p>
            <button onClick={() => void remove(p.id)}
              style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void submit() }}
          placeholder="新增偏好…" maxLength={50}
          style={{
            flex: 1, fontFamily: PX, fontSize: 5,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(253,230,138,0.3)',
            color: 'white', padding: '6px 8px', outline: 'none',
          }} />
        <button onClick={() => void submit()} disabled={!draft.trim()}
          style={{
            fontFamily: PX, fontSize: 6, padding: '6px 10px',
            background: '#fde68a', color: '#1a1205',
            border: 'none', cursor: 'pointer', opacity: draft.trim() ? 1 : 0.35,
          }}>+</button>
      </div>
    </div>
  )
}

const HistoryPanel: React.FC<PanelProps> = ({ onClose: _onClose }) => {
  const { records, clear } = useAdviceHistoryStore()
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return (
    <div style={{ width: '100%' }}>
      {records.length > 0 && (
        <button onClick={() => void clear()}
          style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,80,80,0.6)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8 }}>
          CLEAR ALL
        </button>
      )}
      <div style={{ maxHeight: 170, overflowY: 'auto' }}>
        {records.length === 0 && (
          <p style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,255,255,0.3)', lineHeight: 2 }}>
            还没有记录，跟宠物多互动吧
          </p>
        )}
        {records.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: PX, fontSize: 4, color: 'rgba(253,230,138,0.5)', flexShrink: 0, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.createdAt)}</span>
            <p style={{ fontFamily: PX, fontSize: 5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Ornate pixel frame SVG — draws a thick decorative border around content ──
// The frame is rendered as a full-size absolute SVG overlay; content sits on top.
// Frame thickness = FRAME variable (px on each side).
const FRAME = 18

const OrnateFrame: React.FC<{ w: number; h: number; isGold: boolean }> = ({ w, h, isGold }) => {
  const gold1 = isGold ? '#fde68a' : '#7dd3fc'
  const gold2 = isGold ? '#c8960a' : '#0e7490'
  const gold3 = isGold ? '#8b6914' : '#164e63'
  const dark  = isGold ? '#1a1000' : '#020b18'
  const F = FRAME

  // Helper: horizontal strip across full width at given y, height th
  const HStrip = (y: number, th: number, fill: string, op = 1) =>
    <rect key={`h${y}`} x={0} y={y} width={w} height={th} fill={fill} opacity={op} />
  const VStrip = (x: number, tw: number, fill: string, op = 1) =>
    <rect key={`v${x}`} x={x} y={0} width={tw} height={h} fill={fill} opacity={op} />

  // Corner square ornament (layered pixel squares)
  const CornerOrnament = (cx: number, cy: number) => {
    const s = F
    return (
      <g key={`c${cx}${cy}`}>
        <rect x={cx} y={cy} width={s} height={s} fill={gold2} />
        <rect x={cx+2} y={cy+2} width={s-4} height={s-4} fill={gold1} />
        <rect x={cx+4} y={cy+4} width={s-8} height={s-8} fill={gold3} />
        <rect x={cx+6} y={cy+6} width={s-12} height={s-12} fill={gold1} opacity={0.6} />
        {/* 4 pixel dots around centre */}
        <rect x={cx+1}   y={cy+s/2-1} width={2} height={2} fill={gold1} />
        <rect x={cx+s-3} y={cy+s/2-1} width={2} height={2} fill={gold1} />
        <rect x={cx+s/2-1} y={cy+1}   width={2} height={2} fill={gold1} />
        <rect x={cx+s/2-1} y={cy+s-3} width={2} height={2} fill={gold1} />
      </g>
    )
  }

  // Side bead pattern (repeating 2×4 px beads along edges)
  const HBeads = (y: number, bh: number) => {
    const beads = []
    for (let x = F; x < w - F; x += 6) {
      beads.push(<rect key={x} x={x} y={y+1} width={4} height={bh-2} fill={gold1} opacity={0.5} rx={1} />)
    }
    return <g key={`hb${y}`}>{beads}</g>
  }
  const VBeads = (x: number, bw: number) => {
    const beads = []
    for (let y = F; y < h - F; y += 6) {
      beads.push(<rect key={y} x={x+1} y={y} width={bw-2} height={4} fill={gold1} opacity={0.5} rx={1} />)
    }
    return <g key={`vb${x}`}>{beads}</g>
  }

  return (
    <svg
      width={w} height={h}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', imageRendering: 'pixelated', zIndex: 1 }}
    >
      {/* Outer fill — frame background */}
      {HStrip(0, F, gold3)}
      {HStrip(h-F, F, gold3)}
      {VStrip(0, F, gold3)}
      {VStrip(w-F, F, gold3)}

      {/* Outer edge highlight */}
      {HStrip(0, 2, gold1, 0.8)}
      {HStrip(h-2, 2, gold1, 0.8)}
      {VStrip(0, 2, gold1, 0.8)}
      {VStrip(w-2, 2, gold1, 0.8)}

      {/* Inner shadow groove */}
      {HStrip(F-3, 3, dark, 0.7)}
      {HStrip(h-F, 3, dark, 0.7)}
      {VStrip(F-3, 3, dark, 0.7)}
      {VStrip(w-F, 3, dark, 0.7)}

      {/* Inner highlight (content area edge) */}
      {HStrip(F-1, 1, gold1, 0.55)}
      {HStrip(h-F, 1, gold1, 0.55)}
      {VStrip(F-1, 1, gold1, 0.55)}
      {VStrip(w-F, 1, gold1, 0.55)}

      {/* Bead decorations on frame face */}
      {HBeads(3, F-6)}
      {HBeads(h-F+3, F-6)}
      {VBeads(3, F-6)}
      {VBeads(w-F+3, F-6)}

      {/* Mid-frame ridge lines */}
      {HStrip(Math.floor(F/2)-1, 2, gold2, 0.9)}
      {HStrip(h - Math.floor(F/2)-1, 2, gold2, 0.9)}
      {VStrip(Math.floor(F/2)-1, 2, gold2, 0.9)}
      {VStrip(w - Math.floor(F/2)-1, 2, gold2, 0.9)}

      {/* Corner ornaments (always on top) */}
      {CornerOrnament(0, 0)}
      {CornerOrnament(w-F, 0)}
      {CornerOrnament(0, h-F)}
      {CornerOrnament(w-F, h-F)}

      {/* Top-centre diamond badge */}
      <g transform={`translate(${w/2},${F/2})`}>
        <rect x={-5} y={-5} width={10} height={10} fill={gold2} transform="rotate(45)" />
        <rect x={-3} y={-3} width={6}  height={6}  fill={gold1} transform="rotate(45)" />
        <rect x={-1} y={-1} width={2}  height={2}  fill={dark}  transform="rotate(45)" />
      </g>
    </svg>
  )
}

// ── HoverPanel — ornate frame wrapping compact content ───────────────────────
const HoverPanel: React.FC<{
  item:    FurnitureDef
  pos:     { x: number; y: number }
  series:  ChartSeriesBundle | null
  onClose: () => void
}> = ({ item, pos, series, onClose }) => {
  const isGold  = item.glowType === 'gold'
  const accent  = isGold ? '#fde68a' : '#7dd3fc'
  const bg      = isGold ? 'rgba(14,10,2,0.98)' : 'rgba(3,7,18,0.98)'
  const glow    = isGold
    ? '0 0 32px rgba(253,230,138,0.3), 0 6px 24px rgba(0,0,0,0.9)'
    : '0 0 22px rgba(125,211,252,0.2), 0 6px 24px rgba(0,0,0,0.9)'
  const PXF     = '"Press Start 2P", monospace'
  const panelW  = (item.panelType === 'preferences' || item.panelType === 'history') ? 260 : 280

  // Measure actual rendered height to size the SVG frame correctly
  const wrapRef = useRef<HTMLDivElement>(null)
  const [frameH, setFrameH] = useState(0)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      setFrameH(entries[0].contentRect.height + entries[0].contentRect.top * 0)
    })
    ro.observe(wrapRef.current)
    setFrameH(wrapRef.current.offsetHeight)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      key={item.id}
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 6 }}
      transition={{ duration: 0.14, ease: [0, 0, 0.2, 1] }}
      style={{
        position:    'absolute',
        left: pos.x, top: pos.y,
        width:       panelW,
        background:  bg,
        boxShadow:   glow,
        zIndex:      50,
        pointerEvents: 'auto',
      }}
    >
      {/* Ornate SVG frame — sized to actual panel dimensions */}
      {frameH > 0 && <OrnateFrame w={panelW} h={frameH} isGold={isGold} />}

      {/* Content inside the frame — padded by FRAME px */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: `${FRAME + 2}px ${FRAME}px ${FRAME + 2}px ${FRAME}px`,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
          <span style={{
            fontFamily: PXF, fontSize: 6, color: accent,
            letterSpacing: '0.06em', lineHeight: 1,
            textShadow: `0 0 6px ${accent}88`,
          }}>
            {item.label}
          </span>
          <span style={{ fontFamily: PXF, fontSize: 4, color: 'rgba(255,255,255,0.28)', lineHeight: 1 }}>
            {item.hint}
          </span>
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: FRAME - 2, right: FRAME,
          fontFamily: PXF, fontSize: 6,
          color: accent, background: 'transparent', border: 'none',
          cursor: 'pointer', lineHeight: 1, padding: 0,
        }}>✕</button>

        {/* Chart / preferences / history content */}
        {(item.panelType === 'chart-line' || item.panelType === 'chart-bar' || item.panelType === 'chart-dimensions') &&
          <ChartPanel item={item} series={series} onClose={onClose} />}
        {item.panelType === 'preferences' &&
          <PreferencesPanel item={item} series={series} onClose={onClose} />}
        {item.panelType === 'history' &&
          <HistoryPanel item={item} series={series} onClose={onClose} />}
      </div>
    </motion.div>
  )
}

// ── FurnitureItem — single piece with hover animation and click handler ────────
const FurnitureItem: React.FC<{
  item:    FurnitureDef
  index:   number
  pinned:  FurnitureDef | null
  onEnter: (item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => void
  onLeave: () => void
  onClick: (item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => void
}> = ({ item, index, pinned, onEnter, onLeave, onClick }) => {
  const [hovered,  setHovered]  = useState(false)
  const [visible,  setVisible]  = useState(false)   // pure CSS opacity fade-in
  const isGold   = item.glowType === 'gold'
  const isPinned = pinned?.id === item.id
  const isActive = hovered || isPinned
  const { x, y, w, h } = item.hitbox

  // Staggered fade-in via CSS transition — no framer-motion on this element
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), (0.12 + index * 0.04) * 1000)
    return () => clearTimeout(t)
  }, [index])

  // Scale origin at the centre of the hitbox (in % of container)
  const ox = `${x + w / 2}%`
  const oy = `${y + h / 2}%`

  // CSS animation classes — only CSS, framer never touches transform
  const scaleClass = isActive ? 'furn-pulse' : ''
  const glowClass  = isActive
    ? (isGold ? 'furn-glow-gold-hover' : 'furn-glow-normal')
    : (isGold ? 'furn-glow-gold-idle' : '')

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Opacity wrapper — plain CSS transition, no framer, no transform */}
      <div
        className="absolute inset-0"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        {/* Scale layer — only the scale keyframe, transform-origin at hitbox centre */}
        <div
          className={`absolute inset-0 ${scaleClass}`}
          style={{ transformOrigin: `${ox} ${oy}` }}
        >
          {/* Glow layer — only the drop-shadow keyframe, separate from scale so
              both CSS animations can run concurrently without overwriting each other */}
          <div className={`absolute inset-0 ${glowClass}`}>
            <img
              src={item.src}
              alt={item.label}
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>

      {/* Invisible hit-target sized to actual furniture silhouette */}
      <button
        type="button"
        style={{
          position:      'absolute',
          left:          `${x}%`,
          top:           `${y}%`,
          width:         `${w}%`,
          height:        `${h}%`,
          background:    'transparent',
          border:        'none',
          cursor:        'pointer',
          pointerEvents: 'auto',
        }}
        className="focus:outline-none"
        onMouseEnter={(e) => { setHovered(true);  onEnter(item, e) }}
        onMouseLeave={() =>   { setHovered(false); onLeave() }}
        onClick={(e) => onClick(item, e)}
        aria-label={item.label}
        title={item.hint}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TreehouseReport: React.FC = () => {
  const config      = usePetStore((s) => s.config)
  const { load: loadPrefs }   = usePreferencesStore()
  const { load: loadHistory } = useAdviceHistoryStore()

  const [series,   setSeries]   = useState<ChartSeriesBundle | null>(null)
  const [pinned,   setPinned]   = useState<FurnitureDef | null>(null)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { ensureFurnitureStyles() }, [])
  useEffect(() => { void loadPrefs()   }, [loadPrefs])
  useEffect(() => { void loadHistory() }, [loadHistory])

  useEffect(() => {
    const load = async () => {
      const api = getElectronAPI()
      if (!api) return
      const data = await api.readData('chart-series.json') as ChartSeriesBundle | null
      if (data) { setSeries(data); return }
      const today = await api.readData('health-today.json') as {
        raw?:  {
          sleepMinutes?: number; sleepQuality?: number
          waterCups?: number; steps?: number
          sedentaryMinutes?: number; activeMinutes?: number; heartRate?: number
        }
        state?: { energy?: number; stress?: number; burnout?: number; sedentary?: number }
      } | null
      if (today?.raw && today?.state) {
        const d  = new Date().toISOString().split('T')[0]
        const pt = (v: number) => [{ date: d, label: d, value: v }]
        const slh = Math.round((today.raw.sleepMinutes ?? 0) / 60 * 10) / 10
        setSeries({
          book:     { title: '睡眠时长', unit: '小时', points: pt(slh) },
          note:     { title: '睡眠时长', unit: '小时', points: pt(slh) },
          clock:    { title: '久坐分钟', unit: '分钟', points: pt(today.raw.sedentaryMinutes ?? 0) },
          cup:      { title: '饮水杯数', unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          bowl:     { title: '饮水杯数', unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          shoes:    { title: '步数',     unit: '步',   points: pt(today.raw.steps ?? 0) },
          flower:   { title: '步数',     unit: '步',   points: pt(today.raw.steps ?? 0) },
          lamp:     { title: '活跃时长', unit: '分钟', points: pt(today.raw.activeMinutes ?? 0) },
          painting: { title: '睡眠质量', unit: '分',   points: pt((today.raw.sleepQuality ?? 3) * 20) },
          potion:   { title: '心率',     unit: 'bpm',  points: pt(today.raw.heartRate ?? 0) },
          dimensions: {
            title:     '今日四维度',
            energy:    today.state.energy    ?? 0,
            stress:    today.state.stress    ?? 0,
            burnout:   today.state.burnout   ?? 0,
            sedentary: today.state.sedentary ?? 0,
          },
        })
      }
    }
    void load()
  }, [])

  const calcPos = useCallback((el: HTMLElement) => {
    const rect   = el.getBoundingClientRect()
    const winW   = window.innerWidth
    const winH   = window.innerHeight
    const panelW = 300
    const panelH = 260
    const x = rect.right + 10 + panelW > winW ? rect.left - panelW - 10 : rect.right + 10
    const y = Math.max(8, Math.min(rect.top - 20, winH - panelH - 8))
    return { x, y }
  }, [])

  const onEnter = useCallback((_item: FurnitureDef, _e: React.MouseEvent<HTMLButtonElement>) => {
    // hover state is managed inside FurnitureItem; nothing to do here
  }, [])

  const onLeave = useCallback(() => {}, [])

  const onClickItem = useCallback((item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (pinned?.id === item.id) {
      setPinned(null)
    } else {
      setPanelPos(calcPos(e.currentTarget))
      setPinned(item)
    }
  }, [pinned, calcPos])

  // Furniture scene — rendered inside the treehouse ParallaxLayer (same depth)
  const furnitureScene = (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {FURNITURE.map((item, i) => (
        <FurnitureItem
          key={item.id}
          item={item}
          index={i}
          pinned={pinned}
          onEnter={onEnter}
          onLeave={onLeave}
          onClick={onClickItem}
        />
      ))}
    </div>
  )

  return (
    <TreehouseShell
      title={config?.name ? `${config.name} 的树屋` : '健康树屋'}
      subtitle="悬停家具查看健康数据"
      sceneLayer={furnitureScene}
      actions={
        <button
          type="button"
          onClick={() => getElectronAPI()?.openTreehouse('change-pet')}
          className="text-white/85 hover:text-white text-[11px] font-medium tracking-wide transition-opacity"
          style={{ background: 'transparent', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          更换宠物
        </button>
      }
    >
      {/* Click-away to close pinned panel */}
      {pinned && (
        <div
          className="absolute inset-0 z-30"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setPinned(null)}
        />
      )}

      {/* Data panel */}
      <AnimatePresence>
        {pinned && (
          <HoverPanel
            key={pinned.id}
            item={pinned}
            pos={panelPos}
            series={series}
            onClose={() => setPinned(null)}
          />
        )}
      </AnimatePresence>
    </TreehouseShell>
  )
}

export default TreehouseReport
