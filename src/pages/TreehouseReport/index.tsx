import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { BarChart, DimensionChart, LineChart } from '../../components/HealthChart'
import { TreehouseShell } from '../../components/TreehouseShell'
import { getElectronAPI, usePetStore } from '../../store/petStore'
import { FURNITURE, type ChartSeriesBundle, type FurnitureDef, type HotspotId } from './hotspots'

// ── Parallax mouse tracking ───────────────────────────────────────────────

function useParallaxMouse(strength = 1) {
  const rawX  = useMotionValue(0)
  const rawY  = useMotionValue(0)
  const x     = useSpring(rawX, { stiffness: 80, damping: 20 })
  const y     = useSpring(rawY, { stiffness: 80, damping: 20 })

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect    = e.currentTarget.getBoundingClientRect()
    const cx      = rect.left + rect.width  / 2
    const cy      = rect.top  + rect.height / 2
    const dx      = (e.clientX - cx) / rect.width  * 2   // –1 … +1
    const dy      = (e.clientY - cy) / rect.height * 2
    rawX.set(dx * strength * 12)
    rawY.set(dy * strength * 8)
  }, [rawX, rawY, strength])

  const onMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  return { x, y, onMouseMove, onMouseLeave }
}

// ── Component ─────────────────────────────────────────────────────────────

