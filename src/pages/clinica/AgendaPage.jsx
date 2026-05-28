import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import { useCitas } from '../../contexts/CitasContext'
import { supabase } from '../../lib/supabase'
import StaffLayout from './StaffLayout'
import NuevaCitaDrawer from '../../components/NuevaCitaDrawer'
import CitaDetallePanel from '../../components/CitaDetallePanel'
import AgendaView from '../../components/agenda/AgendaView'

// ── UUID guard — igual que en EquipoPage / ClinicNav ──────────────────────
const isValidUUID = id =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

// ── Mock de especialistas — coherente con EquipoPage MOCK_EQUIPO ──────────
const MOCK_ESPECIALISTAS = [
  { id: 'mock-garcia', nombre: 'Dra. María García' },
  { id: 'mock-ruiz',   nombre: 'Dr. Carlos Ruiz'   },
]

// ── Helpers de fecha ──────────────────────────────────────────────────────
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

const DEMO_TODAY = new Date('2026-05-15')

// ── Componente ─────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const { citas }   = useCitas()

  const [weekStart,     setWeekStart]     = useState(() => getWeekStart(DEMO_TODAY))
  const [selectedDay,   setSelectedDay]   = useState(() => new Date(DEMO_TODAY))
  const [showDrawer,    setShowDrawer]    = useState(false)
  const [selectedCita,  setSelectedCita]  = useState(null)
  const [especialistas, setEspecialistas] = useState([])

  const isMock = !isValidUUID(clinica?.id)

  // ── Cargar especialistas (médicos activos) ─────────────────────────────
  useEffect(() => {
    if (!clinica?.id) return

    async function loadEspecialistas() {
      if (isMock) {
        // Pequeño delay para simular latencia en modo demo
        await new Promise(r => setTimeout(r, 200))
        setEspecialistas(MOCK_ESPECIALISTAS)
        return
      }

      if (!supabase) return

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('clinica_id', clinica.id)
        .eq('rol', 'medico')
        .eq('activo', true)
        .order('nombre')

      if (error) {
        console.error('[AgendaPage] loadEspecialistas error:', error)
        // Fallback silencioso: la agenda muestra sin columnas en vez de romperse
        setEspecialistas([])
      } else {
        setEspecialistas(data ?? [])
      }
    }

    loadEspecialistas()
  }, [clinica?.id, isMock])

  // ── Semana visible ──────────────────────────────────────────────────────
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

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
        <div style={{
          padding: '24px 40px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: DM_MONO, fontSize: '10px',
              color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase',
              letterSpacing: '0.14em', margin: 0,
            }}>
              Agenda semanal
            </p>
            <h1 style={{
              fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300,
              color: '#161313', margin: '4px 0 0',
            }}>
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
        <div style={{
          padding: '20px 40px 0',
          display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0,
        }}>

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
          <span style={{
            flex: 1, textAlign: 'center', fontFamily: DM_MONO,
            fontSize: '11px', color: 'rgba(22,19,19,0.4)', letterSpacing: '0.06em',
          }}>
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
        <div style={{
          padding: '16px 40px',
          borderBottom: '1px solid rgba(22,19,19,0.06)',
          flexShrink: 0,
        }}>
          <p style={{
            fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
            color: 'rgba(22,19,19,0.4)', margin: 0, textTransform: 'capitalize',
          }}>
            {selectedDay.toLocaleDateString('es-ES', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* ── AGENDA VIEW (multi-columna) ──────────────────── */}
        <AgendaView
          citas={citas}
          especialistas={especialistas}
          selectedDay={selectedDay}
          onCitaClick={setSelectedCita}
        />

      </div>

      {/* ── DRAWERS / PANELS ────────────────────────────────── */}
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
