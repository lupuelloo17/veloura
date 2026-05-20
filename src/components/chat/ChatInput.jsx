import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, sending, disabled }) {
  const [texto, setTexto] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [texto])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = texto.trim()
      if (trimmed && !sending && !disabled) {
        onSend(trimmed)
        setTexto('')
      }
    }
  }

  const restantes    = 1000 - texto.length
  const mostrarCount = restantes < 100
  const colorCount   = restantes < 20 ? '#EF4444' : '#9CA3AF'
  const puedeEnviar  = texto.trim().length > 0 && !sending && !disabled

  return (
    <div style={{ borderTop: '1px solid #F0EDE8', padding: '12px 16px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Escribe un mensaje…"
          rows={1}
          style={{
            flex:       1,
            resize:     'none',
            border:     '1px solid #E5E0D8',
            borderRadius: 12,
            padding:    '10px 14px',
            fontSize:   15,
            lineHeight: '1.45',
            outline:    'none',
            background: disabled ? '#F9F7F4' : '#fff',
            color:      '#2D2A26',
            overflow:   'hidden',
          }}
        />

        <button
          onClick={() => {
            const trimmed = texto.trim()
            if (trimmed && puedeEnviar) {
              onSend(trimmed)
              setTexto('')
            }
          }}
          disabled={!puedeEnviar}
          style={{
            width:        40,
            height:       40,
            borderRadius: '50%',
            border:       'none',
            cursor:       puedeEnviar ? 'pointer' : 'default',
            background:   puedeEnviar ? '#C9A46A' : '#F0EDE8',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
            transition:   'background 0.2s',
          }}
        >
          {sending ? (
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke={puedeEnviar ? '#fff' : '#9CA3AF'}
              strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
          ) : (
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke={puedeEnviar ? '#fff' : '#9CA3AF'}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </span>
        {mostrarCount && (
          <span style={{ fontSize: 11, color: colorCount }}>{restantes}</span>
        )}
      </div>
    </div>
  )
}
