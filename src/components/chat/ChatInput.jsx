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
  const colorCount   = restantes < 20 ? 'var(--vl-taupe)' : 'var(--vl-sage-mid)'
  const puedeEnviar  = texto.trim().length > 0 && !sending && !disabled

  return (
    <div style={{
      borderTop:  '1px solid var(--vl-page-border)',
      padding:    '12px 16px',
      background: 'var(--vl-page)',
      flexShrink: 0,
    }}>
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
            flex:         1,
            resize:       'none',
            border:       '1px solid var(--vl-page-border)',
            borderRadius: '2px',
            padding:      '10px 14px',
            fontFamily:   'var(--vl-font-body)',
            fontSize:     '14px',
            fontWeight:   300,
            lineHeight:   '1.5',
            letterSpacing:'0.01em',
            outline:      'none',
            background:   disabled ? 'var(--vl-page-dark)' : '#FFFFFF',
            color:        'var(--vl-carbon)',
            overflow:     'hidden',
            transition:   'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--vl-sage-mid)'}
          onBlur={e  => e.target.style.borderColor = 'var(--vl-page-border)'}
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
            width:          36,
            height:         36,
            borderRadius:   '2px',
            border:         `1px solid ${puedeEnviar ? 'var(--vl-carbon)' : 'var(--vl-page-border)'}`,
            cursor:         puedeEnviar ? 'pointer' : 'default',
            background:     puedeEnviar ? 'var(--vl-carbon)' : 'transparent',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            transition:     'var(--vl-transition)',
          }}
        >
          {sending ? (
            <span style={{
              width:         '12px',
              height:        '12px',
              border:        `1.5px solid ${puedeEnviar ? 'var(--vl-sage)' : 'var(--vl-sage-mid)'}`,
              borderTopColor:'transparent',
              borderRadius:  '50%',
              display:       'inline-block',
              animation:     'spin 0.7s linear infinite',
            }} />
          ) : (
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill="none"
              stroke={puedeEnviar ? 'var(--vl-sage)' : 'var(--vl-sage-mid)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{
          fontFamily:    'var(--vl-font-body)',
          fontSize:      '10px',
          fontWeight:    300,
          color:         'var(--vl-sage-mid)',
          letterSpacing: '0.04em',
        }}>
          Enter para enviar · Shift+Enter para nueva línea
        </span>
        {mostrarCount && (
          <span style={{
            fontFamily: 'var(--vl-font-body)',
            fontSize:   '10px',
            fontWeight: 300,
            color:      colorCount,
          }}>
            {restantes}
          </span>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
