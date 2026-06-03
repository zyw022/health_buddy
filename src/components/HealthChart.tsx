import React from 'react'

export interface ChartPoint {
  date:  string
  label: string
  value: number
}

interface LineChartProps {
  title:   string
  unit:    string
  points:  ChartPoint[]
  color?:  string
  width?:  number
  height?: number
}

interface BarChartProps {
  title:   string
  unit:    string
  points:  ChartPoint[]
  color?:  string
  width?:  number
  height?: number
}

interface DimensionChartProps {
  title:   string
  dims:    { label: string; value: number; color: string }[]
  width?:  number
  height?: number
}

// Pixel font style applied via SVG fontFamily
const PX_FONT = '"Press Start 2P", monospace'

const PAD = { top: 22, right: 10, bottom: 22, left: 32 }

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// Pixel-art dashed grid line (manual dashes to look chunky)
const PixelGridLine: React.FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2}
    stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 4" />
)

// Pixel corner decoration (2×2 blocks at corners for retro feel)
const PixelCorners: React.FC<{ w: number; h: number; color: string }> = ({ w, h, color }) => (
  <>
    {/* TL */}
    <rect x={0}   y={0}   width={4} height={4} fill={color} />
    <rect x={4}   y={0}   width={2} height={2} fill={color} opacity={0.5} />
    <rect x={0}   y={4}   width={2} height={2} fill={color} opacity={0.5} />
    {/* TR */}
    <rect x={w-4} y={0}   width={4} height={4} fill={color} />
    <rect x={w-6} y={0}   width={2} height={2} fill={color} opacity={0.5} />
    <rect x={w-2} y={4}   width={2} height={2} fill={color} opacity={0.5} />
    {/* BL */}
    <rect x={0}   y={h-4} width={4} height={4} fill={color} />
    <rect x={4}   y={h-2} width={2} height={2} fill={color} opacity={0.5} />
    <rect x={0}   y={h-6} width={2} height={2} fill={color} opacity={0.5} />
    {/* BR */}
    <rect x={w-4} y={h-4} width={4} height={4} fill={color} />
    <rect x={w-6} y={h-2} width={2} height={2} fill={color} opacity={0.5} />
    <rect x={w-2} y={h-6} width={2} height={2} fill={color} opacity={0.5} />
  </>
)

export const LineChart: React.FC<LineChartProps> = ({
  title, unit, points,
  color = '#7dd3fc',
  width = 208, height = 96,
}) => {
  if (points.length === 0) return <EmptyChart title={title} unit={unit} width={width} height={height} color={color} />

  const innerW = width  - PAD.left - PAD.right
  const innerH = height - PAD.top  - PAD.bottom
  const values = points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const coords = points.map((p, i) => ({
    x: PAD.left + (i / Math.max(1, points.length - 1)) * innerW,
    y: PAD.top  + innerH - ((p.value - min) / range) * innerH,
    ...p,
  }))

  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ')

  return (
    <svg width={width} height={height} className="block" style={{ imageRendering: 'pixelated' }}>
      {/* Title */}
      <text x={PAD.left} y={14} fill={color} fontSize={6} fontFamily={PX_FONT} fontWeight="bold"
        style={{ textShadow: `0 0 6px ${color}` }}>
        {title}
      </text>
      <text x={width - PAD.right} y={14} fill="rgba(255,255,255,0.3)" fontSize={5}
        fontFamily={PX_FONT} textAnchor="end">{unit}</text>

      {/* Grid */}
      {[0, 0.5, 1].map(t => (
        <PixelGridLine key={t}
          x1={PAD.left} y1={PAD.top + innerH * (1 - t)}
          x2={width - PAD.right} y2={PAD.top + innerH * (1 - t)} />
      ))}

      {/* Y-axis ticks */}
      {[0, 0.5, 1].map(t => {
        const val = min + range * t
        return (
          <text key={t} x={PAD.left - 3} y={PAD.top + innerH * (1 - t) + 3}
            fill="rgba(255,255,255,0.3)" fontSize={5} fontFamily={PX_FONT} textAnchor="end">
            {Math.round(val)}
          </text>
        )
      })}

      {/* Line + area fill */}
      <defs>
        <linearGradient id={`lg-${title}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#lg-${title})`}
        points={[
          `${coords[0].x},${PAD.top + innerH}`,
          ...coords.map(c => `${c.x},${c.y}`),
          `${coords[coords.length - 1].x},${PAD.top + innerH}`,
        ].join(' ')}
      />
      <polyline fill="none" stroke={color} strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="square" points={polyline} />

      {/* Data points — pixel square dots */}
      {coords.map(c => (
        <g key={c.date}>
          <rect x={c.x - 3} y={c.y - 3} width={6} height={6} fill={color} />
          <rect x={c.x - 2} y={c.y - 2} width={4} height={4} fill="rgba(0,0,0,0.4)" />
          <text x={c.x} y={height - 8} fill="rgba(255,255,255,0.35)"
            fontSize={5} fontFamily={PX_FONT} textAnchor="middle">
            {formatShortDate(c.date)}
          </text>
        </g>
      ))}

      <PixelCorners w={width} h={height} color={color} />
    </svg>
  )
}

