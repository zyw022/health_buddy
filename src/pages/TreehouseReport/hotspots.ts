import type { ChartPoint } from '../../components/HealthChart'

export type HotspotId = 'clock' | 'note' | 'bowl' | 'sofa' | 'flower'

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
  chartType: 'line' | 'bar' | 'dimensions'
  seriesKey: HotspotId | 'dimensions'
}

export const FURNITURE: FurnitureDef[] = [
  {
    id:        'clock',
    label:     '挂钟',
    hint:      '久坐与屏幕时间',
    src:       'materials/furniture/6-时钟.png',
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
    src:       'materials/furniture/7-便笺.png',
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
    src:       'materials/furniture/5-水池边的碗.png',
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
    src:       'materials/furniture/8-沙发上的抱枕.png',
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
    src:       'materials/furniture/1-二楼的花.png',
    x: 83, y: 32,
    size:      42,
    depth:     0.7,
    chartType: 'bar',
    seriesKey: 'flower',
  },
]

export interface ChartSeriesBundle {
  book:    { title: string; unit: string; points: ChartPoint[] }
  clock:   { title: string; unit: string; points: ChartPoint[] }
  note:    { title: string; unit: string; points: ChartPoint[] }
  cup:     { title: string; unit: string; points: ChartPoint[] }
  bowl:    { title: string; unit: string; points: ChartPoint[] }
  shoes:   { title: string; unit: string; points: ChartPoint[] }
  flower:  { title: string; unit: string; points: ChartPoint[] }
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
