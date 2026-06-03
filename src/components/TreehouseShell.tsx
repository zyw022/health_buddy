import React from 'react'
import { getElectronAPI } from '../store/petStore'

interface Props {
  children:       React.ReactNode
  title?:         string
  subtitle?:      string
  footer?:        React.ReactNode
  actions?:       React.ReactNode
  imageOpacity?:  number
}

/** Floating treehouse: image + overlay chrome (drag bar, close, actions) */
export const TreehouseShell: React.FC<Props> = ({
  children,
  title,
  subtitle,
  footer,
  actions,
  imageOpacity = 1,
}) => {
  const handleClose = () => getElectronAPI()?.closeTreehouse()

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <img
        src="treehouse/treehouseorigin.jpg"
        alt="树屋"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: imageOpacity }}
      />

      {/* Top chrome: native drag region (avoids Windows transparent-window resize glitch) */}
      <div
        className="absolute inset-x-0 top-0 z-50 flex items-center gap-2 px-2 py-1.5"
        style={{
          WebkitAppRegion: 'drag',
          background: 'linear-gradient(to bottom, rgba(8,10,22,0.82), rgba(8,10,22,0.35), transparent)',
        }}
      >
        <span className="text-white/35 text-[10px] shrink-0" title="拖动此栏移动窗口">
          ⠿
        </span>
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-white/90 text-xs font-medium truncate leading-tight">{title}</p>
          )}
          {subtitle && (
            <p className="text-white/45 text-[10px] truncate leading-tight">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div
            className="flex items-center gap-1 shrink-0"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            {actions}
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-black/40 hover:bg-red-500/80 text-white/80 hover:text-white text-sm flex items-center justify-center shrink-0 transition-colors"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="关闭树屋"
        >
          ✕
        </button>
      </div>

      {/* Interactive overlays */}
      <div className="absolute inset-0 z-[20] pointer-events-none">
        {children}
      </div>

      {footer && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 px-3 py-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8,10,22,0.88), transparent)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
