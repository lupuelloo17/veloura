// ── AgendaView ────────────────────────────────────────────────────────────
// Vista de rejilla multi-columna para la agenda, Mobile-First.
//
// Props:
//   citas        — array de objetos cita (de CitasContext)
//   especialistas — array de { id, nombre } — una columna por especialista
//   selectedDay  — Date — día que se está mostrando
//   onCitaClick  — (cita) => void — callback al pulsar un bloque
//
// Arquitectura visual:
//   ┌─────────┬──────────────┬──────────────┐
//   │  Hora   │ Especialista │ Especialista │  ← cabecera
//   ├─────────┼──────────────┼──────────────┤
//   │  09:00  │  [CitaCard]  │              │
//   │         │              │  [CitaCard]  │  ← grid scroll vertical
//   │  09:30  │              │              │
//   │  …      │              │              │
//   └─────────┴──────────────┴──────────────┘
//
//   • Rail de horas: ancho fijo (56px), sin scroll.
//   • Columnas de especialistas: scroll horizontal si hay > 1.
//   • Todo el grid: scroll vertical.
//   • useVertical() determina el término del header de columna.
// ──────────────────────────────────────────────────────────────────────────

import { useMemo }       from 'react'
import { useVertical }   from '../../hooks/useVertical'
import CitaCard          from './CitaCard'

// ── Constantes de rejilla ──────────────────────────────────────────────────
const SLOT_H    = 52       // px por media hora
const START_H   = 8        // primera hora visible (8:00)
const END_H     = 20       // última hora visible (20:00)
const RAIL_W    = 56       // px del rail de horas
const COL_MIN_W = 140      // ancho mínimo de columna de especialista (px)

const DM_SANS = "'DM Sans', system-ui, sans-serif"
const DM_MONO = "'DM Mono', monospace"

// ── Helpers ────────────────────────────────────────────────────────────────
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function timeToTop(date) {
  const d = date instanceof Date ? date : new Date(date)
  return ((d.getHours() - START_H) * 60 + d.getMinutes()) / 30 * SLOT_H
}

function durationToHeight(minutes) {
  return Math.max((minutes / 30) * SLOT_H, SLOT_H * 0.75)
}

