import React from 'react'

export interface ChartPoint {
  date:  string
  label: string
  value: number
}

interface LineChartProps {
  title:    string
  unit:     string
  points:   ChartPoint[]
  color?:   string
  width?:   number
  height?:  number
}

interface BarChartProps {
  title:    string
  unit:     string
  points:   ChartPoint[]
  color?:   string
  width?:   number
  height?:  number
}

interface DimensionChartProps {
  title: string
  dims:  { label: string; value: number; color: string }[]
  width?:  number
  height?: number
}

const PAD = { top: 28, right: 12, bottom: 28, left: 36 }

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  unit,
  points,
  color = '#7dd3fc',
  width = 280,
  height = 140,
}) => {
  if (points.length === 0) {
    return <EmptyChart title={title} width={width} height={height} />
  }

  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const coords = points.map((p, i) => {
    const x = PAD.left + (i / Math.max(1, points.length - 1)) * innerW
    const y = PAD.top + innerH - ((p.value - min) / range) * innerH
    return { x, y, ...p }
  })

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')

  return (
    <svg width={width} height={height} className="block">
      <text x={PAD.left} y={16} fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={600}>
        {title}
      </text>
      <text x={width - PAD.right} y={16} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="end">
        {unit}
      </text>

      {[0, 0.5, 1].map((t) => {
        const y = PAD.top + innerH * (1 - t)
        return (
          <line
            key={t}
            x1={PAD.left}
            y1={y}
            x2={width - PAD.right}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />
        )
      })}

      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polyline}
      />

      {coords.map((c) => (
        <g key={c.date}>
          <circle cx={c.x} cy={c.y} r={3.5} fill={color} />
          <text
            x={c.x}
            y={height - 6}
            fill="rgba(255,255,255,0.4)"
            fontSize={8}
            textAnchor="middle"
          >
            {formatShortDate(c.date)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  unit,
  points,
  color = '#86efac',
  width = 280,
  height = 140,
}) => {
  if (points.length === 0) {
    return <EmptyChart title={title} width={width} height={height} />
  }

  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const max = Math.max(...points.map((p) => p.value), 1)
  const barW = innerW / points.length - 6

  return (
    <svg width={width} height={height} className="block">
      <text x={PAD.left} y={16} fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={600}>
        {title}
      </text>
      <text x={width - PAD.right} y={16} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="end">
        {unit}
      </text>

      {points.map((p, i) => {
        const barH = (p.value / max) * innerH
        const x = PAD.left + i * (innerW / points.length) + 3
        const y = PAD.top + innerH - barH
        return (
          <g key={p.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={height - 6}
              fill="rgba(255,255,255,0.4)"
              fontSize={8}
              textAnchor="middle"
            >
              {formatShortDate(p.date)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const DimensionChart: React.FC<DimensionChartProps> = ({
  title,
  dims,
  width = 280,
  height = 140,
}) => {
  const innerW = width - PAD.left - PAD.right
  const rowH = (height - PAD.top - PAD.bottom) / dims.length

  return (
    <svg width={width} height={height} className="block">
      <text x={PAD.left} y={16} fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={600}>
        {title}
      </text>

      {dims.map((d, i) => {
        const y = PAD.top + i * rowH + rowH * 0.35
        const barW = (d.value / 100) * innerW
        return (
          <g key={d.label}>
            <text x={PAD.left} y={y - 4} fill="rgba(255,255,255,0.5)" fontSize={9}>
              {d.label}
            </text>
            <rect
              x={PAD.left}
              y={y}
              width={innerW}
              height={rowH * 0.35}
              rx={4}
              fill="rgba(255,255,255,0.08)"
            />
            <rect
              x={PAD.left}
              y={y}
              width={barW}
              height={rowH * 0.35}
              rx={4}
              fill={d.color}
              opacity={0.9}
            />
            <text
              x={PAD.left + innerW + 4}
              y={y + rowH * 0.28}
              fill="rgba(255,255,255,0.6)"
              fontSize={9}
            >
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const EmptyChart: React.FC<{ title: string; width: number; height: number }> = ({
  title,
  width,
  height,
}) => (
  <svg width={width} height={height} className="block">
    <text x={16} y={20} fill="rgba(255,255,255,0.7)" fontSize={11}>
      {title}
    </text>
    <text x={16} y={height / 2} fill="rgba(255,255,255,0.3)" fontSize={10}>
      暂无数据
    </text>
  </svg>
)
