import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import { useCitas, ESTADO_STYLE } from '../../contexts/CitasContext'
import StaffLayout from './StaffLayout'
import NuevaCitaDrawer from '../../components/NuevaCitaDrawer'
import CitaDetallePanel from '../../components/CitaDetallePanel'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

// ── Constantes de la rejilla ───────────────────────────────────────────────
const SLOT_H  = 52
const START_H = 9
const END_H   = 20

// ── Helpers ────────────────────────────────────────────────────────────────
const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function getWeekStart(date) {
  const d   = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function timeToTop(date) {
  const fecha = date instanceof Date ? date : new Date(date)
  return ((fecha.getHours() - START_H) * 60 + fecha.getMinutes()) / 30 * SLOT_H
}

function durationToHeight(minutes) {
  return Math.max((minutes / 30) * SLOT_H, SLOT_H)
}

const DEMO_TODAY = new Date('2026-05-15')

// ── Colores de estado editorial ────────────────────────────────────────────
const CITA_STYLE = {
  pendiente:  { bg: 'rgba(201,164,106,0.12)', border: 'rgba(201,164,106,0.3)', text: '#8B6A3A' },
  confirmada: { bg: 'rgba(146,156,146,0.12)', border: 'rgba(146,156,146,0.3)', text: '#5A6B5B' },
  completada: { bg: 'rgba(22,19,19,0.05)',    border: 'rgba(22,19,19,0.12)',   text: 'rgba(22,19,19,0.5)' },
  cancelada:  { bg: 'rgba(163,147,132,0.08)', border: 'rgba(163,147,132,0.2)', text: '#7A6B5E' },
  no_asistio: { bg: 'rgba(22,19,19,0.03)',    border: 'rgba(22,19,19,0.08)',   text: 'rgba(22,19,19,0.3)' },
}

// ── Componente ─────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const { citas }   = useCitas()

  const [weekStart,    setWeekStart]    = useState(() => getWeekStart(DEMO_TODAY))
  const [selectedDay,  setSelectedDay]  = useState(() => new Date(DEMO_TODAY))
  const [showDrawer,   setShowDrawer]   = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const citasDelDia = useMemo(() =>
    citas
      .filter(c => isSameDay(c.fecha instanceof Date ? c.fecha : new Date(c.fecha), selectedDay))
      .sort((a, b) => {
        const fa = a.fecha instanceof Date ? a.fecha : new Date(a.fecha)
        const fb = b.fecha instanceof Date ? b.fecha : new Date(b.fecha)
        return fa - fb
      }),
    [citas, selectedDay]
  )

  const timeLabels = useMemo(() => {
    const labels = []
    for (let h = START_H; h <= END_H; h++) {
      labels.push({ h, label: `${String(h).padStart(2, '0')}:00` })
    }
    return labels
  }, [])

  const totalH = (END_H - START_H) * SLOT_H * 2

  const weekRangeLabel = (() => {
    const start = weekDays[0]
    const end   = weekDays[6]
    const fmt   = d => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    return `${fmt(start)} — ${fmt(end)} ${end.getFullYear()}`
  })()

  return (
    <StaffLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ padding: '24px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
              Agenda semanal
            </p>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', margin: '4px 0 0' }}>
              Agenda
            </h1>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            style={{
              background: '#161313', color: '#F7F5F2', border: 'none',
              borderRadius: '2px', padding: '10px 18px',
              fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: '14px' }} />
            Nueva cita
          </button>
        </div>

        {/* ── NAVEGACIÓN SEMANAL ──────────────────────────── */}
        <div style={{ padding: '20px 40px 0', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>

          {/* Botón anterior */}
          <button
            onClick={() => { const p = addDays(weekStart, -7); setWeekStart(p); setSelectedDay(p) }}
            style={{
              width: '32px', height: '32px', borderRadius: '2px',
              border: '1px solid rgba(22,19,19,0.1)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(22,19,19,0.4)', fontSize: '16px', flexShrink: 0,
            }}
          >
            <i className="ti ti-chevron-left" />
          </button>

          {/* Rango */}
          <span style={{ flex: 1, textAlign: 'center', fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.4)', letterSpacing: '0.06em' }}>
            {weekRangeLabel}
          </span>

          {/* Tabs de días */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDay)
              const isToday    = isSameDay(day, DEMO_TODAY)
              const citasCount = citas.filter(c =>
                isSameDay(c.fecha instanceof Date ? c.fecha : new Date(c.fecha), day)
              ).length

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '8px 12px', borderRadius: '2px', minWidth: '52px',
                    textAlign: 'center', cursor: 'pointer',
                    background: isSelected ? '#161313' : 'transparent',
                    border: `1px solid ${isSelected ? '#161313' : isToday ? '#929C92' : 'rgba(22,19,19,0.08)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontFamily: DM_MONO, fontSize: '9px', textTransform: 'uppercase',
                    letterSpacing: '0.1em', marginBottom: '4px',
                    color: isSelected ? '#C9D3CA' : 'rgba(22,19,19,0.35)',
                  }}>
                    {DIAS[i]}
                  </div>
                  <div style={{
                    fontFamily: DM_SANS, fontSize: '15px', fontWeight: 400,
                    color: isSelected ? '#F7F5F2' : '#161313',
                  }}>
                    {day.getDate()}
                  </div>
                  {citasCount > 0 && (
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      fontSize: '9px', fontFamily: DM_MONO,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '2px auto 0',
                      background: isSelected ? '#929C92' : 'rgba(22,19,19,0.08)',
                      color: isSelected ? '#161313' : 'rgba(22,19,19,0.4)',
                    }}>
                      {citasCount}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={() => { const n = addDays(weekStart, 7); setWeekStart(n); setSelectedDay(n) }}
            style={{
              width: '32px', height: '32px', borderRadius: '2px',
              border: '1px solid rgba(22,19,19,0.1)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(22,19,19,0.4)', fontSize: '16px', flexShrink: 0,
            }}
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>

        {/* ── SUB-HEADER ──────────────────────────────────── */}
        <div style={{ padding: '16px 40px', borderBottom: '1px solid rgba(22,19,19,0.06)', flexShrink: 0 }}>
          <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: 0, textTransform: 'capitalize' }}>
            {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── REJILLA DE TIEMPO ───────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Columna de horas */}
          <div style={{ width: '64px', flexShrink: 0, borderRight: '1px solid rgba(22,19,19,0.06)', position: 'relative', paddingTop: '8px' }}>
            {timeLabels.map(({ h, label }) => (
              <div
                key={h}
                style={{
                  position: 'absolute', left: 0, right: 0,
                  top: (h - START_H) * SLOT_H * 2,
                  height: SLOT_H * 2,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                  paddingRight: '12px', paddingTop: '4px',
                }}
              >
                <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.25)', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Área de citas */}
          <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
            <div style={{ position: 'relative', height: totalH + 'px' }}>

              {/* Líneas de cuadrícula */}
              {timeLabels.map(({ h }) => (
                <div key={`full-${h}`}>
                  <div style={{
                    position: 'absolute', left: 0, right: 0,
                    top: (h - START_H) * SLOT_H * 2,
                    height: SLOT_H + 'px',
                    borderTop: '1px solid rgba(22,19,19,0.07)',
                  }} />
                  {h < END_H && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      top: (h - START_H) * SLOT_H * 2 + SLOT_H,
                      height: SLOT_H + 'px',
                      borderTop: '1px solid rgba(22,19,19,0.03)',
                    }} />
                  )}
                </div>
              ))}

              {/* Estado vacío */}
              {citasDelDia.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <i className="ti ti-calendar-off" style={{ fontSize: '28px', color: 'rgba(22,19,19,0.12)' }} />
                  <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
                    Sin citas este día
                  </p>
                </div>
              )}

              {/* Bloques de cita */}
              {citasDelDia.map(cita => {
                const s      = CITA_STYLE[cita.estado] ?? CITA_STYLE.pendiente
                const top    = timeToTop(cita.fecha)
                const height = Math.max(durationToHeight(cita.duracion_minutos), 36)
                const fecha  = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
                const horaStr = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`

                return (
                  <div
                    key={cita.id}
                    onClick={() => setSelectedCita(cita)}
                    style={{
                      position: 'absolute', left: '8px', right: '8px',
                      top: top + 'px', height: height + 'px',
                      borderRadius: '2px', padding: '8px 10px',
                      cursor: 'pointer', overflow: 'hidden',
                      border: `1px solid ${s.border}`,
                      background: s.bg,
                    }}
                  >
                    <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 400, color: s.text, lineHeight: 1.3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cita.paciente_nombre}
                    </p>
                    {height > 52 && (
                      <p style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: s.text, opacity: 0.7, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cita.tratamiento}
                      </p>
                    )}
                    {height > 52 && (
                      <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: s.text, opacity: 0.5, margin: '4px 0 0' }}>
                        {horaStr}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── DRAWERS / PANELS ────────────────────────────── */}
      {showDrawer && (
        <NuevaCitaDrawer
          onClose={() => setShowDrawer(false)}
          defaultDate={selectedDay}
        />
      )}
      {selectedCita && (
        <CitaDetallePanel
          cita={selectedCita}
          onClose={() => setSelectedCita(null)}
          slug={slug}
        />
      )}
    </StaffLayout>
  )
}
