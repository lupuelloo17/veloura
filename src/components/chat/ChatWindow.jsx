import { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput     from './ChatInput'

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function etiquetaFecha(fechaStr) {
  const hoy  = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  const d    = new Date(fechaStr)
  if (d.toDateString() === hoy.toDateString())  return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function agruparPorFecha(mensajes) {
  const grupos = []
  let fechaActual = null

  for (const msg of mensajes) {
    const etiqueta = etiquetaFecha(msg.creado_en)
    if (etiqueta !== fechaActual) {
      fechaActual = etiqueta
      grupos.push({ tipo: 'separador', etiqueta })
    }
    grupos.push({ tipo: 'mensaje', msg })
  }

  return grupos
}

export default function ChatWindow({
  mensajes,
  medico,
  pacienteId,
  sending,
  error,
  onSend,
}) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [mensajes.length])

  const items = agruparPorFecha(mensajes)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Cabecera ── */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        14,
          padding:    '20px 20px 18px',
          background: 'var(--vl-carbon)',
          flexShrink: 0,
        }}
      >
        {medico?.foto ? (
          <img
            src={medico.foto}
            alt={medico.nombre}
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid rgba(201,211,202,0.15)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            className="vl-avatar-dark"
            style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}
          >
            {iniciales(medico?.nombre)}
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--vl-font-body)',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--vl-page)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {medico?.nombre ?? '—'}
          </p>
          {medico?.especialidad && (
            <p style={{
              margin: '2px 0 0',
              fontFamily: 'var(--vl-font-body)',
              fontSize: '10px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {medico.especialidad}
            </p>
          )}
        </div>
      </div>

      {/* ── Lista de mensajes ── */}
      <div
        ref={listRef}
        style={{
          flex:          1,
          overflowY:     'auto',
          padding:       '16px 16px 8px',
          display:       'flex',
          flexDirection: 'column',
          background:    'var(--vl-page)',
        }}
      >
        {error && (
          <div style={{
            borderLeft: '2px solid var(--vl-taupe)',
            paddingLeft: '12px',
            marginBottom: '12px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 300,
              color: 'var(--vl-taupe)',
              lineHeight: 1.6,
            }}>
              {error}
            </p>
          </div>
        )}

        {mensajes.length === 0 && !error ? (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--vl-font-display)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--vl-sage-mid)',
              fontWeight: 300,
            }}>
              Inicia la conversación
            </p>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.tipo === 'separador') {
              return (
                <div
                  key={`sep-${i}`}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '10px',
                    margin:     '16px 0 10px',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: 'var(--vl-page-border)' }} />
                  <span style={{
                    fontFamily:    'var(--vl-font-body)',
                    fontSize:      '10px',
                    fontWeight:    300,
                    color:         'var(--vl-sage-mid)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace:    'nowrap',
                  }}>
                    {item.etiqueta}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--vl-page-border)' }} />
                </div>
              )
            }

            const { msg }   = item
            const esMio     = msg.remitente_id === pacienteId
            const siguiente = items[i + 1]
            const esUltimo  =
              !siguiente ||
              siguiente.tipo === 'separador' ||
              siguiente.msg?.remitente_id !== msg.remitente_id

            return (
              <MessageBubble
                key={msg.id}
                mensaje={msg}
                esMio={esMio}
                esUltimo={esUltimo}
              />
            )
          })
        )}
      </div>

      {/* ── Input ── */}
      <ChatInput onSend={onSend} sending={sending} disabled={!medico} />
    </div>
  )
}
