import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import { SpeechBubble } from '../../components/SpeechBubble'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import { useAdviceHistoryStore } from '../../store/adviceHistoryStore'
import { useHealthSnapshot } from '../../hooks/useHealthSnapshot'
import { usePetBrain } from '../../hooks/usePetBrain'
import { usePromptScheduler } from '../../features/health-prompt/promptScheduler'
import { getInteractionMessage } from '../../engine/dialogLibrary'
import { useHealthStore } from '../../store/healthStore'
import { analyzeHealth } from '../../engine/healthAnalyzer'
import { getChatReply } from '../../engine/chatReplies'
import type { Personality } from '../../store/types'

const PXF = '"Press Start 2P", monospace'

// ── Pixel context menu ────────────────────────────────────────────────────────
interface MenuItem {
  label: string
  icon:  string
  action: () => void
  danger?: boolean
}

const PixelContextMenu: React.FC<{
  items: MenuItem[]
  pos:   { x: number; y: number }
  onClose: () => void
}> = ({ items, pos, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position:   'fixed',
        left:       pos.x,
        top:        pos.y,
        zIndex:     9999,
        minWidth:   140,
        background: 'rgba(6,8,20,0.97)',
        outline:    '2px solid rgba(125,211,252,0.5)',
        outlineOffset: 0,
        boxShadow:  '3px 3px 0 rgba(0,0,0,0.8), 0 0 12px rgba(125,211,252,0.15)',
        border:     '1px solid rgba(0,0,0,0.8)',
      }}
    >
      {/* Corner accents */}
      <span style={{ position:'absolute', top:0, left:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', top:0, right:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', bottom:0, left:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', bottom:0, right:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>

      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.action(); onClose() }}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            width:       '100%',
            padding:     '8px 14px',
            background:  'transparent',
            border:      'none',
            borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            cursor:      'pointer',
            fontFamily:  PXF,
            fontSize:    8,
            color:       item.danger ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.88)',
            textAlign:   'left',
            transition:  'background 0.08s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(125,211,252,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 12 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ── Chat panel ────────────────────────────────────────────────────────────────
interface ChatMessage {
  id:     number
  role:   'user' | 'pet'
  text:   string
  typing: boolean  // pet messages start typing=true, flip to false when done
}

/** Typewriter for a single chat bubble */
function useTypingText(text: string, active: boolean, speed = 35) {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) { setOut(text); setDone(true); return }
    setOut(''); setDone(false)
    let i = 0
    const tick = () => {
      i++
      setOut(text.slice(0, i))
      if (i < text.length) {
        timerRef.current = setTimeout(tick, speed)
      } else {
        setDone(true)
      }
    }
    timerRef.current = setTimeout(tick, speed)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, active, speed])

  return { out, done }
}