export const BarChart: React.FC<BarChartProps> = ({
  title, unit, points,
  color = '#86efac',
  width = 208, height = 96,
}) => {
  if (points.length === 0) return <EmptyChart title={title} unit={unit} width={width} height={height} color={color} />

  const innerW = width  - PAD.left - PAD.right
  const innerH = height - PAD.top  - PAD.bottom
  const max  = Math.max(...points.map(p => p.value), 1)
  const barW = Math.max(4, innerW / points.length - 6)

  return (
    <svg width={width} height={height} className="block" style={{ imageRendering: 'pixelated' }}>
      <text x={PAD.left} y={14} fill={color} fontSize={6} fontFamily={PX_FONT} fontWeight="bold">
        {title}
      </text>
      <text x={width - PAD.right} y={14} fill="rgba(255,255,255,0.3)" fontSize={5}
        fontFamily={PX_FONT} textAnchor="end">{unit}</text>

      {/* Grid */}
      {[0, 0.5, 1].map(t => (
        <PixelGridLine key={t}
          x1={PAD.left} y1={PAD.top + innerH * (1 - t)}
          x2={width - PAD.right} y2={PAD.top + innerH * (1 - t)} />
      ))}

      {/* Bars — pixelated (no rx, flat top with bright cap strip) */}
      {points.map((p, i) => {
        const barH = Math.max(2, (p.value / max) * innerH)
        const bx   = PAD.left + i * (innerW / points.length) + 3
        const by   = PAD.top + innerH - barH
        return (
          <g key={p.date}>
            {/* Shadow */}
            <rect x={bx + 2} y={by + 2} width={barW} height={barH} fill="rgba(0,0,0,0.3)" />
            {/* Body */}
            <rect x={bx} y={by} width={barW} height={barH} fill={color} opacity={0.8} />
            {/* Bright cap */}
            <rect x={bx} y={by} width={barW} height={3} fill="white" opacity={0.35} />
            <text x={bx + barW / 2} y={height - 8}
              fill="rgba(255,255,255,0.35)" fontSize={5} fontFamily={PX_FONT} textAnchor="middle">
              {formatShortDate(p.date)}
            </text>
          </g>
        )
      })}

      <PixelCorners w={width} h={height} color={color} />
    </svg>
  )
}

export const DimensionChart: React.FC<DimensionChartProps> = ({
  title, dims,
  width = 208, height = 108,
}) => {
  const innerW = width  - PAD.left - PAD.right - 20
  const rowH   = (height - PAD.top - PAD.bottom) / dims.length

  return (
    <svg width={width} height={height} className="block" style={{ imageRendering: 'pixelated' }}>
      <text x={PAD.left} y={14} fill="#fde68a" fontSize={6} fontFamily={PX_FONT} fontWeight="bold">
        {title}
      </text>

      {dims.map((d, i) => {
        const y    = PAD.top + i * rowH + rowH * 0.25
        const barH = Math.max(5, rowH * 0.38)
        const bw   = (d.value / 100) * innerW
        return (
          <g key={d.label}>
            <text x={PAD.left} y={y} fill="rgba(255,255,255,0.55)" fontSize={5} fontFamily={PX_FONT}>
              {d.label}
            </text>
            {/* Track */}
            <rect x={PAD.left} y={y + 4} width={innerW} height={barH}
              fill="rgba(255,255,255,0.07)" />
            {/* Fill — pixelated (no rx) */}
            <rect x={PAD.left} y={y + 4} width={bw} height={barH} fill={d.color} opacity={0.9} />
            {/* Highlight stripe */}
            <rect x={PAD.left} y={y + 4} width={bw} height={2} fill="white" opacity={0.25} />
            <text x={PAD.left + innerW + 5} y={y + 4 + barH * 0.75}
              fill="rgba(255,255,255,0.5)" fontSize={5} fontFamily={PX_FONT}>
              {d.value}
            </text>
          </g>
        )
      })}

      <PixelCorners w={width} h={height} color="#fde68a" />
    </svg>
  )
}

const EmptyChart: React.FC<{ title: string; unit: string; width: number; height: number; color: string }> = ({
  title, width, height, color,
}) => (
  <svg width={width} height={height} className="block" style={{ imageRendering: 'pixelated' }}>
    <text x={PAD.left} y={14} fill={color} fontSize={6} fontFamily={PX_FONT}>{title}</text>
    <text x={width / 2} y={height / 2} fill="rgba(255,255,255,0.25)"
      fontSize={5} fontFamily={PX_FONT} textAnchor="middle">NO DATA</text>
    <PixelCorners w={width} h={height} color={color} />
  </svg>
)
