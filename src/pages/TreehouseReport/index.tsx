import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart, DimensionChart, LineChart } from '../../components/HealthChart'
import { TreehouseShell } from '../../components/TreehouseShell'
import { PetSprite } from '../../components/PetSprite'
import { getElectronAPI, usePetStore } from '../../store/petStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import { useAdviceHistoryStore } from '../../store/adviceHistoryStore'
import { useShopStore, SHOP_ITEMS, type ShopItem } from '../../store/shopStore'
import type { PetAction, PetSpecies } from '../../store/types'
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
  note:    '#c4b5fd',   // 紫 — 睡眠
  clock:   '#7dd3fc',   // 蓝 — 久坐
  potion:  '#fb7185',   // 红 — 心率
}
const BAR_COLORS: Partial<Record<HotspotId, string>> = {
  bowl:    '#67e8f9',   // 青 — 饮水
  flower:  '#86efac',   // 绿 — 步数
  lamp:    '#fde68a',   // 金 — 活跃
  painting:'#a78bfa',   // 紫 — 睡眠质量
}

const ChartPanel: React.FC<PanelProps> = ({ item, series }) => {
  if (!series) return (
    <p style={{ fontFamily:'"Press Start 2P",monospace', fontSize:5, color:'rgba(255,255,255,0.35)', padding:'6px 0' }}>
      数据加载中…
    </p>
  )
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
      />
    )
  }
  const key = item.seriesKey as keyof Omit<ChartSeriesBundle, 'dimensions' | 'generatedAt' | 'sourceDays'> | undefined
  if (!key) return null
  const s = series[key]
  if (!s || !('points' in s)) return null
  if (item.panelType === 'chart-line')
    return <LineChart title={s.title} unit={s.unit} points={s.points}
      color={LINE_COLORS[item.id] ?? '#7dd3fc'} />
  return <BarChart title={s.title} unit={s.unit} points={s.points}
    color={BAR_COLORS[item.id] ?? '#86efac'} />
}

const PX = '"Press Start 2P", monospace'