const PetChatBubble: React.FC<{ text: string; typing: boolean; onDone?: () => void }> = ({ text, typing, onDone }) => {
  const { out, done } = useTypingText(text, typing, 35)
  const prevDone = useRef(false)
  useEffect(() => {
    if (done && !prevDone.current) { prevDone.current = true; onDone?.() }
  }, [done, onDone])

  return (
    <div style={{ display:'flex', gap:6, alignItems:'flex-end', marginBottom:8 }}>
      <div style={{
        padding:    '6px 10px',
        background: '#fffde8',
        outline:    '2px solid #3d2b00',
        outlineOffset: 0,
        boxShadow:  'inset 0 0 0 2px #f5c842, 2px 2px 0 #3d2b00',
        maxWidth:   180,
        fontFamily: PXF,
        fontSize:   8,
        lineHeight: 1.7,
        color:      '#2a1800',
        wordBreak:  'break-word',
        position:   'relative',
      }}>
        <span style={{ position:'absolute', top:0, left:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', top:0, right:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', bottom:0, left:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', bottom:0, right:0, width:3, height:3, background:'#3d2b00' }}/>
        {out}
        {typing && !done && (
          <span style={{ display:'inline-block', width:2, height:'0.85em', background:'#2a1800',
            marginLeft:2, verticalAlign:'middle',
            animation:'blink-cursor 0.7s step-end infinite' }} />
        )}
      </div>
    </div>
  )
}

const UserChatBubble: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
    <div style={{
      padding:    '6px 10px',
      background: 'rgba(125,211,252,0.15)',
      outline:    '2px solid rgba(125,211,252,0.6)',
      outlineOffset: 0,
      boxShadow:  '2px 2px 0 rgba(0,0,0,0.6)',
      maxWidth:   180,
      fontFamily: PXF,
      fontSize:   8,
      lineHeight: 1.7,
      color:      '#e0f7ff',
      wordBreak:  'break-word',
      position:   'relative',
    }}>
      <span style={{ position:'absolute', top:0, left:0, width:3, height:3, background:'rgba(125,211,252,0.7)' }}/>
      <span style={{ position:'absolute', top:0, right:0, width:3, height:3, background:'rgba(125,211,252,0.7)' }}/>
      <span style={{ position:'absolute', bottom:0, left:0, width:3, height:3, background:'rgba(125,211,252,0.7)' }}/>
      <span style={{ position:'absolute', bottom:0, right:0, width:3, height:3, background:'rgba(125,211,252,0.7)' }}/>
      {text}
    </div>
  </div>
)

let msgId = 0

const ChatPanel: React.FC<{
  petName:     string
  personality: Personality
  onClose:     () => void
  onPetReply:  (text: string) => void
}> = ({ petName, personality, onClose, onPetReply }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id:     ++msgId,
      role:   'pet',
      text:   `嗨！我是${petName}，有什么想聊的吗？😊`,
      typing: true,
    },
  ])
  const [input, setInput]     = useState('')
  const [busy,  setBusy]      = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)

    const userMsg: ChatMessage = { id: ++msgId, role: 'user', text, typing: false }
    setMessages(prev => [...prev, userMsg])

    // Simulate thinking delay
    setTimeout(() => {
      const reply = getChatReply(text, personality)
      const petMsg: ChatMessage = { id: ++msgId, role: 'pet', text: reply, typing: true }
      setMessages(prev => [...prev, petMsg])
      onPetReply(reply)
      setBusy(false)
    }, 600 + Math.random() * 400)
  }, [input, busy, personality, onPetReply])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <motion.div
      initial={{ opacity:0, y:10, scale:0.95 }}
      animate={{ opacity:1, y:0,  scale:1 }}
      exit={{    opacity:0, y:10, scale:0.95 }}
      transition={{ duration:0.15 }}
      style={{
        position:   'absolute',
        bottom:     '115%',
        left:       '50%',
        transform:  'translateX(-50%)',
        width:      240,
        zIndex:     100,
        background: 'rgba(6,8,20,0.97)',
        outline:    '2px solid rgba(125,211,252,0.55)',
        outlineOffset: 0,
        boxShadow:  '3px 3px 0 rgba(0,0,0,0.8), 0 0 16px rgba(125,211,252,0.12)',
        border:     '1px solid rgba(0,0,0,0.7)',
      }}
    >
      {/* Corner accents */}
      <span style={{ position:'absolute', top:0, left:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', top:0, right:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', bottom:0, left:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>
      <span style={{ position:'absolute', bottom:0, right:0, width:4, height:4, background:'rgba(125,211,252,0.7)', display:'block' }}/>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'7px 10px 6px', borderBottom:'1px solid rgba(125,211,252,0.2)' }}>
        <span style={{ fontFamily:PXF, fontSize:8, color:'#7dd3fc',
          textShadow:'0 0 6px #7dd3fc66' }}>💬 和{petName}聊天</span>
        <button onClick={onClose} style={{ fontFamily:PXF, fontSize:8, color:'rgba(125,211,252,0.8)',
          background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>✕</button>
      </div>

      {/* Message body */}
      <div ref={bodyRef} style={{ padding:'8px 10px', maxHeight:200, overflowY:'auto',
        display:'flex', flexDirection:'column' }}>
        {messages.map(m =>
          m.role === 'pet'
            ? <PetChatBubble key={m.id} text={m.text} typing={m.typing} />
            : <UserChatBubble key={m.id} text={m.text} />
        )}
        {busy && (
          <div style={{ fontFamily:PXF, fontSize:7, color:'rgba(125,211,252,0.45)',
            marginBottom:4, paddingLeft:2 }}>
            {'●●●'}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display:'flex', borderTop:'1px solid rgba(125,211,252,0.2)', padding:'6px 8px', gap:6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="说点什么…"
          style={{
            flex:        1,
            background:  'rgba(255,255,255,0.06)',
            outline:     '1px solid rgba(125,211,252,0.35)',
            outlineOffset:0,
            border:      '1px solid rgba(0,0,0,0.5)',
            padding:     '5px 8px',
            fontFamily:  PXF,
            fontSize:    7,
            color:       'rgba(255,255,255,0.88)',
            caretColor:  '#7dd3fc',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || busy}
          style={{
            fontFamily: PXF, fontSize:7, padding:'5px 8px',
            background:  input.trim() && !busy ? 'rgba(125,211,252,0.2)' : 'rgba(255,255,255,0.04)',
            outline:     '2px solid rgba(125,211,252,0.5)',
            outlineOffset:0,
            border:      '1px solid rgba(0,0,0,0.5)',
            color:       input.trim() && !busy ? '#7dd3fc' : 'rgba(255,255,255,0.25)',
            cursor:      input.trim() && !busy ? 'pointer' : 'default',
            boxShadow:   '2px 2px 0 rgba(0,0,0,0.6)',
          }}
        >
          发送
        </button>
      </div>
    </motion.div>
  )
}

// ── Main overlay ──────────────────────────────────────────────────────────────
const PetOverlay: React.FC = () => {
  const config    = usePetStore((s) => s.config)
  const action    = usePetStore((s) => s.currentAction)
  const bubble    = usePetStore((s) => s.bubbleText)
  const setBubble = usePetStore((s) => s.setBubble)
  const setAction = usePetStore((s) => s.setAction)
  const initFromFile = usePetStore((s) => s.initFromFile)
  const pushAdvice = useAdviceHistoryStore((s) => s.push)
  const { setRaw, setState, persistToday } = useHealthStore()

  useHealthSnapshot()
  usePetBrain()
  usePromptScheduler()

  const dragRef = useRef<{ x: number; y: number; dragging: boolean }>({
    x: 0, y: 0, dragging: false,
  })

  const [ctxMenu, setCtxMenu]   = useState<{ x: number; y: number } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const setPassthrough = useCallback((ignore: boolean) => {
    getElectronAPI()?.setIgnoreMouseEvents(ignore)
  }, [])

  useEffect(() => { setPassthrough(true) }, [setPassthrough])

  const onInteractiveEnter = useCallback(() => { setPassthrough(false) }, [setPassthrough])
  const onInteractiveLeave = useCallback(() => {
    if (!dragRef.current.dragging) setPassthrough(true)
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
    // Show pixel context menu at mouse position
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // Context menu items
  const petName = config?.name ?? '小伙伴'
  const contextMenuItems: MenuItem[] = [
    {
      icon: '💬',
      label: `和${petName}聊天`,
      action: () => setChatOpen(true),
    },
    {
      icon: '📊',
      label: '查看健康报告',
      action: () => getElectronAPI()?.openTreehouse('report'),
    },
    {
      icon: '🔄',
      label: '更换宠物',
      action: () => getElectronAPI()?.openTreehouse('change-pet'),
    },
    {
      icon: '👁',
      label: '隐藏宠物',
      action: () => setPassthrough(true),
      danger: true,
    },
  ]

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
    api.onStepsRecord((delta) => {
      const currentRaw = useHealthStore.getState().raw
      if (currentRaw) {
        const updatedRaw = { ...currentRaw, steps: currentRaw.steps + delta }
        const updatedState = analyzeHealth(updatedRaw)
        setRaw(updatedRaw)
        setState(updatedState)
        void persistToday(updatedRaw, updatedState)
      }
      setBubble(`👟 已记录 +${delta.toLocaleString()} 步，继续加油！`)
    })
    api.onPetConfigUpdated(() => {
      void initFromFile().then(() => {
        setAction('happy')
        setBubble('换好啦，我是新伙伴～')
        setTimeout(() => setAction('idle'), 3000)
      })
    })

    let actionRestoreTimer = 0
    api.onPetAction((raw) => {
      const act = raw as import('../../store/types').PetAction
      setAction(act)
      clearTimeout(actionRestoreTimer)
      actionRestoreTimer = window.setTimeout(() => setAction('idle'), 3000)
    })

    return () => {
      api.removeAllListeners('show-speech-bubble')
      api.removeAllListeners('add-water-record')
      api.removeAllListeners('add-steps')
      api.removeAllListeners('pet-config-updated')
      api.removeAllListeners('pet-action-trigger')
      clearTimeout(actionRestoreTimer)
    }
  }, [setBubble, initFromFile, setAction, pushAdvice, setRaw, setState, persistToday])

  const dismissBubble = useCallback(() => setBubble(null), [setBubble])

  const handlePetReply = useCallback((text: string) => {
    setBubble(text)
  }, [setBubble])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-end"
      style={{ background: 'transparent' }}
    >
      {/* Interactive zone — FIXED width = pet size so the bubble's centering
          reference never changes (canvas sizing can't move it). */}
      <div
        style={{ position: 'relative', width: 110 }}
        onMouseEnter={onInteractiveEnter}
        onMouseLeave={onInteractiveLeave}
      >
        {/* Chat panel — above bubble */}
        <AnimatePresence>
          {chatOpen && (
            <ChatPanel
              key="chat"
              petName={petName}
              personality={(config?.personality ?? 'friend') as Personality}
              onClose={() => setChatOpen(false)}
              onPetReply={handlePetReply}
            />
          )}
        </AnimatePresence>

        {/* Speech bubble — centred deterministically: parent is 110px, bubble is
            200px, so left = (110-200)/2 = -45px. Fixed pixels mean it is in the
            correct place on the very first paint (no measured-width dependence). */}
        <div style={{
          position:      'absolute',
          bottom:        '100%',
          left:          -45,
          paddingBottom: 4,
          width:         200,
          display:       'flex',
          justifyContent:'center',
        }}>
          <SpeechBubble
            text={bubble}
            onDismiss={dismissBubble}
            duration={5000}
          />
        </div>

        <div
          className="cursor-grab active:cursor-grabbing select-none"
          style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}
          onMouseDown={onMouseDown}
          onClick={onPetClick}
          onDoubleClick={onPetDoubleClick}
          onContextMenu={onPetContextMenu}
          title="单击互动 · 双击打开树屋 · 右键菜单"
        >
          <PetSprite action={action} species={config?.species ?? 'sparrow'} size={110} />
        </div>
      </div>

      {/* Pixel context menu — portalled via state, rendered outside pet div */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            key="ctx"
            initial={{ opacity:0, scale:0.93 }}
            animate={{ opacity:1, scale:1 }}
            exit={{    opacity:0, scale:0.93 }}
            transition={{ duration:0.1 }}
            style={{ position:'fixed', inset:0, zIndex:9998, pointerEvents:'auto' }}
            onClick={() => setCtxMenu(null)}
          >
            <PixelContextMenu
              items={contextMenuItems}
              pos={ctxMenu}
              onClose={() => setCtxMenu(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PetOverlay
