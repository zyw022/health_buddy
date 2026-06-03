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

// ── Gold shimmer keyframes (injected once) ───────────────────────────────────
const GOLD_STYLE_ID = 'treehouse-gold-shimmer'
function ensureGoldStyles() {
  if (document.getElementById(GOLD_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = GOLD_STYLE_ID
  style.textContent = `
    @keyframes goldPulse {
      0%,100% { filter: drop-shadow(0 0 6px rgba(255,210,60,0.55)) drop-shadow(0 0 2px rgba(255,180,0,0.4)); }
      50%      { filter: drop-shadow(0 0 14px rgba(255,230,80,0.9)) drop-shadow(0 0 6px rgba(255,200,0,0.7)); }
    }
    @keyframes whitePulse {
      0%,100% { filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
      50%      { filter: drop-shadow(0 0 8px rgba(255,255,255,0.35)); }
    }
    .furniture-gold   { animation: goldPulse  2.2s ease-in-out infinite; }
    .furniture-normal { animation: whitePulse 3.5s ease-in-out infinite; }
  `
  document.head.appendChild(style)
}

// ── Panel component map ───────────────────────────────────────────────────────

interface PanelProps {
  item:    FurnitureDef
  series:  ChartSeriesBundle | null
  onClose: () => void
}

const LINE_COLORS: Partial<Record<HotspotId, string>> = {
  note:  '#c4b5fd', clock: '#7dd3fc',
}
const BAR_COLORS: Partial<Record<HotspotId, string>> = {
  bowl:   '#67e8f9', flower: '#86efac',
  lamp:   '#fde68a', potion: '#fca5a5',
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

  if (item.panelType === 'chart-line') {
    return <LineChart title={s.title} unit={s.unit} points={s.points}
      color={LINE_COLORS[item.id] ?? '#7dd3fc'} width={260} height={130} />
  }
  return <BarChart title={s.title} unit={s.unit} points={s.points}
    color={BAR_COLORS[item.id] ?? '#86efac'} width={260} height={130} />
}

const PreferencesPanel: React.FC<PanelProps> = ({ onClose }) => {
  const { items, add, remove } = usePreferencesStore()
  const [draft, setDraft] = useState('')

  const submit = async () => {
    if (!draft.trim()) return
    await add(draft)
    setDraft('')
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#fde68a] text-[11px] font-semibold tracking-wide">✦ 偏好存档</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-[10px]">关闭</button>
      </div>

      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mb-2">
        {items.length === 0 && (
          <p className="text-white/30 text-[10px] italic">还没有偏好，添加一条吧</p>
        )}
        {items.map(p => (
          <div key={p.id} className="flex items-start gap-2 group">
            <span className="text-[#fde68a]/80 text-[9px] mt-0.5 shrink-0">✦</span>
            <p className="flex-1 text-white/75 text-[10px] leading-snug">{p.text}</p>
            <button
              onClick={() => void remove(p.id)}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-[9px] shrink-0 transition-opacity"
            >✕</button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void submit() }}
          placeholder="新增偏好…"
          maxLength={50}
          className="flex-1 bg-white/8 border border-white/15 rounded-lg px-2 py-1 text-white text-[10px] outline-none focus:border-[#fde68a]/50 placeholder-white/25"
        />
        <button
          onClick={() => void submit()}
          disabled={!draft.trim()}
          className="px-2 py-1 rounded-lg text-[10px] text-[#1a1205] font-bold transition-opacity disabled:opacity-30"
          style={{ background: '#fde68a' }}
        >
          +
        </button>
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
          {records.length > 0 && (
            <button onClick={() => void clear()} className="text-white/25 hover:text-red-400 text-[10px]">清空</button>
          )}
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-[10px]">关闭</button>
        </div>
      </div>

      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {records.length === 0 && (
          <p className="text-white/30 text-[10px] italic">还没有记录，跟宠物多互动吧</p>
        )}
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

// ── Hover panel container ────────────────────────────────────────────────────

interface HoverPanelProps {
  item:    FurnitureDef
  pos:     { x: number; y: number }
  series:  ChartSeriesBundle | null
  onClose: () => void
}

const HoverPanel: React.FC<HoverPanelProps> = ({ item, pos, series, onClose }) => {
  const isGold = item.glowType === 'gold'
  const borderColor = isGold ? 'rgba(253,230,138,0.35)' : 'rgba(255,255,255,0.12)'
  const titleColor  = isGold ? '#fde68a' : 'rgba(255,255,255,0.9)'

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
        border:     `1px solid ${borderColor}`,
        boxShadow:  isGold
          ? '0 8px 32px rgba(253,230,138,0.15), 0 2px 8px rgba(0,0,0,0.5)'
          : '0 8px 28px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header — only for chart items */}
      {item.panelType !== 'preferences' && item.panelType !== 'history' && (
        <>
          <p className="text-[11px] font-semibold px-1 mb-0.5" style={{ color: titleColor }}>
            {item.label}
          </p>
          <p className="text-white/40 text-[10px] px-1 mb-2">{item.hint}</p>
        </>
      )}

      {(item.panelType === 'chart-line' || item.panelType === 'chart-bar' || item.panelType === 'chart-dimensions') && (
        <ChartPanel item={item} series={series} onClose={onClose} />
      )}
      {item.panelType === 'preferences' && (
        <PreferencesPanel item={item} series={series} onClose={onClose} />
      )}
      {item.panelType === 'history' && (
        <HistoryPanel item={item} series={series} onClose={onClose} />
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TreehouseReport: React.FC = () => {
  const config  = usePetStore((s) => s.config)
  const { load: loadPrefs } = usePreferencesStore()
  const { load: loadHistory } = useAdviceHistoryStore()

  const [series,   setSeries]   = useState<ChartSeriesBundle | null>(null)
  const [active,   setActive]   = useState<FurnitureDef | null>(null)
  const [pinned,   setPinned]   = useState<FurnitureDef | null>(null)   // clicked = stays open
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [entered,  setEntered]  = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureGoldStyles()
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => { void loadPrefs() }, [loadPrefs])
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
        const d   = new Date().toISOString().split('T')[0]
        const pt  = (v: number) => [{ date: d, label: d, value: v }]
        const slh = Math.round((today.raw.sleepMinutes ?? 0) / 60 * 10) / 10
        setSeries({
          book: { title: '睡眠时长', unit: '小时', points: pt(slh) },
          note: { title: '睡眠时长', unit: '小时', points: pt(slh) },
          clock: { title: '久坐分钟', unit: '分钟', points: pt(today.raw.sedentaryMinutes ?? 0) },
          cup: { title: '饮水杯数', unit: '杯', points: pt(today.raw.waterCups ?? 0) },
          bowl: { title: '饮水杯数', unit: '杯', points: pt(today.raw.waterCups ?? 0) },
          shoes: { title: '步数', unit: '步', points: pt(today.raw.steps ?? 0) },
          flower: { title: '步数', unit: '步', points: pt(today.raw.steps ?? 0) },
          lamp: { title: '活跃时长', unit: '分钟', points: pt(today.raw.activeMinutes ?? 0) },
          painting: { title: '睡眠质量', unit: '分', points: pt((today.raw.sleepQuality ?? 3) * 20) },
          potion: { title: '心率', unit: 'bpm', points: pt(today.raw.heartRate ?? 0) },
          dimensions: {
            title: '今日四维度',
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

  // Compute panel position so it stays on screen
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

  const onEnter = useCallback((item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => {
    if (pinned) return   // don't override a pinned panel on hover
    setPanelPos(calcPos(e.currentTarget))
    setActive(item)
  }, [pinned, calcPos])

  const onLeave = useCallback(() => {
    if (!pinned) setActive(null)
  }, [pinned])

  const onClick = useCallback((item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (pinned?.id === item.id) {
      setPinned(null)
      setActive(null)
    } else {
      setPanelPos(calcPos(e.currentTarget))
      setPinned(item)
      setActive(item)
    }
  }, [pinned, calcPos])

  const displayItem = pinned ?? active

  return (
    <TreehouseShell
      title={config?.name ? `${config.name} 的树屋` : '健康树屋'}
      subtitle="悬停家具查看健康数据"
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
          onClick={() => { setPinned(null); setActive(null) }}
        />
      )}

      {/* Furniture layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {FURNITURE.map((item, i) => {
          const isGold   = item.glowType === 'gold'
          const isActive = displayItem?.id === item.id

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 18, scale: 0.85 }}
              animate={entered ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.85 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.2, y: -7 }}
              whileTap={{ scale: 0.95 }}
              style={{
                position:      'absolute',
                left:          `${item.x}%`,
                top:           `${item.y}%`,
                transform:     'translate(-50%, -50%)',
                pointerEvents: 'auto',
              }}
              className={`rounded-xl focus:outline-none ${isGold ? 'furniture-gold' : 'furniture-normal'}`}
              onMouseEnter={(e) => onEnter(item, e)}
              onMouseLeave={onLeave}
              onClick={(e) => onClick(item, e)}
              title={item.hint}
            >
              <img
                src={item.src}
                alt={item.label}
                draggable={false}
                style={{
                  width:  item.size,
                  height: item.size,
                  objectFit:       'contain',
                  imageRendering:  'pixelated',
                  transition:      'filter 0.2s',
                }}
              />

              {/* Active ring */}
              {isActive && (
                <motion.div
                  layoutId="active-ring"
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    border:     isGold
                      ? '1.5px solid rgba(253,230,138,0.8)'
                      : '1.5px solid rgba(125,211,252,0.75)',
                    boxShadow:  isGold
                      ? '0 0 16px rgba(253,230,138,0.45)'
                      : '0 0 12px rgba(125,211,252,0.35)',
                  }}
                />
              )}

              {/* Pinned indicator dot */}
              {pinned?.id === item.id && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-black/40"
                  style={{ background: isGold ? '#fde68a' : '#7dd3fc' }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Hover / pinned panel */}
      <AnimatePresence>
        {displayItem && (
          <HoverPanel
            key={displayItem.id}
            item={displayItem}
            pos={panelPos}
            series={series}
            onClose={() => { setPinned(null); setActive(null) }}
          />
        )}
      </AnimatePresence>
    </TreehouseShell>
  )
}

export default TreehouseReport
