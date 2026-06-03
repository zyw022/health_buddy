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

// ── HoverPanel ────────────────────────────────────────────────────────────────
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
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(() => {
      if (wrapRef.current) setFrameH(wrapRef.current.offsetHeight)
    })
    ro.observe(wrapRef.current)
    setFrameH(wrapRef.current.offsetHeight)
    return () => ro.disconnect()
  }, [])

  const P = FRAME + 4   // inner content padding

  return (
    <motion.div
      key={item.id}
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.92, y: 5 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 5 }}
      transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
      style={{ position:'absolute', left:pos.x, top:pos.y, width:panelW,
               background:bg, boxShadow:glow, zIndex:50, pointerEvents:'auto' }}
    >
      {frameH > 0 && <OrnateFrame w={panelW} h={frameH} isGold={isGold} />}

      <div style={{ position:'relative', zIndex:2, padding:`${P}px ${P}px ${P}px ${P}px` }}>
        {/* Title + close on one line */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
            <span style={{ fontFamily:PXF, fontSize:8, color:accent, lineHeight:1,
              textShadow:`0 0 6px ${accent}66` }}>
              {item.label}
            </span>
            <span style={{ fontFamily:PXF, fontSize:5, color:'rgba(255,255,255,0.3)', lineHeight:1 }}>
              {item.hint}
            </span>
          </div>
          <button onClick={onClose} style={{
            fontFamily:PXF, fontSize:7, color:accent,
            background:'transparent', border:'none', cursor:'pointer', lineHeight:1, padding:'0 0 0 6px',
          }}>✕</button>
        </div>

        {/* 1px dashed divider */}
        <div style={{
          height:1, marginBottom:6,
          background:`repeating-linear-gradient(to right,${accent}55 0,${accent}55 3px,transparent 3px,transparent 6px)`
        }}/>

        {/* Content */}
        {(item.panelType==='chart-line'||item.panelType==='chart-bar'||item.panelType==='chart-dimensions') &&
          <ChartPanel item={item} series={series} onClose={onClose} />}
        {item.panelType==='preferences' &&
          <PreferencesPanel item={item} series={series} onClose={onClose} />}
        {item.panelType==='history' &&
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
