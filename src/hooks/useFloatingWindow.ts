import { useCallback, useEffect, useRef } from 'react'
import { getElectronAPI } from '../store/petStore'

interface Options {
  /** Pet overlay: transparent margins pass clicks to desktop */
  passthrough?: boolean
}

export function useFloatingWindow(options: Options = {}) {
  const { passthrough = false } = options
  const dragRef = useRef({ x: 0, y: 0, dragging: false })

  const setPassthrough = useCallback((ignore: boolean) => {
    if (!passthrough) return
    getElectronAPI()?.setIgnoreMouseEvents(ignore)
  }, [passthrough])

  useEffect(() => {
    if (passthrough) setPassthrough(true)
  }, [passthrough, setPassthrough])

  const onInteractiveEnter = useCallback(() => {
    setPassthrough(false)
  }, [setPassthrough])

  const onInteractiveLeave = useCallback(() => {
    if (!dragRef.current.dragging) setPassthrough(true)
  }, [setPassthrough])

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setPassthrough(false)
    dragRef.current = { x: e.screenX, y: e.screenY, dragging: true }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return
      const deltaX = ev.screenX - dragRef.current.x
      const deltaY = ev.screenY - dragRef.current.y
      dragRef.current = { x: ev.screenX, y: ev.screenY, dragging: true }
      getElectronAPI()?.windowMove({ deltaX, deltaY })
    }

    const onUp = () => {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (passthrough) setPassthrough(true)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [setPassthrough, passthrough])

  const showContextMenu = useCallback(() => {
    getElectronAPI()?.showTreehouseContextMenu()
  }, [])

  return {
    onDragMouseDown,
    onInteractiveEnter,
    onInteractiveLeave,
    showContextMenu,
  }
}
