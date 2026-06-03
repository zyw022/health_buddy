import type { ChartPoint } from '../../components/HealthChart'

// Furniture panel types
export type PanelType  = 'chart-line' | 'chart-bar' | 'chart-dimensions' | 'preferences' | 'history'
// Glow type: normal = white hover glow; gold = constant golden shimmer (special items)
export type GlowType   = 'normal' | 'gold'
export type HotspotId  =
  | 'clock'      // 挂钟      — 久坐时间 (chart-line)
  | 'note'       // 便笺      — 睡眠质量 (chart-line)
  | 'bowl'       // 碗        — 饮水量   (chart-bar)
  | 'sofa'       // 沙发抱枕  — 四维度   (chart-dimensions)
  | 'flower'     // 花        — 步数     (chart-bar)
  | 'potion'     // 药水      — 心率压力 (chart-bar)
  | 'painting'   // 挂画 ★GOLD — 偏好存档 (preferences)
  | 'lamp'       // 灯   ★GOLD — 历史建议 (history)

export interface FurnitureDef {
  id:        HotspotId
  label:     string
  hint:      string
  src:       string
  x:         number   // % from left
  y:         number   // % from top
  size:      number   // render px
  depth:     number   // parallax depth
  panelType: PanelType
  glowType:  GlowType
  seriesKey?: keyof Omit<ChartSeriesBundle, 'dimensions'> | 'dimensions'
}

export const FURNITURE: FurnitureDef[] = [
  // ── 6 health-report items (white glow) ──────────────────────────────────
  {
    id:        'clock',
    label:     '挂钟',
    hint:      '今日久坐时间',
    src:       'materials/furniture/clock.png',
    x: 55, y: 38, size: 48, depth: 0.8,
    panelType: 'chart-line',
    glowType:  'normal',
    seriesKey: 'clock',
  },
  {
    id:        'note',
    label:     '便笺',
    hint:      '睡眠时长与质量',
    src:       'materials/furniture/note.png',
    x: 16, y: 50, size: 40, depth: 1.0,
    panelType: 'chart-line',
    glowType:  'normal',
    seriesKey: 'note',
  },
  {
    id:        'bowl',
    label:     '水池边的碗',
    hint:      '每日饮水量',
    src:       'materials/furniture/bowl.png',
    x: 88, y: 54, size: 44, depth: 0.9,
    panelType: 'chart-bar',
    glowType:  'normal',
    seriesKey: 'bowl',
  },
  {
    id:        'sofa',
    label:     '沙发抱枕',
    hint:      '今日四维度健康评分',
    src:       'materials/furniture/pillow.png',
    x: 44, y: 56, size: 44, depth: 1.1,
    panelType: 'chart-dimensions',
    glowType:  'normal',
    seriesKey: 'dimensions',
  },
  {
    id:        'flower',
    label:     '二楼的花',
    hint:      '今日步数',
    src:       'materials/furniture/flower.png',
    x: 83, y: 32, size: 42, depth: 0.7,
    panelType: 'chart-bar',
    glowType:  'normal',
    seriesKey: 'flower',
  },
  {
    id:        'potion',
    label:     '床边的药水',
    hint:      '心率与压力指数',
    src:       'materials/furniture/potion.png',
    x: 92, y: 40, size: 36, depth: 1.0,
    panelType: 'chart-bar',
    glowType:  'normal',
    seriesKey: 'potion',
  },
  // ── 2 special items — gold glow, always shimmer ──────────────────────────
  {
    id:        'painting',
    label:     '二楼的挂画',
    hint:      '点击编辑你的偏好存档',
    src:       'materials/furniture/painting.png',
    x: 30, y: 26, size: 50, depth: 0.5,
    panelType: 'preferences',
    glowType:  'gold',
  },
  {
    id:        'lamp',
    label:     '二楼的灯',
    hint:      '宠物的所有历史建议',
    src:       'materials/furniture/lamp.png',
    x: 73, y: 28, size: 38, depth: 0.6,
    panelType: 'history',
    glowType:  'gold',
  },
]

// ── Chart data bundle ────────────────────────────────────────────────────────
export interface ChartSeriesBundle {
  clock:    { title: string; unit: string; points: ChartPoint[] }
  note:     { title: string; unit: string; points: ChartPoint[] }
  bowl:     { title: string; unit: string; points: ChartPoint[] }
  flower:   { title: string; unit: string; points: ChartPoint[] }
  potion:   { title: string; unit: string; points: ChartPoint[] }
  // legacy keys kept for backward compat with existing chart-series.json
  book:     { title: string; unit: string; points: ChartPoint[] }
  cup:      { title: string; unit: string; points: ChartPoint[] }
  shoes:    { title: string; unit: string; points: ChartPoint[] }
  lamp:     { title: string; unit: string; points: ChartPoint[] }
  painting: { title: string; unit: string; points: ChartPoint[] }
  dimensions: {
    title:     string
    energy:    number
    stress:    number
    burnout:   number
    sedentary: number
  }
}

// Legacy compat
export type HotspotDef = FurnitureDef
export const HOTSPOTS  = FURNITURE
