export default function MessageBubble({ mensaje, esMio, esUltimo }) {
  const hora = new Date(mensaje.creado_en).toLocaleTimeString('es-ES', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  const burbuja = esMio
    ? {
        alignSelf:    'flex-end',
        background:   'var(--vl-carbon)',
        color:        'var(--vl-sage)',
        borderRadius: '14px 14px 2px 14px',
      }
    : {
        alignSelf:    'flex-start',
        background:   '#FFFFFF',
        color:        'var(--vl-carbon)',
        border:       '1px solid var(--vl-page-border)',
        borderRadius: '14px 14px 14px 2px',
      }

  let estadoIcono = null
  if (esMio) {
    if (mensaje._optimista) {
      estadoIcono = <span style={{ color: 'rgba(201,211,202,0.4)', fontSize: '11px' }}>○</span>
    } else if (mensaje.leido) {
      estadoIcono = <span style={{ color: 'var(--vl-sage)', fontSize: '11px' }}>✓✓</span>
    } else {
      estadoIcono = <span style={{ color: 'rgba(201,211,202,0.45)', fontSize: '11px' }}>✓</span>
    }
  }

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        maxWidth:      '75%',
        marginBottom:  esUltimo ? 14 : 3,
        opacity:       mensaje._optimista ? 0.65 : 1,
        ...burbuja,
        padding: '10px 14px',
      }}
    >
      <span style={{
        fontFamily:  'var(--vl-font-body)',
        fontSize:    '14px',
        fontWeight:  300,
        lineHeight:  '1.55',
        wordBreak:   'break-word',
        letterSpacing: '0.01em',
      }}>
        {mensaje.contenido}
      </span>

      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'flex-end',
        gap:            4,
        marginTop:      5,
      }}>
        <span style={{
          fontFamily:    'var(--vl-font-body)',
          fontSize:      '10px',
          fontWeight:    300,
          color:         'var(--vl-sage-mid)',
          letterSpacing: '0.04em',
        }}>
          {hora}
        </span>
        {estadoIcono}
      </div>
    </div>
  )
}
