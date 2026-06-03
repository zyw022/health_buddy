import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import { getChatReply } from '../../engine/chatReplies'
import type { Personality } from '../../store/types'

const PXF = '"Press Start 2P", monospace'

interface ChatMessage {
  id:     number
  role:   'user' | 'pet'
  text:   string
  typing: boolean
}

/** Typewriter for a single chat bubble */
function useTypingText(text: string, active: boolean, speed = 32) {
  const [out, setOut]   = useState(active ? '' : text)
  const [done, setDone] = useState(!active)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) { setOut(text); setDone(true); return }
    setOut(''); setDone(false)
    let i = 0
    const tick = () => {
      i++
      setOut(text.slice(0, i))
      if (i < text.length) timerRef.current = setTimeout(tick, speed)
      else setDone(true)
    }
    timerRef.current = setTimeout(tick, speed)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, active, speed])

  return { out, done }
}

const PetBubble: React.FC<{ text: string; typing: boolean }> = ({ text, typing }) => {
  const { out, done } = useTypingText(text, typing)
  return (
    <div style={{ display:'flex', marginBottom:8 }}>
      <div style={{
        padding:    '6px 10px',
        background: '#fffde8',
        outline:    '2px solid #3d2b00',
        boxShadow:  'inset 0 0 0 2px #f5c842, 2px 2px 0 #3d2b00',
        maxWidth:   190,
        fontFamily: PXF, fontSize: 8, lineHeight: 1.7,
        color:      '#2a1800', wordBreak: 'break-word', position: 'relative',
      }}>
        <span style={{ position:'absolute', top:0, left:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', top:0, right:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', bottom:0, left:0, width:3, height:3, background:'#3d2b00' }}/>
        <span style={{ position:'absolute', bottom:0, right:0, width:3, height:3, background:'#3d2b00' }}/>
        {out}
        {typing && !done && (
          <span style={{ display:'inline-block', width:2, height:'0.85em', background:'#2a1800',
            marginLeft:2, verticalAlign:'middle', animation:'blink-cursor 0.7s step-end infinite' }} />
        )}
      </div>
    </div>
  )
}

const UserBubble: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
    <div style={{
      padding:    '6px 10px',
      background: 'rgba(125,211,252,0.15)',
      outline:    '2px solid rgba(125,211,252,0.6)',
      boxShadow:  '2px 2px 0 rgba(0,0,0,0.6)',
      maxWidth:   190,
      fontFamily: PXF, fontSize: 8, lineHeight: 1.7,
      color:      '#e0f7ff', wordBreak: 'break-word', position: 'relative',
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

const PetChat: React.FC = () => {
  const config = usePetStore((s) => s.config)
  const initFromFile = usePetStore((s) => s.initFromFile)

  useEffect(() => { void initFromFile() }, [initFromFile])

  const petName     = config?.name ?? '小伙伴'
  const personality = (config?.personality ?? 'friend') as Personality

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy,  setBusy]  = useState(false)
  const bodyRef  = useRef<HTMLDivElement>(null)
  const greeted  = useRef(false)

  // Greeting once config is loaded
  useEffect(() => {
    if (greeted.current || !config) return
    greeted.current = true
    setMessages([{ id: ++msgId, role: 'pet', typing: true,
      text: `嗨！我是${config.name}，有什么想聊的吗？😊` }])
  }, [config])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, busy])

  const close = useCallback(() => { getElectronAPI()?.closeChat() }, [])

  const send = useCallback(() => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    setMessages(prev => [...prev, { id: ++msgId, role: 'user', text, typing: false }])

    setTimeout(() => {
      const reply = getChatReply(text, personality)
      setMessages(prev => [...prev, { id: ++msgId, role: 'pet', text: reply, typing: true }])
      getElectronAPI()?.sendChatReplyToPet(reply)
      setBusy(false)
    }, 550 + Math.random() * 400)
  }, [input, busy, personality])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#060814',
      outline: '2px solid rgba(125,211,252,0.6)',
      outlineOffset: -2,
      boxShadow: 'inset 0 0 0 1px #000',
      overflow: 'hidden',
    }}>
      {/* Corner accents */}
      <span style={{ position:'fixed', top:2, left:2, width:5, height:5, background:'rgba(125,211,252,0.8)', zIndex:2 }}/>
      <span style={{ position:'fixed', top:2, right:2, width:5, height:5, background:'rgba(125,211,252,0.8)', zIndex:2 }}/>
      <span style={{ position:'fixed', bottom:2, left:2, width:5, height:5, background:'rgba(125,211,252,0.8)', zIndex:2 }}/>
      <span style={{ position:'fixed', bottom:2, right:2, width:5, height:5, background:'rgba(125,211,252,0.8)', zIndex:2 }}/>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'9px 12px 8px', borderBottom:'2px solid rgba(125,211,252,0.2)', flexShrink:0 }}>
        <span style={{ fontFamily:PXF, fontSize:9, color:'#7dd3fc', textShadow:'0 0 6px #7dd3fc66' }}>
          💬 和{petName}聊天
        </span>
        <button onClick={close} style={{ fontFamily:PXF, fontSize:9, color:'rgba(125,211,252,0.85)',
          background:'transparent', border:'none', cursor:'pointer', lineHeight:1, padding:'0 2px' }}>✕</button>
      </div>

      {/* Messages */}
      <div ref={bodyRef} style={{ flex:1, padding:'10px 12px', overflowY:'auto',
        display:'flex', flexDirection:'column' }}>
        {messages.map(m =>
          m.role === 'pet'
            ? <PetBubble key={m.id} text={m.text} typing={m.typing} />
            : <UserBubble key={m.id} text={m.text} />
        )}
        {busy && (
          <div style={{ fontFamily:PXF, fontSize:8, color:'rgba(125,211,252,0.45)', marginBottom:4, paddingLeft:2 }}>
            ●●●
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:6, padding:'8px 10px',
        borderTop:'2px solid rgba(125,211,252,0.2)', flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="说点什么…"
          autoFocus
          style={{
            flex:1, background:'rgba(255,255,255,0.06)',
            outline:'1px solid rgba(125,211,252,0.35)',
            border:'1px solid rgba(0,0,0,0.5)', padding:'6px 8px',
            fontFamily:PXF, fontSize:8, color:'rgba(255,255,255,0.9)', caretColor:'#7dd3fc',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || busy}
          style={{
            fontFamily:PXF, fontSize:8, padding:'6px 10px',
            background: input.trim() && !busy ? 'rgba(125,211,252,0.2)' : 'rgba(255,255,255,0.04)',
            outline:'2px solid rgba(125,211,252,0.5)',
            border:'1px solid rgba(0,0,0,0.5)',
            color: input.trim() && !busy ? '#7dd3fc' : 'rgba(255,255,255,0.25)',
            cursor: input.trim() && !busy ? 'pointer' : 'default',
            boxShadow:'2px 2px 0 rgba(0,0,0,0.6)', flexShrink:0,
          }}
        >发送</button>
      </div>
    </div>
  )
}

export default PetChat
