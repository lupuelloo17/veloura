// ── CitaCard ───────────────────────────────────────────────────────────────
// Bloque visual de una cita sobre la rejilla horaria.
// Props:
//   cita    — objeto cita del CitasContext
//   top     — posición vertical en px (calculada por AgendaView)
//   height  — altura en px (calculada por AgendaView)
//   onClick — callback al pulsar el bloque
// ──────────────────────────────────────────────────────────────────────────

const DM_SANS = "'DM Sans', system-ui, sans-serif"
const DM_MONO = "'DM Mono', monospace"

// Paleta editorial por estado — coherente con AgendaPage.jsx
const CITA_STYLE = {
  pendiente:  { bg: 'rgba(201,164,106,0.12)', border: 'rgba(201,164,106,0.30)', text: '#8B6A3A' },
  confirmada: { bg: 'rgba(146,156,146,0.12)', border: 'rgba(146,156,146,0.30)', text: '#5A6B5B' },
  completada: { bg: 'rgba(22,19,19,0.05)',    border: 'rgba(22,19,19,0.12)',    text: 'rgba(22,19,19,0.5)' },
  cancelada:  { bg: 'rgba(163,147,132,0.08)', border: 'rgba(163,147,132,0.20)', text: '#7A6B5E' },
  no_asistio: { bg: 'rgba(22,19,19,0.03)',    border: 'rgba(22,19,19,0.08)',    text: 'rgba(22,19,19,0.3)' },
}

export default function CitaCard({ cita, top, height, onClick }) {
  const s = CITA_STYLE[cita.estado] ?? CITA_STYLE.pendiente

  const fecha    = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
  const horaStr  = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
  const showMeta = height > 52

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left:     '4px',
        right:    '4px',
        top:      `${top}px`,
        height:   `${height}px`,
        borderRadius: '2px',
        border:   `1px solid ${s.border}`,
        background: s.bg,
        padding:  '6px 8px',
        cursor:   'pointer',
        overflow: 'hidden',
        display:  'flex',
        flexDirection: 'column',
        gap: '2px',
        // micro-shadow para legibilidad sobre la cuadrícula
        boxShadow: '0 1px 3px rgba(22,19,19,0.05)',
      }}
    >
      {/* Nombre del paciente */}
      <p style={{
        fontFamily: DM_SANS,
        fontSize: '12px',
        fontWeight: 400,
        color: s.text,
        margin: 0,
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {cita.paciente_nombre}
      </p>

      {/* Tratamiento — sólo si hay altura suficiente */}
      {showMeta && (
        <p style={{
          fontFamily: DM_SANS,
          fontSize: '11px',
          fontWeight: 300,
          color: s.text,
          opacity: 0.75,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {cita.tratamiento}
        </p>
      )}

      {/* Hora — sólo si hay altura suficiente */}
      {showMeta && (
        <p style={{
          fontFamily: DM_MONO,
          fontSize: '10px',
          color: s.text,
          opacity: 0.45,
          margin: 0,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {horaStr}
        </p>
      )}
    </div>
  )
}