const TreehouseReport: React.FC = () => {
  const config = usePetStore((s) => s.config)
  const [series,   setSeries]   = useState<ChartSeriesBundle | null>(null)
  const [active,   setActive]   = useState<FurnitureDef | null>(null)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  // Entry animation: far → near
  const [entered,  setEntered]  = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { x: bgX, y: bgY, onMouseMove, onMouseLeave } = useParallaxMouse(0.5)
  const { x: fgX, y: fgY } = useParallaxMouse(1.2)

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      const api = getElectronAPI()
      if (!api) return
      const data = await api.readData('chart-series.json') as ChartSeriesBundle | null
      if (data) { setSeries(data); return }
      const today = await api.readData('health-today.json') as {
        raw?:   {
          sleepMinutes?:    number
          sleepQuality?:    number
          waterCups?:       number
          steps?:           number
          sedentaryMinutes?: number
          activeMinutes?:   number
          heartRate?:       number
        }
        state?: { energy?: number; stress?: number; burnout?: number; sedentary?: number }
      } | null
      if (today?.raw && today?.state) {
        const d   = new Date().toISOString().split('T')[0]
        const pt  = (v: number) => [{ date: d, label: d, value: v }]
        const slh = Math.round((today.raw.sleepMinutes ?? 0) / 60 * 10) / 10
        setSeries({
          book:     { title: '睡眠时长',   unit: '小时', points: pt(slh) },
          note:     { title: '睡眠时长',   unit: '小时', points: pt(slh) },
          clock:    { title: '久坐分钟',   unit: '分钟', points: pt(today.raw.sedentaryMinutes ?? 0) },
          cup:      { title: '饮水杯数',   unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          bowl:     { title: '饮水杯数',   unit: '杯',   points: pt(today.raw.waterCups ?? 0) },
          shoes:    { title: '步数',       unit: '步',   points: pt(today.raw.steps ?? 0) },
          flower:   { title: '步数',       unit: '步',   points: pt(today.raw.steps ?? 0) },
          lamp:     { title: '活跃时长',   unit: '分钟', points: pt(today.raw.activeMinutes ?? 0) },
          painting: { title: '睡眠质量',   unit: '分',   points: pt((today.raw.sleepQuality ?? 3) * 20) },
          potion:   { title: '心率',       unit: 'bpm',  points: pt(today.raw.heartRate ?? 0) },
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

  const onFurnitureEnter = useCallback((item: FurnitureDef, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect()
    const winW  = window.innerWidth
    const winH  = window.innerHeight
    const panelW = 280
    const panelH = 180
    const x = rect.right + 8 + panelW > winW
      ? rect.left - panelW - 8
      : rect.right + 8
    const y = Math.max(40, Math.min(rect.top, winH - panelH - 8))
    setPanelPos({ x, y })
    setActive(item)
  }, [])

  const renderChart = (item: FurnitureDef) => {
    if (!series) return null

    if (item.chartType === 'dimensions') {
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
          width={260}
          height={130}
        />
      )
    }

    const s = series[item.seriesKey as keyof Omit<ChartSeriesBundle, 'dimensions'>]
    if (!s || !('points' in s)) return null

    const LINE_COLORS: Partial<Record<HotspotId, string>> = {
      note:     '#c4b5fd',
      clock:    '#7dd3fc',
      painting: '#86efac',
    }
    const BAR_COLORS: Partial<Record<HotspotId, string>> = {
      bowl:   '#67e8f9',
      flower: '#86efac',
      lamp:   '#fde68a',
      potion: '#fca5a5',
    }

    if (item.chartType === 'line') {
      return (
        <LineChart
          title={s.title}
          unit={s.unit}
          points={s.points}
          color={LINE_COLORS[item.id] ?? '#7dd3fc'}
          width={260}
          height={130}
        />
      )
    }

    return (
      <BarChart
        title={s.title}
        unit={s.unit}
        points={s.points}
        color={BAR_COLORS[item.id] ?? '#86efac'}
        width={260}
        height={130}
      />
    )
  }

  return (
    <TreehouseShell
      title={config?.name ? `${config.name} 的树屋` : '健康树屋'}
      subtitle="悬停物品查看健康数据"
      actions={
        <button
          type="button"
          onClick={() => getElectronAPI()?.openTreehouse('change-pet')}
          className="px-2.5 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white/75 text-[10px] transition-colors"
        >
          更换宠物
        </button>
      }
    >
      {/* ── Entry animation wrapper: far (scale 0.88, blur) → near ── */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        onMouseMove={(e) => {
          onMouseMove(e as unknown as React.MouseEvent<HTMLDivElement>)
        }}
        onMouseLeave={onMouseLeave}
        style={{ pointerEvents: 'all' }}
      >
        {/* Background parallax layer */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 0.88, filter: 'blur(4px)', opacity: 0 }}
          animate={{ scale: entered ? 1 : 0.88, filter: entered ? 'blur(0px)' : 'blur(4px)', opacity: entered ? 1 : 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ x: bgX, y: bgY }}
        />

        {/* Furniture / near-scene layer with stagger entry + hover float */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {FURNITURE.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 18, scale: 0.85 }}
              animate={entered
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 18, scale: 0.85 }
              }
              transition={{
                delay:     0.25 + i * 0.09,
                duration:  0.5,
                ease:      'easeOut',
              }}
              whileHover={{
                scale:     1.22,
                y:         -8,
                filter:    'drop-shadow(0 0 12px rgba(255,255,200,0.55))',
              }}
              style={{
                position:   'absolute',
                left:       `${item.x}%`,
                top:        `${item.y}%`,
                transform:  'translate(-50%, -50%)',
                x:          fgX,
                y:          fgY,
                pointerEvents: 'auto',
              }}
              className="rounded-xl focus:outline-none"
              onMouseEnter={(e) => onFurnitureEnter(item, e)}
              onMouseLeave={() => setActive(null)}
              title={item.label}
            >
              <img
                src={item.src}
                alt={item.label}
                draggable={false}
                style={{
                  width:  item.size,
                  height: item.size,
                  objectFit:  'contain',
                  imageRendering: 'pixelated',
                }}
              />
              {/* Subtle glow ring on hover */}
              {active?.id === item.id && (
                <motion.div
                  layoutId="glow"
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    border:  '1.5px solid rgba(255,220,80,0.7)',
                    boxShadow: '0 0 14px rgba(255,220,80,0.35)',
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Data chart popup */}
        <AnimatePresence>
          {active && series && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute z-30 rounded-2xl p-3 pointer-events-none"
              style={{
                left:       panelPos.x,
                top:        panelPos.y,
                background: 'rgba(12,15,30,0.94)',
                border:     '1px solid rgba(255,255,255,0.12)',
                minWidth:   280,
              }}
            >
              <p className="text-white/90 text-xs font-semibold px-1 mb-0.5">{active.label}</p>
              <p className="text-white/40 text-[10px] px-1 mb-2">{active.hint}</p>
              {renderChart(active)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TreehouseShell>
  )
}

export default TreehouseReport
