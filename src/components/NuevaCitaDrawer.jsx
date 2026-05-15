import { useState, useMemo } from 'react'
import { X, Search, ChevronRight, ChevronLeft, Check, Clock, CalendarDays } from 'lucide-react'
import { TRATAMIENTOS, MOCK_PACIENTES_LISTA, useCitas } from '../contexts/CitasContext'
import { useClinic } from '../contexts/ClinicContext'
import { fTime } from '../services/recordatorios'
import { formatEUR } from '../config/planes'

// ── Helpers ────────────────────────────────────────────────────────────────
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

function isSlotOccupied(slotDate, duracion, existingCitas) {
  const slotEnd = new Date(slotDate.getTime() + duracion * 60_000)
  return existingCitas.some(c => {
    if (['cancelada', 'no_asistio'].includes(c.estado)) return false
    const cStart = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
    const cEnd   = new Date(cStart.getTime() + c.duracion_minutos * 60_000)
    return slotDate < cEnd && slotEnd > cStart
  })
}

function buildTimeSlots(date, duracion, existingCitas) {
  const slots = []
  for (let h = 9; h < 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const t = new Date(date)
      t.setHours(h, m, 0, 0)
      slots.push({
        date: t,
        label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
        ocupado: isSlotOccupied(t, duracion ?? 30, existingCitas),
      })
    }
  }
  return slots
}