const PreferencesPanel: React.FC<PanelProps> = ({ onClose: _onClose }) => {
  const { items, add, remove } = usePreferencesStore()
  const [draft, setDraft] = useState('')
  const submit = async () => { if (draft.trim()) { await add(draft); setDraft('') } }
  return (
    <div style={{ width: '100%' }}>
      <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 8 }}>
        {items.length === 0 && (
          <p style={{ fontFamily: PX, fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
            还没有偏好，添加一条吧
          </p>
        )}
        {items.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: PX, fontSize: 8, color: '#fde68a', flexShrink: 0, marginTop: 1 }}>▸</span>
            <p style={{ fontFamily: PX, fontSize: 9, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, flex: 1 }}>{p.text}</p>
            <button onClick={() => void remove(p.id)}
              style={{ fontFamily: PX, fontSize: 8, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void submit() }}
          placeholder="新增偏好…" maxLength={50}
          style={{
            flex: 1, fontFamily: PX, fontSize: 9,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(253,230,138,0.3)',
            color: 'white', padding: '5px 8px', outline: 'none',
          }} />
        <button onClick={() => void submit()} disabled={!draft.trim()}
          style={{
            fontFamily: PX, fontSize: 9, padding: '5px 10px',
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
          style={{ fontFamily: PX, fontSize: 8, color: 'rgba(255,80,80,0.65)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 6 }}>
          CLEAR ALL
        </button>
      )}
      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
        {records.length === 0 && (
          <p style={{ fontFamily: PX, fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
            还没有记录，跟宠物多互动吧
          </p>
        )}
        {records.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: PX, fontSize: 7, color: 'rgba(253,230,138,0.55)', flexShrink: 0, marginTop: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(r.createdAt)}</span>
            <p style={{ fontFamily: PX, fontSize: 9, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Thin pixel frame (F=8px) with corner ornaments ───────────────────────────
const FRAME = 8

const OrnateFrame: React.FC<{ w: number; h: number; isGold: boolean }> = ({ w, h, isGold }) => {
  const c1   = isGold ? '#fde68a' : '#7dd3fc'   // bright
  const c2   = isGold ? '#a3720a' : '#0e7490'   // mid
  const c3   = isGold ? '#5a3d06' : '#0c3547'   // dark frame fill
  const dark = isGold ? '#120900' : '#020b18'

  // Frame strips (top/bottom/left/right bands, thickness = FRAME)
  const strips = (
    <>
      {/* Frame fill */}
      <rect x={0}      y={0}      width={w}     height={FRAME} fill={c3} />
      <rect x={0}      y={h-FRAME} width={w}    height={FRAME} fill={c3} />
      <rect x={0}      y={FRAME}  width={FRAME} height={h-FRAME*2} fill={c3} />
      <rect x={w-FRAME} y={FRAME} width={FRAME} height={h-FRAME*2} fill={c3} />
      {/* Outer bright edge */}
      <rect x={0} y={0} width={w} height={1} fill={c1} opacity={0.9} />
      <rect x={0} y={h-1} width={w} height={1} fill={c1} opacity={0.9} />
      <rect x={0} y={0} width={1} height={h} fill={c1} opacity={0.9} />
      <rect x={w-1} y={0} width={1} height={h} fill={c1} opacity={0.9} />
      {/* Mid ridge */}
      <rect x={1} y={3} width={w-2} height={1} fill={c2} opacity={0.7} />
      <rect x={1} y={h-4} width={w-2} height={1} fill={c2} opacity={0.7} />
      <rect x={3} y={1} width={1} height={h-2} fill={c2} opacity={0.7} />
      <rect x={w-4} y={1} width={1} height={h-2} fill={c2} opacity={0.7} />
      {/* Inner groove (shadow at content edge) */}
      <rect x={0} y={FRAME-1} width={w} height={1} fill={dark} opacity={0.8} />
      <rect x={0} y={h-FRAME} width={w} height={1} fill={dark} opacity={0.8} />
      <rect x={FRAME-1} y={0} width={1} height={h} fill={dark} opacity={0.8} />
      <rect x={w-FRAME} y={0} width={1} height={h} fill={dark} opacity={0.8} />
    </>
  )

  // Bead row (3px beads every 5px on the frame face centre line)
  const hBeadY = FRAME / 2 - 1
  const hBeads = (yy: number) => {
    const out = []
    for (let x = FRAME + 3; x < w - FRAME - 3; x += 5)
      out.push(<rect key={x} x={x} y={yy} width={3} height={2} fill={c1} opacity={0.45} />)
    return out
  }
  const vBeadX = FRAME / 2 - 1
  const vBeads = (xx: number) => {
    const out = []
    for (let y = FRAME + 3; y < h - FRAME - 3; y += 5)
      out.push(<rect key={y} x={xx} y={y} width={2} height={3} fill={c1} opacity={0.45} />)
    return out
  }

  // Corner: 8×8 block — outer square, then inner hollow, then dot
  const Corn = (cx: number, cy: number) => (
    <g key={`${cx}${cy}`}>
      <rect x={cx}   y={cy}   width={8} height={8} fill={c2} />
      <rect x={cx+1} y={cy+1} width={6} height={6} fill={c1} />
      <rect x={cx+2} y={cy+2} width={4} height={4} fill={c3} />
      <rect x={cx+3} y={cy+3} width={2} height={2} fill={c1} opacity={0.7} />
    </g>
  )

  return (
    <svg width={w} height={h}
      style={{ position:'absolute', inset:0, pointerEvents:'none', imageRendering:'pixelated', zIndex:1 }}>
      {strips}
      {hBeads(hBeadY)}
      {hBeads(h - hBeadY - 2)}
      {vBeads(vBeadX)}
      {vBeads(w - vBeadX - 2)}
      {Corn(0, 0)}
      {Corn(w-8, 0)}
      {Corn(0, h-8)}
      {Corn(w-8, h-8)}
      {/* Diamond centre-top */}
      <g transform={`translate(${w/2},${FRAME/2})`}>
        <rect x={-4} y={-4} width={8} height={8} fill={c2} transform="rotate(45)" />
        <rect x={-2} y={-2} width={4} height={4} fill={c1} transform="rotate(45)" />
      </g>
    </svg>
  )
}

// ── HoverPanel — rendered via Portal to body so it's never clipped ───────────
const HoverPanel: React.FC<{
  item:    FurnitureDef
  pos:     { x: number; y: number }
  series:  ChartSeriesBundle | null
  onClose: () => void
}> = ({ item, pos, series, onClose }) => {
  const isGold = item.glowType === 'gold'
  const accent = isGold ? '#fde68a' : '#7dd3fc'
  const bg     = isGold ? 'rgba(14,10,2,0.97)' : 'rgba(3,7,18,0.97)'
  const glow   = isGold
    ? '0 0 24px rgba(253,230,138,0.28), 0 4px 18px rgba(0,0,0,0.9)'
    : '0 0 18px rgba(125,211,252,0.18), 0 4px 18px rgba(0,0,0,0.9)'
  const PXF    = '"Press Start 2P", monospace'
  const panelW = (item.panelType === 'preferences' || item.panelType === 'history') ? 240 : 256

  const wrapRef = useRef<HTMLDivElement>(null)
  const [frameH, setFrameH] = useState(0)
  // Clamped position — adjusted after render so panel never overflows the screen
  const [clampedPos, setClampedPos] = useState(pos)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h  = el.offsetHeight
      const w  = el.offsetWidth
      setFrameH(h)
      // Re-clamp position now we know actual dimensions
      const margin = 6
      const maxX = window.innerWidth  - w  - margin
      const maxY = window.innerHeight - h  - margin
      setClampedPos({
        x: Math.max(margin, Math.min(pos.x, maxX)),
        y: Math.max(margin, Math.min(pos.y, maxY)),
      })
    })
    ro.observe(el)
    setFrameH(el.offsetHeight)
    return () => ro.disconnect()
  }, [pos])

  const P = FRAME + 4

  const panel = (
    <motion.div
      key={item.id}
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.92, y: 5 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 5 }}
      transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
      style={{ position:'fixed', left:clampedPos.x, top:clampedPos.y, width:panelW,
               background:bg, boxShadow:glow, zIndex:9999, pointerEvents:'auto' }}
    >
      {frameH > 0 && <OrnateFrame w={panelW} h={frameH} isGold={isGold} />}

      <div style={{ position:'relative', zIndex:2, padding:`${P}px ${P}px ${P}px ${P}px` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
            <span style={{ fontFamily:PXF, fontSize:8, color:accent, lineHeight:1,
              textShadow:`0 0 6px ${accent}66` }}>{item.label}</span>
            <span style={{ fontFamily:PXF, fontSize:5, color:'rgba(255,255,255,0.3)', lineHeight:1 }}>
              {item.hint}</span>
          </div>
          <button onClick={onClose} style={{
            fontFamily:PXF, fontSize:7, color:accent,
            background:'transparent', border:'none', cursor:'pointer', lineHeight:1, padding:'0 0 0 6px',
          }}>✕</button>
        </div>

        <div style={{
          height:1, marginBottom:6,
          background:`repeating-linear-gradient(to right,${accent}55 0,${accent}55 3px,transparent 3px,transparent 6px)`
        }}/>

        {(item.panelType==='chart-line'||item.panelType==='chart-bar'||item.panelType==='chart-dimensions') &&
          <ChartPanel item={item} series={series} onClose={onClose} />}
        {item.panelType==='preferences' &&
          <PreferencesPanel item={item} series={series} onClose={onClose} />}
        {item.panelType==='history' &&
          <HistoryPanel item={item} series={series} onClose={onClose} />}
      </div>
    </motion.div>
  )

  // Portal to body — escapes any parent overflow:hidden or transform stacking context
  return createPortal(panel, document.body)
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

// ── Shared pixel-box style ────────────────────────────────────────────────────
const pxBox = (bg = 'rgba(8,12,28,0.96)'): React.CSSProperties => ({
  background:           bg,
  outline:              '2px solid rgba(255,255,255,0.82)',
  outlineOffset:        '2px',
  border:               '2px solid rgba(0,0,0,0.85)',
  boxShadow:            '0 4px 20px rgba(0,0,0,0.65), inset -3px -3px 0px rgba(255,255,255,0.10)',
  imageRendering:       'pixelated' as const,
  backdropFilter:       'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
})

const PXF = '"Press Start 2P", monospace'

// Canopy bubble — small floating entry with icon + label, pixel border
const CanopyBubble: React.FC<{
  icon:    string
  label:   string
  delay:   number
  pos:     { left: string; top: string }
  active:  boolean
  accent?: string
  onClick: (ref: HTMLButtonElement) => void
}> = ({ icon, label, delay, pos, active, accent = 'rgba(255,255,255,0.85)', onClick }) => {
  const [hov, setHov] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.8 + delay * 0.25, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.35 }}
      style={{ position: 'absolute', ...pos, pointerEvents: 'auto', zIndex: 6 }}
    >
      <button
        ref={ref}
        type="button"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => ref.current && onClick(ref.current)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            5,
          padding:        '5px 9px',
          background:     active ? 'rgba(255,255,255,0.30)' : hov ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.16)',
          outline:        active ? `2px solid ${accent}` : `2px solid rgba(255,255,255,0.80)`,
          outlineOffset:  '2px',
          border:         '2px solid rgba(0,0,0,0.82)',
          boxShadow:      '0 2px 10px rgba(0,0,0,0.5), inset -2px -2px 0px rgba(255,255,255,0.26)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          imageRendering: 'pixelated',
          cursor:         'pointer',
          transition:     'background 0.1s, outline-color 0.1s',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontFamily: PXF, fontSize: 6, fontWeight: 'bold',
          color: active ? accent : 'rgba(255,255,255,0.92)',
          textShadow: '0 1px 3px rgba(0,0,0,0.85)', lineHeight: 1 }}>
          {label}
        </span>
      </button>
    </motion.div>
  )
}

