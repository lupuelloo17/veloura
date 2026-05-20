export default function MessageBubble({ mensaje, esMio, esUltimo }) {
  const hora = new Date(mensaje.creado_en).toLocaleTimeString('es-ES', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  const burbuja = esMio
    ? {
        alignSelf:    'flex-end',
        background:   '#2D2A26',
        color:        '#F7F3EE',
        borderRadius: '18px 18px 4px 18px',
      }
    : {
        alignSelf:    'flex-start',
        background:   '#F7F3EE',
        color:        '#2D2A26',
        borderRadius: '18px 18px 18px 4px',
      }

  let estadoIcono = null
  if (esMio) {
    if (mensaje._optimista) {
      estadoIcono = <span style={{ color: 'inherit' }}>○</span>
    } else if (mensaje.leido) {
      estadoIcono = <span style={{ color: '#C9A46A' }}>✓✓</span>
    } else {
      estadoIcono = <span style={{ color: 'rgba(247,243,238,0.5)' }}>✓</span>
    }
  }

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        maxWidth:      '78%',
        marginBottom:  esUltimo ? 12 : 3,
        opacity:       mensaje._optimista ? 0.7 : 1,
        ...burbuja,
        padding:       '10px 14px',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: '1.45', wordBreak: 'break-word' }}>
        {mensaje.contenido}
      </span>
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'flex-end',
          gap:            4,
          marginTop:      4,
        }}
      >
        <span style={{ fontSize: 11, opacity: 0.6 }}>{hora}</span>
        {estadoIcono && <span style={{ fontSize: 12 }}>{estadoIcono}</span>}
      </div>
    </div>
  )
}
