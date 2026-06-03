import type { ChartPoint } from '../../components/HealthChart'

export type HotspotId = 'clock' | 'note' | 'bowl' | 'sofa' | 'flower' | 'lamp' | 'painting' | 'potion'

export interface FurnitureDef {
  id:        HotspotId
  label:     string
  hint:      string
  /** Image path served from assetstore (Vite publicDir) */
  src:       string
  /** Position on treehouse canvas (percentage) */
  x:         number
  y:         number
  /** Rendered size (px, square) */
  size:      number
  /** Parallax depth — higher = more movement on mouse */
  depth:     number
  chartType: 'line' | 'bar' | 'dimensions' | 'stat'
  seriesKey: HotspotId | 'dimensions'
}

export const FURNITURE: FurnitureDef[] = [
  // ── Active chart items ───────────────────────────────────────────────────
  {
    id:        'clock',
    label:     '挂钟',
    hint:      '久坐与屏幕时间',
    src:       'materials/furniture/clock.png',
    x: 55, y: 38,
    size:      48,
    depth:     0.8,
    chartType: 'line',
    seriesKey: 'clock',
  },
  {
    id:        'note',
    label:     '便笺',
    hint:      '睡眠时长与质量',
    src:       'materials/furniture/note.png',
    x: 16, y: 50,
    size:      40,
    depth:     1.0,
    chartType: 'line',
    seriesKey: 'note',
  },
  {
    id:        'bowl',
    label:     '水池边的碗',
    hint:      '每日饮水量',
    src:       'materials/furniture/bowl.png',
    x: 88, y: 54,
    size:      44,
    depth:     0.9,
    chartType: 'bar',
    seriesKey: 'bowl',
  },
  {
    id:        'sofa',
    label:     '沙发抱枕',
    hint:      '四维度健康评分',
    src:       'materials/furniture/pillow.png',
    x: 44, y: 56,
    size:      44,
    depth:     1.1,
    chartType: 'dimensions',
    seriesKey: 'dimensions',
  },
  {
    id:        'flower',
    label:     '二楼的花',
    hint:      '今日步数',
    src:       'materials/furniture/flower.png',
    x: 83, y: 32,
    size:      42,
    depth:     0.7,
    chartType: 'bar',
    seriesKey: 'flower',
  },
  // ── Previously unused items — now wired to stat panels ──────────────────
  {
    id:        'lamp',
    label:     '二楼的灯',
    hint:      '今日活跃时长',
    src:       'materials/furniture/lamp.png',
    x: 73, y: 28,
    size:      38,
    depth:     0.6,
    chartType: 'bar',
    seriesKey: 'lamp',
  },
  {
    id:        'painting',
    label:     '二楼的挂画',
    hint:      '本周健康趋势',
    src:       'materials/furniture/painting.png',
    x: 30, y: 26,
    size:      50,
    depth:     0.5,
    chartType: 'line',
    seriesKey: 'painting',
  },
  {
    id:        'potion',
    label:     '床边的药水',
    hint:      '心率与压力指数',
    src:       'materials/furniture/potion.png',
    x: 92, y: 40,
    size:      36,
    depth:     1.0,
    chartType: 'bar',
    seriesKey: 'potion',
  },
]

export interface ChartSeriesBundle {
  book:     { title: string; unit: string; points: ChartPoint[] }
  clock:    { title: string; unit: string; points: ChartPoint[] }
  note:     { title: string; unit: string; points: ChartPoint[] }
  cup:      { title: string; unit: string; points: ChartPoint[] }
  bowl:     { title: string; unit: string; points: ChartPoint[] }
  shoes:    { title: string; unit: string; points: ChartPoint[] }
  flower:   { title: string; unit: string; points: ChartPoint[] }
  lamp:     { title: string; unit: string; points: ChartPoint[] }
  painting: { title: string; unit: string; points: ChartPoint[] }
  potion:   { title: string; unit: string; points: ChartPoint[] }
  dimensions: {
    title:     string
    energy:    number
    stress:    number
    burnout:   number
    sedentary: number
  }
}

// Legacy type alias kept for backward compat
export type HotspotDef = FurnitureDef
export const HOTSPOTS  = FURNITURE