// ── Action labels (Chinese) ───────────────────────────────────────────────────
const ACTION_LABELS: Record<PetAction, string> = {
  idle:     '发呆',
  happy:    '开心',
  talk:     '说话',
  yawn:     '打哈欠',
  sleep:    '睡觉',
  worried:  '担忧',
  stretch:  '伸懒腰',
  takeoff:  '起飞',
  flyhappy: '欢快飞',
  drowsy:   '犯困',
}

const ACTIONS_ORDER: PetAction[] = [
  'idle','happy','talk','yawn','sleep','worried','stretch','takeoff','drowsy','flyhappy',
]

// Shared pixel-box style (same as OvalBubble but inline for the panel)
const pixelBox = (bg = 'rgba(8,12,28,0.96)'): React.CSSProperties => ({
  background:           bg,
  outline:              '2px solid rgba(255,255,255,0.85)',
  outlineOffset:        '2px',
  border:               '2px solid rgba(0,0,0,0.85)',
  boxShadow:            '0 4px 18px rgba(0,0,0,0.6), inset -3px -3px 0px rgba(255,255,255,0.12)',
  imageRendering:       'pixelated',
  backdropFilter:       'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
})

// ── Action panel (popup menu, same HoverPanel style) ─────────────────────────
const ActionPanel: React.FC<{
  species:  PetSpecies
  pos:      { x: number; y: number }
  onClose:  () => void
}> = ({ species, pos, onClose }) => {
  const [fired, setFired] = useState<PetAction | null>(null)
  const PXF = '"Press Start 2P", monospace'

  const trigger = useCallback((action: PetAction) => {
    void getElectronAPI()?.triggerPetAction(action)
    setFired(action)
    setTimeout(() => setFired(null), 800)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1,   y: 0 }}
      exit={{    opacity: 0, scale: 0.9, y: 6 }}
      transition={{ duration: 0.14, ease: [0, 0, 0.2, 1] }}
      style={{
        position:     'fixed',
        left:         pos.x,
        top:          pos.y,
        zIndex:       9999,
        pointerEvents:'auto',
        width:        248,
        ...pixelBox(),
      }}
    >
      {/* Title bar */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '7px 10px 5px',
        borderBottom:   '2px solid rgba(255,255,255,0.15)',
      }}>
        <span style={{ fontFamily: PXF, fontSize: 7, color: '#7dd3fc',
          textShadow: '0 0 6px #7dd3fc66' }}>动作控制台</span>
        <button onClick={onClose} style={{
          fontFamily: PXF, fontSize: 7, color: '#7dd3fc',
          background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1,
        }}>✕</button>
      </div>

      {/* 2-column grid of actions */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 6,
        padding:             8,
      }}>
        {ACTIONS_ORDER.map((action) => {
          const isFired = fired === action
          return (
            <button
              key={action}
              type="button"
              onClick={() => trigger(action)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            3,
                padding:        '5px 4px',
                background:     isFired ? 'rgba(253,230,138,0.22)' : 'rgba(255,255,255,0.05)',
                outline:        isFired ? '2px solid rgba(253,200,50,0.9)' : '2px solid rgba(255,255,255,0.25)',
                outlineOffset:  '1px',
                border:         '1px solid rgba(0,0,0,0.6)',
                cursor:         'pointer',
                transition:     'background 0.1s, outline-color 0.1s',
                imageRendering: 'pixelated',
              }}
            >
              <PetSprite action={action} species={species} size={38} />
              <span style={{
                fontFamily: PXF,
                fontSize:   5,
                fontWeight: 'bold',
                color:      isFired ? '#fde68a' : 'rgba(255,255,255,0.85)',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                lineHeight: 1,
              }}>{ACTION_LABELS[action]}</span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Charts overview panel ─────────────────────────────────────────────────────
const ChartsPanel: React.FC<{
  series:  ChartSeriesBundle | null
  pos:     { x: number; y: number }
  onClose: () => void
}> = ({ series, pos, onClose }) => {
  const [tab, setTab] = useState<'time'|'dims'>('time')
  const charts = series ? [
    { title: series.note.title,   unit: series.note.unit,   points: series.note.points,   color: '#c4b5fd', type: 'line' as const },
    { title: series.clock.title,  unit: series.clock.unit,  points: series.clock.points,  color: '#7dd3fc', type: 'line' as const },
    { title: series.bowl.title,   unit: series.bowl.unit,   points: series.bowl.points,   color: '#67e8f9', type: 'bar'  as const },
    { title: series.flower.title, unit: series.flower.unit, points: series.flower.points, color: '#86efac', type: 'bar'  as const },
    { title: series.potion.title, unit: series.potion.unit, points: series.potion.points, color: '#fb7185', type: 'line' as const },
  ] : []
  const [chartIdx, setChartIdx] = useState(0)
  const cur = charts[chartIdx]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }} transition={{ duration: 0.13 }}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: 300, zIndex: 9999, pointerEvents: 'auto', ...pxBox() }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px 6px', borderBottom:'2px solid rgba(255,255,255,0.12)' }}>
        <span style={{ fontFamily: PXF, fontSize: 9, color: '#86efac', textShadow: '0 0 6px #86efac66' }}>📊 健康图表</span>
        <button onClick={onClose} style={{ fontFamily: PXF, fontSize: 9, color: '#86efac', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
      </div>
      {/* Tab: time series / dimensions */}
      <div style={{ display:'flex', borderBottom:'2px solid rgba(255,255,255,0.10)', padding:'4px 10px 0' }}>
        {(['time','dims'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: PXF, fontSize: 7, padding: '4px 10px',
            background: tab===t ? 'rgba(134,239,172,0.18)' : 'transparent',
            color: tab===t ? '#86efac' : 'rgba(255,255,255,0.45)',
            border: 'none', borderBottom: tab===t ? '2px solid #86efac' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -2,
          }}>{t==='time' ? '时序' : '四维度'}</button>
        ))}
      </div>
      <div style={{ padding: 10 }}>
        {!series && <p style={{ fontFamily: PXF, fontSize: 7, color:'rgba(255,255,255,0.35)', padding:4 }}>数据加载中…</p>}
        {series && tab === 'dims' && (
          <DimensionChart title="今日四维度" dims={[
            { label: '能量', value: series.dimensions.energy,    color: '#86efac' },
            { label: '压力', value: series.dimensions.stress,    color: '#fca5a5' },
            { label: '过劳', value: series.dimensions.burnout,   color: '#fdba74' },
            { label: '久坐', value: series.dimensions.sedentary, color: '#93c5fd' },
          ]} width={276} height={130} />
        )}
        {series && tab === 'time' && cur && (
          <>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
              {charts.map((c, i) => (
                <button key={i} onClick={() => setChartIdx(i)} style={{
                  fontFamily: PXF, fontSize: 6, padding: '3px 7px',
                  background: chartIdx===i ? `${c.color}22` : 'transparent',
                  color: chartIdx===i ? c.color : 'rgba(255,255,255,0.4)',
                  outline: chartIdx===i ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.15)',
                  outlineOffset: '1px', border: 'none', cursor: 'pointer',
                }}>{c.title}</button>
              ))}
            </div>
            {cur.type === 'line'
              ? <LineChart title={cur.title} unit={cur.unit} points={cur.points} color={cur.color} width={276} height={120} />
              : <BarChart  title={cur.title} unit={cur.unit} points={cur.points} color={cur.color} width={276} height={120} />
            }
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Advice history panel (with frequency highlight) ───────────────────────────
const AdvicePanel: React.FC<{
  pos:     { x: number; y: number }
  onClose: () => void
}> = ({ pos, onClose }) => {
  const { records, clear } = useAdviceHistoryStore()

  // Count frequency of each message text
  const freq = records.reduce<Record<string,number>>((acc, r) => {
    acc[r.text] = (acc[r.text] ?? 0) + 1; return acc
  }, {})
  const maxFreq = Math.max(1, ...Object.values(freq))
  const topText = Object.entries(freq).sort((a,b) => b[1]-a[1])[0]?.[0]

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }} transition={{ duration: 0.13 }}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: 340, zIndex: 9999, pointerEvents: 'auto', ...pxBox() }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px 6px', borderBottom:'2px solid rgba(255,255,255,0.12)' }}>
        <span style={{ fontFamily: PXF, fontSize: 9, color: '#fde68a', textShadow: '0 0 6px #fde68a66' }}>💡 历史建议</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {records.length > 0 && (
            <button onClick={() => void clear()} style={{ fontFamily: PXF, fontSize: 7, color:'rgba(255,80,80,0.7)', background:'transparent', border:'none', cursor:'pointer' }}>清空</button>
          )}
          <button onClick={onClose} style={{ fontFamily: PXF, fontSize: 9, color:'#fde68a', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
        </div>
      </div>
      {/* Top advice callout */}
      {topText && (
        <div style={{ margin:'6px 8px 2px', padding:'6px 10px', background:'rgba(253,230,138,0.10)', outline:'1px solid rgba(253,230,138,0.35)', outlineOffset:1, border:'1px solid rgba(0,0,0,0.5)' }}>
          <div style={{ fontFamily: PXF, fontSize: 7, color:'#fde68a', marginBottom:4 }}>⭐ 最常出现（{freq[topText]}次）</div>
          <div style={{ fontFamily: PXF, fontSize: 8, color:'rgba(255,255,255,0.85)', lineHeight:1.8 }}>{topText}</div>
        </div>
      )}
      <div style={{ maxHeight: 260, overflowY:'auto', padding:'4px 8px 8px' }}>
        {records.length === 0 && (
          <p style={{ fontFamily: PXF, fontSize: 8, color:'rgba(255,255,255,0.3)', lineHeight:2 }}>还没有记录，多和宠物互动吧</p>
        )}
        {records.map(r => {
          const f = freq[r.text]
          const isTop = r.text === topText
          const heat = Math.round((f / maxFreq) * 3)  // 0-3 heat level
          const barColor = isTop ? '#fde68a' : heat >= 2 ? '#86efac' : 'rgba(255,255,255,0.25)'
          return (
            <div key={r.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: PXF, fontSize: 7, color:'rgba(253,230,138,0.5)', flexShrink:0, marginTop:2, fontVariantNumeric:'tabular-nums', minWidth:62 }}>{fmt(r.createdAt)}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily: PXF, fontSize: 8, color: isTop ? '#fde68a' : 'rgba(255,255,255,0.82)', lineHeight:1.8, margin:0 }}>{r.text}</p>
                {f > 1 && <div style={{ display:'flex', gap:2, marginTop:3 }}>
                  {Array.from({length: Math.min(f, 5)}).map((_,i) => (
                    <div key={i} style={{ width:5, height:5, background: barColor, opacity: 0.7+i*0.06 }} />
                  ))}
                  <span style={{ fontFamily: PXF, fontSize: 6, color: barColor, marginLeft:3 }}>×{f}</span>
                </div>}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Bird-seed shop panel ───────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  all: '全部', accessory: '装饰', toy: '玩具', food: '食物', deco: '摆件',
}

const ShopPanel: React.FC<{
  pos:     { x: number; y: number }
  onClose: () => void
}> = ({ pos, onClose }) => {
  const { seeds, purchases, buy } = useShopStore()
  const [cat, setCat] = useState<'all'|'accessory'|'toy'|'food'|'deco'>('all')
  const [flash, setFlash] = useState<string|null>(null)
  const [msg, setMsg] = useState<string|null>(null)

  const ownedIds = new Set(purchases.map(p => p.itemId))
  const filtered = cat === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === cat)

  const handleBuy = useCallback(async (item: ShopItem) => {
    if (ownedIds.has(item.id)) { setMsg('已拥有～'); setTimeout(() => setMsg(null), 1500); return }
    const ok = await buy(item)
    if (ok) {
      setFlash(item.id)
      setMsg(`🎉 获得 ${item.name}！`)
      setTimeout(() => { setFlash(null); setMsg(null) }, 1800)
    } else {
      setMsg('鸟粮不足…')
      setTimeout(() => setMsg(null), 1500)
    }
  }, [buy, ownedIds])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }} transition={{ duration: 0.13 }}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: 340, zIndex: 9999, pointerEvents: 'auto', ...pxBox() }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px 6px', borderBottom:'2px solid rgba(255,255,255,0.12)' }}>
        <span style={{ fontFamily: PXF, fontSize: 9, color: '#fbbf24', textShadow: '0 0 6px #fbbf2466' }}>🌾 鸟粮商店</span>
        <button onClick={onClose} style={{ fontFamily: PXF, fontSize: 9, color:'#fbbf24', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
      </div>
      {/* Seeds balance */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily: PXF, fontSize: 7, color:'rgba(255,255,255,0.6)' }}>余额</span>
        <span style={{ fontFamily: PXF, fontSize: 9, color:'#fde68a', textShadow:'0 0 8px #fde68a88' }}>🌾 {seeds}</span>
      </div>
      {/* Flash message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ fontFamily: PXF, fontSize: 7, textAlign:'center', padding:'5px 8px',
              color: msg.startsWith('🎉') ? '#86efac' : '#fca5a5',
              background: msg.startsWith('🎉') ? 'rgba(134,239,172,0.10)' : 'rgba(252,165,165,0.10)' }}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Category tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid rgba(255,255,255,0.10)', padding:'4px 10px 0', gap:2 }}>
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(c => (
          <button key={c} onClick={() => setCat(c as typeof cat)} style={{
            fontFamily: PXF, fontSize: 6, padding:'3px 7px',
            background: cat===c ? 'rgba(251,191,36,0.18)' : 'transparent',
            color: cat===c ? '#fbbf24' : 'rgba(255,255,255,0.4)',
            border: 'none', borderBottom: cat===c ? '2px solid #fbbf24' : '2px solid transparent',
            cursor: 'pointer', marginBottom:-2,
          }}>{CATEGORY_LABELS[c]}</button>
        ))}
      </div>
      {/* Items grid — 2 columns, pixel-art style cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:10, maxHeight:260, overflowY:'auto' }}>
        {filtered.map(item => {
          const owned   = ownedIds.has(item.id)
          const isFired = flash === item.id
          const canBuy  = seeds >= item.price && !owned
          const borderColor = isFired ? 'rgba(253,200,50,0.9)' : owned ? 'rgba(134,239,172,0.7)' : 'rgba(255,255,255,0.22)'
          const bgColor     = isFired ? 'rgba(253,230,138,0.18)' : owned ? 'rgba(134,239,172,0.06)' : 'rgba(255,255,255,0.03)'
          return (
            <button key={item.id} onClick={() => void handleBuy(item)} title={item.desc} style={{
              display:'flex', flexDirection:'row', alignItems:'center', gap:8, padding:'8px 10px',
              background: bgColor,
              border: 'none',
              outline: `2px solid ${borderColor}`,
              outlineOffset: '1px',
              boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.5), 2px 2px 0 rgba(0,0,0,0.6)`,
              cursor: canBuy ? 'pointer' : 'default',
              opacity: !canBuy && !owned ? 0.5 : 1,
              transition:'background 0.12s, outline-color 0.12s',
              imageRendering:'pixelated',
              textAlign: 'left',
            }}>
              {/* Pixel icon block */}
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)',
                outline: `2px solid ${borderColor}`,
                outlineOffset: '-1px',
                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08)',
                imageRendering: 'pixelated',
                fontSize: 22,
                lineHeight: 1,
              }}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily:PXF, fontSize:7, fontWeight:'bold',
                  color: owned ? '#86efac' : 'rgba(255,255,255,0.9)',
                  lineHeight: 1.5, marginBottom: 3,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{item.name}</div>
                <div style={{ fontFamily:PXF, fontSize:6,
                  color: owned ? '#86efac' : canBuy ? '#fde68a' : 'rgba(255,255,255,0.3)',
                }}>
                  {owned ? '✓ 已拥有' : `🌾 ${item.price}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div style={{ padding:'5px 12px 7px', fontFamily:PXF, fontSize:6, color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
        与宠物互动可获得鸟粮
      </div>
    </motion.div>
  )
}

// helper — calc popup position from an anchor button
function calcBubblePos(btn: HTMLButtonElement, panelW: number): { x: number; y: number } {
  const r = btn.getBoundingClientRect()
  const x = r.right + 10 + panelW > window.innerWidth ? r.left - panelW - 10 : r.right + 10
  const y = Math.max(8, Math.min(r.top - 10, window.innerHeight - 360))
  return { x, y }
}

type PanelKey = 'action' | 'charts' | 'advice' | 'shop' | null

// ── 6 canopy bubble positions matching the 6 red-circle leaf spots ────────────
// Coords are % of the sceneLayer container. Treehouse image is object-contain
// centred; the canopy spans roughly left 5–90%, top 3–45% in container space.
//
// Red-circle mapping (left→right, bottom→top scan of the image):
//  1. bottom-left  branch  ≈ left 10%, top 40%
//  2. mid-left     canopy  ≈ left 27%, top 26%
//  3. centre-left  canopy  ≈ left 41%, top 20%
//  4. centre-right canopy  ≈ left 59%, top 25%
//  5. right-mid    canopy  ≈ left 73%, top 29%
//  6. right-lower  branch  ≈ left 84%, top 37%
// Positions are % of the depth-2.0 parallax layer container, which has
// inset: -54px (bleed=54px), making it 708×630px vs the 600×522 window.
// Formula: containerLeft = (windowLeft% × 600 + 54) / 708
//          containerTop  = (windowTop%  × 522 + 54) / 630
// Target window positions (where the red circles sit on the leaves):
//  换宠物: win  9%, 38%  → ctr 16%, 37%
//  动作:   win 20%, 27%  → ctr 26%, 29%
//  图表:   win 37%, 18%  → ctr 40%, 23%
//  建议:   win 53%, 23%  → ctr 53%, 28%
//  商店:   win 68%, 27%  → ctr 66%, 31%
//  关闭:   win 80%, 33%  → ctr 75%, 37%
const CANOPY_ENTRIES = [
  { key:'changePet' as const, icon:'🔄', label:'换宠物', accent:'rgba(255,255,255,0.9)', left:'20%', top:'33%', delay:0 },
  { key:'action'   as const, icon:'🐦', label:'动作',   accent:'#7dd3fc',               left:'35%', top:'20%', delay:1 },
  { key:'charts'   as const, icon:'📊', label:'图表',   accent:'#86efac',               left:'47%', top:'12%', delay:2 },
  { key:'advice'   as const, icon:'💡', label:'建议',   accent:'#fde68a',               left:'60%', top:'18%', delay:3 },
  { key:'shop'     as const, icon:'🌾', label:'商店',   accent:'#fbbf24',               left:'75%', top:'13%', delay:4 },
  { key:'close'    as const, icon:'✕',  label:'关闭',   accent:'rgba(255,120,120,0.9)', left:'90%', top:'20%', delay:5 },
] as const

type EntryKey = typeof CANOPY_ENTRIES[number]['key']

// ── Canopy bubbles — 6 entries on the tree leaves ─────────────────────────────
const CanopyBubbles: React.FC<{ series: ChartSeriesBundle | null; species: PetSpecies }> = ({ series, species }) => {
  const { load: loadShop } = useShopStore()
  useEffect(() => { void loadShop() }, [loadShop])

  const [open, setOpen] = useState<PanelKey>(null)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })

  const handleClick = useCallback((key: EntryKey, btn: HTMLButtonElement) => {
    if (key === 'close') {
      getElectronAPI()?.closeTreehouse()
      return
    }
    if (key === 'changePet') {
      void getElectronAPI()?.openTreehouse('change-pet')
      return
    }
    const panelW = key === 'shop' ? 340 : key === 'advice' ? 340 : key === 'charts' ? 300 : 280
    if (open === key) { setOpen(null); return }
    setPanelPos(calcBubblePos(btn, panelW))
    setOpen(key)
  }, [open])

  // Panels are portalled to document.body so position:fixed is relative to the
  // true viewport — not the ParallaxLayer's CSS-transform stacking context.
  const panels = (
    <AnimatePresence>
      {open === 'action' && (
        <ActionPanel key="action" species={species} pos={panelPos} onClose={() => setOpen(null)} />
      )}
      {open === 'charts' && (
        <ChartsPanel key="charts" series={series} pos={panelPos} onClose={() => setOpen(null)} />
      )}
      {open === 'advice' && (
        <AdvicePanel key="advice" pos={panelPos} onClose={() => setOpen(null)} />
      )}
      {open === 'shop' && (
        <ShopPanel key="shop" pos={panelPos} onClose={() => setOpen(null)} />
      )}
    </AnimatePresence>
  )

  return (
    <>
      {CANOPY_ENTRIES.map((e) => (
        <CanopyBubble
          key={e.key}
          icon={e.icon}
          label={e.label}
          delay={e.delay}
          pos={{ left: e.left, top: e.top }}
          active={open === e.key}
          accent={e.accent}
          onClick={(btn) => handleClick(e.key, btn)}
        />
      ))}

      {/* Click-away backdrop to close panels — also portalled */}
      {open && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'auto' }}
          onClick={() => setOpen(null)}
        />,
        document.body,
      )}

      {createPortal(panels, document.body)}
    </>
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
        const slq = (today.raw.sleepQuality ?? 3) * 20
        setSeries({
          book:         { title: '睡眠时长', unit: '小时', points: pt(slh) },
          note:         { title: '睡眠时长', unit: '小时', points: pt(slh) },
          clock:        { title: '久坐时长', unit: '分钟', points: pt(today.raw.sedentaryMinutes ?? 0) },
          cup:          { title: '饮水量',   unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          bowl:         { title: '饮水量',   unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          shoes:        { title: '步数',     unit: '步',   points: pt(today.raw.steps ?? 0) },
          flower:       { title: '步数',     unit: '步',   points: pt(today.raw.steps ?? 0) },
          lamp:         { title: '活跃时长', unit: '分钟', points: pt(today.raw.activeMinutes ?? 0) },
          painting:     { title: '睡眠质量', unit: '分',   points: pt(slq) },
          sleepQuality: { title: '睡眠质量', unit: '分',   points: pt(slq) },
          potion:       { title: '心率',     unit: 'bpm',  points: pt(today.raw.heartRate ?? 0) },
          screenTime:   { title: '屏幕时间', unit: '分钟', points: pt(today.raw.screenTimeMinutes ?? 0) },
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
    // Returns viewport coords (for position:fixed panel via Portal).
    // Actual clamping is done inside HoverPanel after render.
    const rect  = el.getBoundingClientRect()
    const winW  = window.innerWidth
    const estW  = 256
    // Prefer right side; fall back to left if no room
    const x = rect.right + 12 + estW > winW ? rect.left - estW - 12 : rect.right + 12
    // Start near the hitbox top; HoverPanel will clamp to viewport after measuring
    const y = rect.top - 10
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
      {/* Canopy entry bubbles — action / charts / advice / shop */}
      <CanopyBubbles series={series} species={(config?.species ?? 'sparrow') as PetSpecies} />
    </div>
  )

  return (
    <TreehouseShell
      title={config?.name ? `${config.name} 的树屋` : '健康树屋'}
      subtitle="悬停家具查看健康数据"
      sceneLayer={furnitureScene}
      hideControls
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
