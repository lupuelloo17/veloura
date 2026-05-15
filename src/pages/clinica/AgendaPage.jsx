import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import { useCitas, ESTADO_STYLE } from '../../contexts/CitasContext'
import ClinicLayout from './ClinicLayout'
import NuevaCitaDrawer from '../../components/NuevaCitaDrawer'
import CitaDetallePanel from '../../components/CitaDetallePanel'

// ── Constantes de la rejilla ───────────────────────────────────────────────
const SLOT_H  = 52   // px por 30 min
const START_H = 9
const END_H   = 20

// ── Helpers ────────────────────────────────────────────────────────────────
const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function getWeekStart(date) {
  const d   = new Date(date)
  const day = d.getDay() || 7      // 1=Lu … 7=Do
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

// Fecha "hoy" del demo
const DEMO_TODAY = new Date('2026-05-15')

// ── Componente ─────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { slug }   = useParams()
  const { clinica } = useClinic()
  const { citas }  = useCitas()
  const brand      = clinica?.color_primario ?? '#C8A882'

  const [weekStart, setWeekStart]   = useState(() => getWeekStart(DEMO_TODAY))
  const [selectedDay, setSelectedDay] = useState(() => new Date(DEMO_TODAY))
  const [showNueva, setShowNueva]   = useState(false)
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

  // Time labels (one per hour)
  const timeLabels = useMemo(() => {
    const labels = []
    for (let h = START_H; h <= END_H; h++) {
      labels.push({ h, label: `${String(h).padStart(2,'0')}:00` })
    }
    return labels
  }, [])

  const totalH = (END_H - START_H) * SLOT_H * 2  // total height of the grid

  const monthLabel = selectedDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <ClinicLayout>
      <div className="flex flex-col h-full animate-fade-in">

        {/* ── Header ── */}
        <div className="bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-gray-900 font-bold text-base capitalize">{monthLabel}</h1>
            <button
              onClick={() => setShowNueva(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
              style={{ backgroundColor: brand }}
              aria-label="Nueva cita"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Semana: nav + tabs de días */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prev = addDays(weekStart, -7)
                setWeekStart(prev)
                setSelectedDay(prev)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"
            >
              <ChevronLeft size={14} className="text-gray-500" />
            </button>

            <div className="flex flex-1 justify-between">
              {weekDays.map((day, i) => {
                const isToday    = isSameDay(day, DEMO_TODAY)
                const isSelected = isSameDay(day, selectedDay)
                const hasCitas   = citas.some(c =>
                  isSameDay(c.fecha instanceof Date ? c.fecha : new Date(c.fecha), day)
                )
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all"
                    style={isSelected ? { backgroundColor: brand } : {}}
                  >
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: isSelected ? '#fff' : '#9ca3af' }}
                    >
                      {DIAS[i]}
                    </span>
                    <span
                      className="text-sm font-bold leading-none"
                      style={{ color: isSelected ? '#fff' : isToday ? brand : '#1f2937' }}
                    >
                      {day.getDate()}
                    </span>
                    <div
                      className="w-1 h-1 rounded-full transition-all"
                      style={{
                        backgroundColor: hasCitas
                          ? (isSelected ? 'rgba(255,255,255,0.6)' : brand)
                          : 'transparent'
                      }}
                    />
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                const next = addDays(weekStart, 7)
                setWeekStart(next)
                setSelectedDay(next)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"
            >
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Sub-header: día seleccionado ── */}
        <div className="bg-gray-50 px-5 py-2 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-500 capitalize">
            {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <span className="font-bold text-gray-800">{citasDelDia.length} citas</span>
          </p>
        </div>

        {/* ── Rejilla de tiempo ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {citasDelDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: brand + '18' }}
              >
                <Clock size={22} style={{ color: brand }} />
              </div>
              <p className="text-gray-700 font-semibold text-sm">Sin citas este día</p>
              <p className="text-gray-400 text-xs mt-1">
                Usa el botón <strong>+</strong> para crear una nueva cita
              </p>
            </div>
          ) : (
            <div className="flex" style={{ minHeight: totalH }}>
              {/* Columna de horas */}
              <div className="w-11 flex-shrink-0 relative border-r border-gray-100">
                {timeLabels.map(({ h, label }) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 pr-1.5 flex justify-end items-start"
                    style={{ top: (h - START_H) * SLOT_H * 2, height: SLOT_H * 2 }}
                  >
                    <span className="text-[9px] text-gray-300 font-medium mt-0.5 leading-none">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columna principal con citas */}
              <div className="flex-1 relative">
                {/* Líneas de cuadrícula */}
                {timeLabels.map(({ h }) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-gray-50"
                    style={{ top: (h - START_H) * SLOT_H * 2, height: SLOT_H * 2 }}
                  />
                ))}
                {/* Líneas de medias horas (más tenues) */}
                {timeLabels.map(({ h }) => h < END_H && (
                  <div
                    key={`h${h}`}
                    className="absolute left-0 right-0 border-b border-dashed"
                    style={{
                      top: (h - START_H) * SLOT_H * 2 + SLOT_H,
                      borderColor: '#f0f0f0',
                    }}
                  />
                ))}

                {/* Bloques de cita */}
                {citasDelDia.map(cita => {
                  const s      = ESTADO_STYLE[cita.estado]
                  const top    = timeToTop(cita.fecha)
                  const height = durationToHeight(cita.duracion_minutos)
                  const fecha  = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
                  return (
                    <button
                      key={cita.id}
                      onClick={() => setSelectedCita(cita)}
                      className="absolute left-1.5 right-1.5 rounded-xl border text-left transition-all active:scale-95 overflow-hidden"
                      style={{
                        top: top + 2,
                        height: height - 4,
                        backgroundColor: s.bg,
                        borderColor: s.border,
                      }}
                    >
                      <div className="px-2 py-1.5">
                        <p
                          className="text-xs font-bold truncate leading-snug"
                          style={{ color: s.text }}
                        >
                          {String(fecha.getHours()).padStart(2,'0')}:{String(fecha.getMinutes()).padStart(2,'0')} · {cita.paciente_nombre.split(' ')[0]}
                        </p>
                        {height >= SLOT_H * 1.5 && (
                          <p
                            className="text-[10px] truncate leading-snug opacity-75"
                            style={{ color: s.text }}
                          >
                            {cita.tratamiento}
                          </p>
                        )}
                        {height >= SLOT_H * 2.5 && (
                          <p
                            className="text-[10px] opacity-50 leading-snug mt-0.5"
                            style={{ color: s.text }}
                          >
                            {cita.duracion_minutos} min · {s.label}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showNueva && (
        <NuevaCitaDrawer
          onClose={() => setShowNueva(false)}
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
    </ClinicLayout>
  )
}
