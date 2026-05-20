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
          display:     'flex',
          alignItems:  'center',
          gap:         12,
          padding:     '14px 16px',
          borderBottom:'1px solid #F0EDE8',
          background:  '#fff',
          flexShrink:  0,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {medico?.foto ? (
            <img
              src={medico.foto}
              alt={medico.nombre}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width:          44,
                height:         44,
                borderRadius:   '50%',
                background:     '#FDF8F0',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       16,
                fontWeight:     600,
                color:          '#C9A46A',
              }}
            >
              {iniciales(medico?.nombre)}
            </div>
          )}
          <span
            style={{
              position:     'absolute',
              bottom:       1,
              right:        1,
              width:        10,
              height:       10,
              borderRadius: '50%',
              background:   '#22C55E',
              border:       '2px solid #fff',
            }}
          />
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#2D2A26' }}>
            {medico?.nombre ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {medico?.especialidad ?? ''}
          </div>
        </div>
      </div>

      {/* ── Lista de mensajes ── */}
      <div
        ref={listRef}
        style={{
          flex:      1,
          overflowY: 'auto',
          padding:   16,
          display:   'flex',
          flexDirection: 'column',
        }}
      >
        {error && (
          <div
            style={{
              background:   '#FEF2F2',
              border:       '1px solid #FECACA',
              borderRadius: 8,
              padding:      '10px 14px',
              color:        '#DC2626',
              fontSize:     13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {mensajes.length === 0 && !error ? (
          <div
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              color:          '#9CA3AF',
            }}
          >
            <span style={{ fontSize: 36 }}>💬</span>
            <span style={{ fontSize: 14 }}>Inicia la conversación</span>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.tipo === 'separador') {
              return (
                <div
                  key={`sep-${i}`}
                  style={{
                    textAlign:  'center',
                    fontSize:   11,
                    color:      '#9CA3AF',
                    margin:     '12px 0 8px',
                  }}
                >
                  {item.etiqueta}
                </div>
              )
            }

            const { msg }       = item
            const esMio         = msg.remitente_id === pacienteId
            const siguiente     = items[i + 1]
            const esUltimo      =
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
