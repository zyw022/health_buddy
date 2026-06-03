import type { ChartPoint } from '../../components/HealthChart'
import bboxes from './furniture-bboxes.json'

export type PanelType  = 'chart-line' | 'chart-bar' | 'chart-dimensions' | 'preferences' | 'history'
export type GlowType   = 'normal' | 'gold'
export type HotspotId  =
  | 'clock' | 'note' | 'bowl' | 'sofa' | 'flower' | 'potion' | 'painting' | 'lamp'

/** Hit region on the treehouse canvas (percent, same coords as full-size overlay). */
export interface FurnitureHitbox {
  x: number
  y: number
  w: number
  h: number
}

export interface FurnitureDef {
  id:         HotspotId
  label:      string
  hint:       string
  src:        string
  hitbox:     FurnitureHitbox
  depth:      number
  panelType:  PanelType
  glowType:   GlowType
  seriesKey?: keyof Omit<ChartSeriesBundle, 'dimensions' | 'generatedAt' | 'sourceDays'> | 'dimensions'
}

export const FURNITURE: FurnitureDef[] = [
  {
    // 挂钟 → 久坐时长折线（时钟提醒站起来）
    id: 'clock', label: '挂钟', hint: '久坐时长记录',
    src: 'materials/furniture/clock.png',
    hitbox: bboxes.clock, depth: 0.8,
    panelType: 'chart-line', glowType: 'normal', seriesKey: 'clock',
  },
  {
    // 便笺 → 睡眠时长折线（日记记录睡眠）
    id: 'note', label: '便笺', hint: '每日睡眠时长',
    src: 'materials/furniture/note.png',
    hitbox: bboxes.note, depth: 1.0,
    panelType: 'chart-line', glowType: 'normal', seriesKey: 'note',
  },
  {
    // 饮水碗 → 饮水量柱状图
    id: 'bowl', label: '饮水碗', hint: '每日饮水量',
    src: 'materials/furniture/bowl.png',
    hitbox: bboxes.bowl, depth: 0.9,
    panelType: 'chart-bar', glowType: 'normal', seriesKey: 'bowl',
  },
  {
    // 沙发抱枕 → 今日四维度综合评分（休息放松总览）
    id: 'sofa', label: '沙发抱枕', hint: '今日健康四维度',
    src: 'materials/furniture/pillow.png',
    hitbox: bboxes.sofa, depth: 1.1,
    panelType: 'chart-dimensions', glowType: 'normal', seriesKey: 'dimensions',
  },
  {
    // 绿植花卉 → 每日步数柱状图（生机活力）
    id: 'flower', label: '绿植', hint: '每日步数',
    src: 'materials/furniture/flower.png',
    hitbox: bboxes.flower, depth: 0.7,
    panelType: 'chart-bar', glowType: 'normal', seriesKey: 'flower',
  },
  {
    // 药水瓶 → 心率折线（健康监测）
    id: 'potion', label: '药水瓶', hint: '心率监测',
    src: 'materials/furniture/potion.png',
    hitbox: bboxes.potion, depth: 1.0,
    panelType: 'chart-line', glowType: 'normal', seriesKey: 'potion',
  },
  {
    // 挂画 → 偏好存档（金光常驻）
    id: 'painting', label: '挂画', hint: '偏好存档 · 点击编辑',
    src: 'materials/furniture/painting.png',
    hitbox: bboxes.painting, depth: 0.5,
    panelType: 'preferences', glowType: 'gold',
  },
  {
    // 油灯 → 历史建议（金光常驻）
    id: 'lamp', label: '油灯', hint: '历史建议 · 点击查看',
    src: 'materials/furniture/lamp.png',
    hitbox: bboxes.lamp, depth: 0.6,
    panelType: 'history', glowType: 'gold',
  },
]

// ── ChartSeriesBundle — all series produced by generate-chart-data.mjs ───────
interface TimeSeries {
  title:  string
  unit:   string
  points: ChartPoint[]
}

export interface ChartSeriesBundle {
  // sleep
  note:         TimeSeries
  book:         TimeSeries
  // sedentary
  clock:        TimeSeries
  // water
  bowl:         TimeSeries
  cup:          TimeSeries
  // steps
  flower:       TimeSeries
  shoes:        TimeSeries
  // heart rate
  potion:       TimeSeries
  // screen time
  screenTime:   TimeSeries
  // sleep quality (0-100)
  sleepQuality: TimeSeries
  // active minutes (oil lamp)
  lamp:         TimeSeries
  // sleep quality alias for painting
  painting:     TimeSeries
  // 4-dimension state (latest day)
  dimensions: {
    title:     string
    energy:    number
    stress:    number
    burnout:   number
    sedentary: number
  }
  generatedAt?: string
  sourceDays?:  number
}

export type HotspotDef = FurnitureDef
export const HOTSPOTS  = FURNITURE
