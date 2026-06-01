import type { ChartPoint } from '../../components/HealthChart'

export type HotspotId = 'book' | 'clock' | 'cup' | 'window' | 'shoes'

export interface HotspotDef {
  id:          HotspotId
  label:       string
  hint:        string
  /** Percentage of image box (0–100) */
  x:           number
  y:           number
  w:           number
  h:           number
  chartType:   'line' | 'bar' | 'dimensions'
  seriesKey:   HotspotId | 'dimensions'
}

export const HOTSPOTS: HotspotDef[] = [
  {
    id: 'book',
    label: '桌上的书',
    hint: '睡眠时长与质量',
    x: 14, y: 52, w: 14, h: 12,
    chartType: 'line',
    seriesKey: 'book',
  },
  {
    id: 'clock',
    label: '挂钟',
    hint: '久坐与屏幕时间',
    x: 68, y: 18, w: 12, h: 14,
    chartType: 'line',
    seriesKey: 'clock',
  },
  {
    id: 'cup',
    label: '茶杯',
    hint: '每日饮水量',
    x: 55, y: 58, w: 10, h: 12,
    chartType: 'bar',
    seriesKey: 'cup',
  },
  {
    id: 'window',
    label: '窗边的光',
    hint: '四维度健康评分',
    x: 32, y: 22, w: 18, h: 18,
    chartType: 'dimensions',
    seriesKey: 'dimensions',
  },
  {
    id: 'shoes',
    label: '门口的运动鞋',
    hint: '每日步数',
    x: 78, y: 68, w: 14, h: 12,
    chartType: 'bar',
    seriesKey: 'shoes',
  },
]

export interface ChartSeriesBundle {
  book:    { title: string; unit: string; points: ChartPoint[] }
  clock:   { title: string; unit: string; points: ChartPoint[] }
  cup:     { title: string; unit: string; points: ChartPoint[] }
  shoes:   { title: string; unit: string; points: ChartPoint[] }
  dimensions: {
    title: string
    energy:    number
    stress:    number
    burnout:   number
    sedentary: number
  }
}