// ── Subcomponente: cabecera de columna de especialista ─────────────────────
function ColHeader({ nombre, termino }) {
  return (
    <div style={{
      minWidth:   COL_MIN_W,
      flex:       '1 1 0',
      padding:    '10px 8px 8px',
      borderLeft: '1px solid rgba(22,19,19,0.06)',
      display:    'flex',
      flexDirection: 'column',
      gap: '2px',
    }}>
      <span style={{
        fontFamily:    DM_MONO,
        fontSize:      '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color:         'rgba(22,19,19,0.3)',
      }}>
        {termino}
      </span>
      <span style={{
        fontFamily: DM_SANS,
        fontSize:   '13px',
        fontWeight: 400,
        color:      '#161313',
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:  'nowrap',
      }}>
        {nombre}
      </span>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AgendaView({ citas = [], especialistas = [], selectedDay, onCitaClick }) {
  const v = useVertical()

  // Término vertical para la cabecera de columna (ej. "Médico", "Psicólogo"…)
  // Se usa el singular del rol médico tal como lo expone el vertical.
  const terminoEspecialista = v.medico ?? 'Especialista'

  // Altura total de la rejilla en px
  const totalH = (END_H - START_H) * SLOT_H * 2   // 2 slots por hora

  // Etiquetas de horas para el rail izquierdo
  const timeLabels = useMemo(() => {
    const labels = []
    for (let h = START_H; h <= END_H; h++) {
      labels.push({ h, label: `${String(h).padStart(2, '0')}:00` })
    }
    return labels
  }, [])

  // Citas del día seleccionado
  const citasDelDia = useMemo(() =>
    citas.filter(c => {
      const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
      return isSameDay(f, selectedDay)
    }),
    [citas, selectedDay]
  )

  // Agrupar citas por especialista
  const citasPorEsp = useMemo(() => {
    const map = {}
    for (const esp of especialistas) map[esp.id] = []
    for (const cita of citasDelDia) {
      if (map[cita.medico_id]) map[cita.medico_id].push(cita)
      // si el medico_id no está en la lista de especialistas, se omite
    }
    return map
  }, [citasDelDia, especialistas])

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:  'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── CABECERA ─────────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        flexShrink: 0,
        borderBottom: '1px solid rgba(22,19,19,0.08)',
        background: '#FAFAF8',
      }}>
        {/* Celda vacía sobre el rail de horas */}
        <div style={{
          width:      RAIL_W,
          flexShrink: 0,
          borderRight: '1px solid rgba(22,19,19,0.06)',
        }} />

        {/* Columnas de especialistas */}
        <div style={{
          display:    'flex',
          overflowX:  'auto',
          flex: 1,
          // Ocultar scrollbar de la cabecera; sincronizado manualmente si fuera
          // necesario. Para MVP, la cabecera y el grid comparten el mismo
          // contenedor scroll horizontal.
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {especialistas.length === 0 ? (
            <div style={{ padding: '12px 16px' }}>
              <span style={{
                fontFamily: DM_SANS,
                fontSize:   '12px',
                color:      'rgba(22,19,19,0.3)',
              }}>
                Sin especialistas configurados
              </span>
            </div>
          ) : (
            especialistas.map(esp => (
              <ColHeader
                key={esp.id}
                nombre={esp.nombre}
                termino={terminoEspecialista}
              />
            ))
          )}
        </div>
      </div>

      {/* ── GRID (rail + columnas) ────────────────────────────────────── */}
      {/* Contenedor con scroll vertical y sincronización de scroll horizontal */}
      <div style={{
        display:    'flex',
        flex: 1,
        overflowY:  'auto',
        overflowX:  'hidden',
      }}>

        {/* Rail de horas — fijo horizontalmente */}
        <div style={{
          width:       RAIL_W,
          flexShrink:  0,
          borderRight: '1px solid rgba(22,19,19,0.06)',
          position:    'relative',
          height:      totalH + 'px',
        }}>
          {timeLabels.map(({ h, label }) => (
            <div
              key={h}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top:  (h - START_H) * SLOT_H * 2,
                height: SLOT_H * 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                paddingRight: '10px',
                paddingTop:   '4px',
              }}
            >
              <span style={{
                fontFamily:    DM_MONO,
                fontSize:      '10px',
                color:         'rgba(22,19,19,0.22)',
                letterSpacing: '0.05em',
                lineHeight:    1,
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Columnas de especialistas con scroll horizontal */}
        <div style={{
          display:   'flex',
          flex: 1,
          overflowX: 'auto',
          height:    totalH + 'px',
          position:  'relative',
        }}>

          {/* Estado vacío global */}
          {especialistas.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display:  'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '8px', pointerEvents: 'none',
            }}>
              <i className="ti ti-calendar-off" style={{ fontSize: '28px', color: 'rgba(22,19,19,0.10)' }} />
              <p style={{
                fontFamily: DM_SANS, fontSize: '13px',
                fontWeight: 300, color: 'rgba(22,19,19,0.28)', margin: 0,
              }}>
                Sin especialistas para mostrar
              </p>
            </div>
          )}

          {especialistas.map(esp => {
            const citasEsp = citasPorEsp[esp.id] ?? []

            return (
              <div
                key={esp.id}
                style={{
                  minWidth:   COL_MIN_W,
                  flex:       '1 1 0',
                  borderLeft: '1px solid rgba(22,19,19,0.06)',
                  position:   'relative',
                  height:     totalH + 'px',
                }}
              >
                {/* Líneas de cuadrícula */}
                {timeLabels.map(({ h }) => (
                  <div key={`g-${esp.id}-${h}`}>
                    {/* Línea de hora en punto */}
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      top:    (h - START_H) * SLOT_H * 2,
                      height: SLOT_H + 'px',
                      borderTop: '1px solid rgba(22,19,19,0.06)',
                      pointerEvents: 'none',
                    }} />
                    {/* Línea de media hora */}
                    {h < END_H && (
                      <div style={{
                        position: 'absolute', left: 0, right: 0,
                        top:    (h - START_H) * SLOT_H * 2 + SLOT_H,
                        height: SLOT_H + 'px',
                        borderTop: '1px dashed rgba(22,19,19,0.03)',
                        pointerEvents: 'none',
                      }} />
                    )}
                  </div>
                ))}

                {/* Estado vacío por columna */}
                {citasEsp.length === 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display:  'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      fontFamily: DM_SANS, fontSize: '11px',
                      color: 'rgba(22,19,19,0.15)', fontWeight: 300,
                    }}>
                      —
                    </span>
                  </div>
                )}

                {/* Bloques de cita */}
                {citasEsp.map(cita => {
                  const top    = timeToTop(cita.fecha)
                  const height = durationToHeight(cita.duracion_minutos)
                  return (
                    <CitaCard
                      key={cita.id}
                      cita={cita}
                      top={top}
                      height={height}
                      onClick={() => onCitaClick?.(cita)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
