import React, { useCallback, useEffect, useRef } from 'react'
import { PetSprite } from '../../components/PetSprite'
import { SpeechBubble } from '../../components/SpeechBubble'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import { useAdviceHistoryStore } from '../../store/adviceHistoryStore'
import { useHealthSnapshot } from '../../hooks/useHealthSnapshot'
import { usePetBrain } from '../../hooks/usePetBrain'
import { usePromptScheduler } from '../../features/health-prompt/promptScheduler'
import { getInteractionMessage } from '../../engine/dialogLibrary'

const PetOverlay: React.FC = () => {
  const config    = usePetStore((s) => s.config)
  const action    = usePetStore((s) => s.currentAction)
  const bubble    = usePetStore((s) => s.bubbleText)
  const setBubble = usePetStore((s) => s.setBubble)
  const setAction = usePetStore((s) => s.setAction)
  const initFromFile = usePetStore((s) => s.initFromFile)
  const pushAdvice = useAdviceHistoryStore((s) => s.push)

  useHealthSnapshot()
  usePetBrain()
  usePromptScheduler()

  const dragRef = useRef<{ x: number; y: number; dragging: boolean }>({
    x: 0, y: 0, dragging: false,
  })

  // Electron transparent windows block desktop clicks unless explicitly passthrough.
  const setPassthrough = useCallback((ignore: boolean) => {
    getElectronAPI()?.setIgnoreMouseEvents(ignore)
  }, [])

  useEffect(() => {
    setPassthrough(true)
  }, [setPassthrough])

  const onInteractiveEnter = useCallback(() => {
    setPassthrough(false)
  }, [setPassthrough])

  const onInteractiveLeave = useCallback(() => {
    if (!dragRef.current.dragging) {
      setPassthrough(true)
    }
  }, [setPassthrough])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
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
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [setPassthrough])

  const onPetClick = useCallback((e: React.MouseEvent) => {
    if (Math.abs((e as unknown as MouseEvent).movementX) > 3) return
    if (!config) return
    setBubble(getInteractionMessage(config.personality))
  }, [config, setBubble])

  const onPetDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    getElectronAPI()?.openTreehouse('report')
  }, [])

  const onPetContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    getElectronAPI()?.showPetContextMenu()
  }, [])

  useEffect(() => {
    const api = getElectronAPI()
    if (!api) return

    api.onSpeechBubble(({ text }) => {
      setBubble(text)
      void pushAdvice(text, 'system')
    })
    api.onWaterRecord((cups) => {
      setBubble(cups > 0 ? `✅ 已记录 +${cups} 杯水，继续保持！` : '好的，我记录了！')
    })
    api.onStepsRecord((steps) => {
      setBubble(`👟 步数 ${steps.toLocaleString()} 已记录！`)
    })
    api.onPetConfigUpdated(() => {
      void initFromFile().then(() => {
        setAction('happy')
        setBubble('换好啦，我是新伙伴～')
        setTimeout(() => setAction('idle'), 3000)
      })
    })

    return () => {
      api.removeAllListeners('show-speech-bubble')
      api.removeAllListeners('add-water-record')
      api.removeAllListeners('add-steps')
      api.removeAllListeners('pet-config-updated')
    }
  }, [setBubble, initFromFile, setAction, pushAdvice])

  const dismissBubble = useCallback(() => setBubble(null), [setBubble])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-end"
      style={{ background: 'transparent' }}
    >
      {/* Interactive zone: only pet + bubble capture mouse; rest is passthrough */}
      <div
        className="flex flex-col items-center"
        onMouseEnter={onInteractiveEnter}
        onMouseLeave={onInteractiveLeave}
      >
        {bubble && (
          <div className="flex justify-center mb-1">
            <SpeechBubble
              text={bubble}
              onDismiss={dismissBubble}
              duration={5000}
            />
          </div>
        )}

        <div
          className="cursor-grab active:cursor-grabbing select-none"
          style={{ marginBottom: 8 }}
          onMouseDown={onMouseDown}
          onClick={onPetClick}
          onDoubleClick={onPetDoubleClick}
          onContextMenu={onPetContextMenu}
          title="单击互动 · 双击打开树屋 · 右键菜单"
        >
          <PetSprite action={action} species={config?.species ?? 'sparrow'} size={160} />
        </div>
      </div>
    </div>
  )
}

export default PetOverlay
