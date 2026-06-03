// Augment React.CSSProperties to include Electron-specific drag region
import 'react'

declare module 'react' {
  interface CSSProperties {
    /** Electron transparent-window drag region */
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}
