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

const PreferencesPanel: React.FC<PanelProps> = ({ onClose }) => {
  const { items, add, remove } = usePreferencesStore()
  const [draft, setDraft] = useState('')
  const submit = async () => { if (draft.trim()) { await add(draft); setDraft('') } }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#fde68a] text-[11px] font-semibold tracking-wide">✦ 偏好存档</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-[10px]">关闭</button>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mb-2">
        {items.length === 0 && <p className="text-white/30 text-[10px] italic">还没有偏好，添加一条吧</p>}
        {items.map(p => (
          <div key={p.id} className="flex items-start gap-2 group">
            <span className="text-[#fde68a]/80 text-[9px] mt-0.5 shrink-0">✦</span>
            <p className="flex-1 text-white/75 text-[10px] leading-snug">{p.text}</p>
            <button onClick={() => void remove(p.id)}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-[9px] shrink-0 transition-opacity">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void submit() }}
          placeholder="新增偏好…" maxLength={50}
          className="flex-1 bg-white/8 border border-white/15 rounded-lg px-2 py-1 text-white text-[10px] outline-none focus:border-[#fde68a]/50 placeholder-white/25" />
        <button onClick={() => void submit()} disabled={!draft.trim()}
          className="px-2 py-1 rounded-lg text-[10px] text-[#1a1205] font-bold transition-opacity disabled:opacity-30"
          style={{ background: '#fde68a' }}>+</button>
      </div>
    </div>
  )
}

const HistoryPanel: React.FC<PanelProps> = ({ onClose }) => {
  const { records, clear } = useAdviceHistoryStore()
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#fde68a] text-[11px] font-semibold tracking-wide">✦ 历史建议</span>
        <div className="flex gap-2">
          {records.length > 0 && <button onClick={() => void clear()} className="text-white/25 hover:text-red-400 text-[10px]">清空</button>}
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-[10px]">关闭</button>
        </div>
      </div>
      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {records.length === 0 && <p className="text-white/30 text-[10px] italic">还没有记录，跟宠物多互动吧</p>}
        {records.map(r => (
          <div key={r.id} className="flex gap-2 items-start">
            <span className="text-[#fde68a]/60 text-[9px] mt-0.5 shrink-0 font-mono">{fmt(r.createdAt)}</span>
            <p className="text-white/70 text-[10px] leading-snug">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const HoverPanel: React.FC<{
  item: FurnitureDef
  pos:  { x: number; y: number }
  series: ChartSeriesBundle | null
  onClose: () => void
}> = ({ item, pos, series, onClose }) => {
  const isGold = item.glowType === 'gold'
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute z-50 rounded-2xl p-3 pointer-events-auto"
      style={{
        left:       pos.x,
        top:        pos.y,
        minWidth:   item.panelType === 'preferences' || item.panelType === 'history' ? 260 : 280,
        maxWidth:   300,
        background: 'rgba(10,12,25,0.95)',
        border:     `1px solid ${isGold ? 'rgba(253,230,138,0.35)' : 'rgba(255,255,255,0.12)'}`,
        boxShadow:  isGold
          ? '0 8px 32px rgba(253,230,138,0.15), 0 2px 8px rgba(0,0,0,0.5)'
          : '0 8px 28px rgba(0,0,0,0.5)',
      }}
    >
      {item.panelType !== 'preferences' && item.panelType !== 'history' && (
        <>
          <p className="text-[11px] font-semibold px-1 mb-0.5"
            style={{ color: isGold ? '#fde68a' : 'rgba(255,255,255,0.9)' }}>
            {item.label}
          </p>
          <p className="text-white/40 text-[10px] px-1 mb-2">{item.hint}</p>
        </>
      )}
      {(item.panelType === 'chart-line' || item.panelType === 'chart-bar' || item.panelType === 'chart-dimensions') &&
        <ChartPanel item={item} series={series} onClose={onClose} />}
      {item.panelType === 'preferences' && <PreferencesPanel item={item} series={series} onClose={onClose} />}
      {item.panelType === 'history'     && <HistoryPanel     item={item} series={series} onClose={onClose} />}
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
