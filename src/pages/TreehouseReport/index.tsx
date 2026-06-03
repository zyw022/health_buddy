import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart, DimensionChart, LineChart } from '../../components/HealthChart'
import { TreehouseShell } from '../../components/TreehouseShell'
import { getElectronAPI, usePetStore } from '../../store/petStore'
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
      const today = await api.readData('health-today.json') as {
        raw?: { sleepMinutes?: number; waterCups?: number; steps?: number; sedentaryMinutes?: number }
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
      x: Math.min(rect.right + 8, window.innerWidth - 280),
      y: Math.max(40, rect.top - 8),
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
          width={260}
          height={130}
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
        color={spot.id === 'cup' ? '#67e8f9' : '#86efac'}
        width={260}
        height={130}
      />
    )
  }

  return (
    <TreehouseShell
      title={config?.name ? `${config.name} 的树屋` : '健康树屋'}
      subtitle="鼠标移到物品上查看健康数据"
      actions={
        <button
          type="button"
          onClick={() => getElectronAPI()?.openTreehouse('change-pet')}
          className="px-2.5 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white/75 text-[10px] transition-colors"
        >
          更换宠物
        </button>
      }
      footer={
        <div className="flex flex-wrap gap-1.5 justify-center pointer-events-none">
          {HOTSPOTS.map((spot) => (
            <span
              key={spot.id}
              className="text-white/40 text-[10px] px-2 py-0.5 rounded-full border border-white/15"
            >
              {spot.label}
            </span>
          ))}
        </div>
      }
    >
      {HOTSPOTS.map((spot) => (
        <button
          key={spot.id}
          type="button"
          className="absolute rounded-lg border-2 transition-all duration-200 focus:outline-none pointer-events-auto"
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: `${spot.w}%`,
            height: `${spot.h}%`,
            borderColor: active?.id === spot.id ? 'rgba(125,211,252,0.85)' : 'rgba(255,255,255,0)',
            background: active?.id === spot.id ? 'rgba(125,211,252,0.12)' : 'transparent',
          }}
          onMouseEnter={(e) => onHotspotEnter(spot, e)}
          onMouseLeave={() => setActive(null)}
          aria-label={spot.label}
        />
      ))}

      <AnimatePresence>
        {active && series && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 rounded-2xl p-2.5 pointer-events-none"
            style={{
              left: panelPos.x,
              top: panelPos.y,
              background: 'rgba(15, 18, 35, 0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
            }}
          >
            <p className="text-white/90 text-xs font-medium px-1">{active.label}</p>
            <p className="text-white/40 text-[10px] px-1 mb-1">{active.hint}</p>
            {renderChart(active)}
          </motion.div>
        )}
      </AnimatePresence>
    </TreehouseShell>
  )
}

export default TreehouseReport
