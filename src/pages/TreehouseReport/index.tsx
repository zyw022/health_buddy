import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, DimensionChart, LineChart } from '../../components/HealthChart'
import { getElectronAPI } from '../../store/petStore'
import { usePetStore } from '../../store/petStore'
import { HOTSPOTS, type ChartSeriesBundle, type HotspotDef } from './hotspots'

const TreehouseReport: React.FC = () => {
  const config = usePetStore((s) => s.config)
  const [series, setSeries] = useState<ChartSeriesBundle | null>(null)
  const [active, setActive] = useState<HotspotDef | null>(null)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const load = async () => {
      const api = getElectronAPI()
      if (!api) return
      const data = await api.readData('chart-series.json') as ChartSeriesBundle | null
      if (data) {
        setSeries(data)
        return
      }
      // Fallback: build minimal chart data from health-today if script not run
      const today = await api.readData('health-today.json') as {
        raw?: { sleepMinutes?: number; waterCups?: number; steps?: number; sedentaryMinutes?: number; screenTimeMinutes?: number }
        state?: { energy?: number; stress?: number; burnout?: number; sedentary?: number }
      } | null
      if (today?.raw && today?.state) {
        const d = new Date().toISOString().split('T')[0]
        setSeries({
          book: {
            title: '睡眠时长',
            unit: '小时',
            points: [{ date: d, label: d, value: Math.round((today.raw.sleepMinutes ?? 0) / 60 * 10) / 10 }],
          },
          clock: {
            title: '久坐分钟',
            unit: '分钟',
            points: [{ date: d, label: d, value: today.raw.sedentaryMinutes ?? 0 }],
          },
          cup: {
            title: '饮水杯数',
            unit: '杯',
            points: [{ date: d, label: d, value: today.raw.waterCups ?? 0 }],
          },
          shoes: {
            title: '步数',
            unit: '步',
            points: [{ date: d, label: d, value: today.raw.steps ?? 0 }],
          },
          dimensions: {
            title: '今日四维度',
            energy: today.state.energy ?? 0,
            stress: today.state.stress ?? 0,
            burnout: today.state.burnout ?? 0,
            sedentary: today.state.sedentary ?? 0,
          },
        })
      }
    }
    void load()
  }, [])

  const onHotspotEnter = useCallback((spot: HotspotDef, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPanelPos({
      x: Math.min(rect.right + 12, window.innerWidth - 300),
      y: Math.max(16, rect.top - 40),
    })
    setActive(spot)
  }, [])

  const renderChart = (spot: HotspotDef) => {
    if (!series) return null

    if (spot.chartType === 'dimensions') {
      const d = series.dimensions
      return (
        <DimensionChart
          title={d.title}
          dims={[
            { label: '能量', value: d.energy, color: '#86efac' },
            { label: '压力', value: d.stress, color: '#fca5a5' },
            { label: '过劳', value: d.burnout, color: '#fdba74' },
            { label: '久坐', value: d.sedentary, color: '#93c5fd' },
          ]}
        />
      )
    }

    const s = series[spot.seriesKey as keyof Omit<ChartSeriesBundle, 'dimensions'>]
    if (!s || !('points' in s)) return null

    if (spot.chartType === 'line') {
      return (
        <LineChart
          title={s.title}
          unit={s.unit}
          points={s.points}
          color={spot.id === 'book' ? '#c4b5fd' : '#7dd3fc'}
        />
      )
    }

    return (
      <BarChart
        title={s.title}
        unit={s.unit}
        points={s.points}
        color={spot.id === 'cup' ? '#67e8f9' : '#86efac'}
      />
    )
  }

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{ background: '#0d0d1a' }}
    >
      <motion.img
        src="treehouse/treehouseorigin.jpg"
        alt="树屋"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(13,13,26,0.85), transparent)' }}
      >
        <div>
          <h1 className="text-xl font-light text-white tracking-wide">
            {config?.name ? `${config.name} 的树屋` : '健康树屋'}
          </h1>
          <p className="text-white/45 text-xs mt-1">
            将鼠标移到物品上，查看对应健康记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => getElectronAPI()?.openTreehouse('change-pet')}
            className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-xs transition-colors"
            title="更换宠物"
          >
            更换宠物
          </button>
          <button
            type="button"
            onClick={() => getElectronAPI()?.closeTreehouse()}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Interactive hotspots */}
      <div className="absolute inset-0 z-10">
        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className="absolute rounded-lg border-2 transition-all duration-200 focus:outline-none"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.w}%`,
              height: `${spot.h}%`,
              borderColor: active?.id === spot.id ? 'rgba(125,211,252,0.9)' : 'rgba(255,255,255,0)',
              background: active?.id === spot.id ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0)',
              boxShadow: active?.id === spot.id ? '0 0 20px rgba(125,211,252,0.35)' : 'none',
            }}
            onMouseEnter={(e) => onHotspotEnter(spot, e)}
            onMouseLeave={() => setActive(null)}
            aria-label={spot.label}
          />
        ))}
      </div>

      {/* Hover chart panel */}
      <AnimatePresence>
        {active && series && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed z-30 rounded-2xl p-3 pointer-events-none"
            style={{
              left: panelPos.x,
              top: panelPos.y,
              background: 'rgba(15, 18, 35, 0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            }}
          >
            <p className="text-white/90 text-sm font-medium mb-0.5 px-1">{active.label}</p>
            <p className="text-white/40 text-xs mb-2 px-1">{active.hint}</p>
            {renderChart(active)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div
        className="absolute bottom-0 inset-x-0 z-20 px-6 py-4 flex flex-wrap gap-3 justify-center"
        style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.9), transparent)' }}
      >
        {HOTSPOTS.map((spot) => (
          <span
            key={spot.id}
            className="text-white/35 text-xs px-2 py-1 rounded-full border border-white/10"
          >
            {spot.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default TreehouseReport