// ── Componente principal ───────────────────────────────────────────────────
export default function NuevaCitaDrawer({ onClose, defaultDate }) {
  const { citas, crearCita } = useCitas()
  const { clinica } = useClinic()
  const brand = clinica?.color_primario ?? '#C8A882'

  const [paso, setPaso]             = useState(1)
  const [query, setQuery]           = useState('')
  const [paciente, setPaciente]     = useState(null)
  const [tratamiento, setTratamiento] = useState(null)
  const [duracionCustom, setDuracionCustom] = useState(60)
  const [fecha, setFecha]           = useState(defaultDate ?? new Date('2026-05-15'))
  const [hora, setHora]             = useState(null)
  const [exito, setExito]           = useState(false)

  const duracion = tratamiento
    ? (tratamiento.duracion ?? duracionCustom)
    : 30

  const filteredPacientes = useMemo(() =>
    MOCK_PACIENTES_LISTA.filter(p =>
      `${p.nombre} ${p.email}`.toLowerCase().includes(query.toLowerCase())
    ), [query])

  // Días disponibles: hoy + 13 días
  const diasDisponibles = useMemo(() => {
    const base = new Date('2026-05-15')
    return Array.from({ length: 14 }, (_, i) => addDays(base, i))
  }, [])

  const timeSlots = useMemo(() =>
    buildTimeSlots(fecha, duracion, citas),
    [fecha, duracion, citas]
  )

  function handleCrear() {
    if (!paciente || !tratamiento || !hora) return
    crearCita({
      paciente_id:     paciente.id,
      paciente_nombre: paciente.nombre,
      paciente_foto:   paciente.foto,
      tratamiento:     tratamiento.label,
      fecha:           hora,
      duracion_minutos: duracion,
      estado:          'pendiente',
      notas_previas:   '',
    })
    setExito(true)
  }

  const PASOS = ['Paciente', 'Tratamiento', 'Fecha y hora', 'Confirmar']

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl animate-slide-up flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-gray-900 font-bold text-base">Nueva cita</h2>
            <p className="text-gray-400 text-xs">
              Paso {paso} de 4 — {PASOS[paso - 1]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 mb-3 flex-shrink-0">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(paso / 4) * 100}%`, backgroundColor: brand }}
            />
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">

          {/* Éxito */}
          {exito && (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: brand + '20' }}
              >
                <Check size={28} style={{ color: brand }} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-1">¡Cita creada!</h3>
              <p className="text-gray-500 text-sm mb-6">
                {paciente?.nombre} · {tratamiento?.label}<br />
                {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora && fTime(hora)}
              </p>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl text-white font-semibold"
                style={{ backgroundColor: brand }}
              >
                Listo
              </button>
              <button
                onClick={() => {
                  setPaso(1); setPaciente(null); setTratamiento(null)
                  setHora(null); setExito(false)
                }}
                className="w-full mt-2 py-3 rounded-2xl text-gray-500 text-sm font-medium border border-gray-200"
              >
                Crear otra cita
              </button>
            </div>
          )}

          {/* Paso 1 — Paciente */}
          {!exito && paso === 1 && (
            <div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
                <Search size={14} className="text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nombre o email…"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
              <div className="space-y-2">
                {filteredPacientes.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPaciente(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-95"
                    style={paciente?.id === p.id
                      ? { borderColor: brand, backgroundColor: brand + '10' }
                      : { borderColor: '#e5e7eb', backgroundColor: '#fff' }
                    }
                  >
                    {p.foto
                      ? <img src={p.foto} alt={p.nombre} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: brand }}
                        >
                          {p.nombre.split(' ').map(w => w[0]).slice(0,2).join('')}
                        </div>
                      )
                    }
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 text-sm font-semibold">{p.nombre}</p>
                      <p className="text-gray-400 text-xs">Última visita: {p.ultima_visita}</p>
                    </div>
                    {paciente?.id === p.id && (
                      <Check size={16} style={{ color: brand }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2 — Tratamiento */}
          {!exito && paso === 2 && (
            <div className="space-y-2">
              {TRATAMIENTOS.map(t => (
                <button
                  key={t.label}
                  onClick={() => setTratamiento(t)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-95"
                  style={tratamiento?.label === t.label
                    ? { borderColor: brand, backgroundColor: brand + '10' }
                    : { borderColor: '#e5e7eb', backgroundColor: '#fff' }
                  }
                >
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm font-semibold">{t.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-gray-400" />
                        <p className="text-gray-400 text-xs">
                          {t.duracion ? `${t.duracion} min` : 'Personalizable'}
                        </p>
                      </div>
                      {t.precio != null && (
                        <span className="text-xs font-semibold" style={{ color: '#C8A882' }}>
                          {formatEUR(t.precio)}
                        </span>
                      )}
                    </div>
                  </div>
                  {tratamiento?.label === t.label && (
                    <Check size={16} style={{ color: brand }} />
                  )}
                </button>
              ))}

              {tratamiento?.duracion === null && (
                <div className="bg-gray-50 rounded-xl p-3 mt-2">
                  <p className="text-gray-600 text-xs font-medium mb-2">Duración personalizada</p>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90, 120].map(d => (
                      <button
                        key={d}
                        onClick={() => setDuracionCustom(d)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                        style={duracionCustom === d
                          ? { backgroundColor: brand, borderColor: brand, color: '#fff' }
                          : { borderColor: '#e5e7eb', color: '#6b7280' }
                        }
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3 — Fecha y hora */}
          {!exito && paso === 3 && (
            <div>
              {/* Selector de días */}
              <p className="text-gray-600 text-xs font-semibold mb-2">Selecciona el día</p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
                {diasDisponibles.map(day => {
                  const isSelected = isSameDay(day, fecha)
                  const label = day.toLocaleDateString('es-ES', { weekday: 'short' })
                  const num   = day.getDate()
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setFecha(day); setHora(null) }}
                      className="flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-2xl border transition-all"
                      style={isSelected
                        ? { backgroundColor: brand, borderColor: brand }
                        : { borderColor: '#e5e7eb', backgroundColor: '#fff' }
                      }
                    >
                      <span className="text-[9px] font-medium capitalize"
                            style={{ color: isSelected ? '#fff' : '#9ca3af' }}>{label}</span>
                      <span className="text-sm font-bold"
                            style={{ color: isSelected ? '#fff' : '#1f2937' }}>{num}</span>
                    </button>
                  )
                })}
              </div>

              {/* Slots de tiempo */}
              <p className="text-gray-600 text-xs font-semibold mb-2">
                Horas disponibles · {duracion} min
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {timeSlots.map(slot => (
                  <button
                    key={slot.label}
                    disabled={slot.ocupado}
                    onClick={() => setHora(slot.date)}
                    className="py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={
                      slot.ocupado
                        ? { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#d1d5db', cursor: 'not-allowed' }
                        : hora && isSameDay(hora, slot.date) && hora.getHours() === slot.date.getHours() && hora.getMinutes() === slot.date.getMinutes()
                          ? { backgroundColor: brand, borderColor: brand, color: '#fff' }
                          : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 4 — Confirmación */}
          {!exito && paso === 4 && (
            <div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-5">
                <Row label="Paciente"    value={paciente?.nombre} />
                <Row label="Tratamiento" value={tratamiento?.label} />
                <Row label="Duración"    value={`${duracion} min`} />
                {tratamiento?.precio != null && (
                  <Row label="Precio" value={formatEUR(tratamiento.precio)} />
                )}
                <Row
                  label="Fecha"
                  value={fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Row label="Hora"  value={hora ? fTime(hora) : '—'} />
                <Row label="Médico" value="Dra. García" />
                <Row label="Estado" value="Pendiente" />
              </div>

              <button
                onClick={handleCrear}
                disabled={!hora}
                className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                style={{ backgroundColor: hora ? brand : '#d1d5db' }}
              >
                <CalendarDays className="inline mr-2" size={16} />
                Crear cita
              </button>
            </div>
          )}
        </div>

        {/* ── Navegación entre pasos ── */}
        {!exito && (
          <div className="px-5 pb-6 pt-3 flex gap-2 flex-shrink-0 border-t border-gray-100">
            {paso > 1 && (
              <button
                onClick={() => setPaso(p => p - 1)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold flex items-center justify-center gap-1"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            {paso < 4 && (
              <button
                onClick={() => setPaso(p => p + 1)}
                disabled={
                  (paso === 1 && !paciente) ||
                  (paso === 2 && !tratamiento) ||
                  (paso === 3 && !hora)
                }
                className="flex-1 py-3.5 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-1 transition-all"
                style={{
                  backgroundColor:
                    (paso === 1 && !paciente) || (paso === 2 && !tratamiento) || (paso === 3 && !hora)
                      ? '#d1d5db' : brand,
                }}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-800 text-sm font-semibold capitalize">{value}</span>
    </div>
  )
}
