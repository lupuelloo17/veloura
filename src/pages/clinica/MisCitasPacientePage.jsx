import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Clock, ChevronLeft, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import { useCitas, ESTADO_STYLE } from '../../contexts/CitasContext'
import ClinicLayout from './ClinicLayout'
import { fTime, fDate, fDateShort } from '../../services/recordatorios'

// Demo: mostramos citas de la paciente Sofía Restrepo (p2)
const DEMO_PATIENT_ID  = 'p2'
const DEMO_PATIENT_NAME = 'Sofía Restrepo'
const DEMO_NOW         = new Date('2026-05-15T08:30:00')

function diasRestantes(fecha) {
  const diff = fecha.getTime() - DEMO_NOW.getTime()
  return Math.ceil(diff / 86_400_000)
}

export default function MisCitasPacientePage() {
  const navigate    = useNavigate()
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const { citas, actualizarCita } = useCitas()
  const brand       = clinica?.color_primario ?? '#C8A882'

  const [cancelConfirm, setCancelConfirm] = useState(null)

  const misCitas = useMemo(() =>
    citas
      .filter(c => c.paciente_id === DEMO_PATIENT_ID)
      .sort((a, b) => {
        const fa = a.fecha instanceof Date ? a.fecha : new Date(a.fecha)
        const fb = b.fecha instanceof Date ? b.fecha : new Date(b.fecha)
        return fb - fa  // más reciente primero
      }),
    [citas]
  )

  const proxima = useMemo(() =>
    misCitas.find(c => {
      const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
      return f > DEMO_NOW && !['cancelada', 'no_asistio'].includes(c.estado)
    }),
    [misCitas]
  )

  const pasadas = useMemo(() =>
    misCitas.filter(c => {
      const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
      return f <= DEMO_NOW || ['cancelada', 'no_asistio', 'completada'].includes(c.estado)
    }),
    [misCitas]
  )

  function handleCancelar(cita) {
    const f    = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
    const diff = f.getTime() - DEMO_NOW.getTime()
    if (diff < 86_400_000) return  // menos de 24h, no se puede
    actualizarCita(cita.id, { estado: 'cancelada' })
    setCancelConfirm(null)
  }

  function canCancel(cita) {
    const f    = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
    const diff = f.getTime() - DEMO_NOW.getTime()
    return diff >= 86_400_000 && !['cancelada','completada','no_asistio'].includes(cita.estado)
  }

  return (
    <ClinicLayout>
      <div className="animate-fade-in">

        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-gray-900 font-bold text-base">Mis citas</h1>
              <p className="text-gray-400 text-xs">{DEMO_PATIENT_NAME}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">

          {/* ── Próxima cita destacada ── */}
          {proxima ? (() => {
            const f    = proxima.fecha instanceof Date ? proxima.fecha : new Date(proxima.fecha)
            const dias = diasRestantes(f)
            const s    = ESTADO_STYLE[proxima.estado]
            return (
              <div
                className="rounded-3xl p-4 shadow-sm"
                style={{ backgroundColor: brand, color: '#fff' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white/70 text-xs font-medium">Próxima cita</p>
                    <p className="text-white font-bold text-lg leading-tight mt-0.5">
                      {dias === 0
                        ? 'Hoy'
                        : dias === 1
                          ? 'Mañana'
                          : `En ${dias} días`
                      }
                    </p>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: s.bg, color: s.text }}
                  >
                    {s.label}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={13} className="text-white/70 flex-shrink-0" />
                    <p className="text-white/90 text-sm capitalize">{fDate(f)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-white/70 flex-shrink-0" />
                    <p className="text-white/90 text-sm">
                      {fTime(f)} · {proxima.duracion_minutos} min
                    </p>
                  </div>
                  <p className="text-white/80 text-sm font-medium">{proxima.tratamiento}</p>
                  <p className="text-white/60 text-xs">{proxima.medico_nombre}</p>
                </div>

                {canCancel(proxima) && (
                  <button
                    onClick={() => setCancelConfirm(proxima)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/20 text-white border border-white/30 transition-all active:scale-95"
                  >
                    Cancelar esta cita
                  </button>
                )}
                {!canCancel(proxima) && proxima.estado !== 'cancelada' && (
                  <p className="text-white/50 text-[10px] text-center">
                    La cancelación solo es posible hasta 24 h antes
                  </p>
                )}
              </div>
            )
          })() : (
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <CalendarDays size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-semibold text-sm">Sin citas próximas</p>
              <p className="text-gray-400 text-xs mt-1">Contacta con tu clínica para reservar</p>
            </div>
          )}

          {/* ── Historial de citas pasadas ── */}
          {pasadas.length > 0 && (
            <div>
              <p className="text-gray-600 text-xs font-semibold mb-2 px-1">Historial</p>
              <div className="space-y-2">
                {pasadas.map(cita => {
                  const f = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
                  const s = ESTADO_STYLE[cita.estado]
                  return (
                    <div
                      key={cita.id}
                      className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm"
                    >
                      {/* Icono de estado */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: s.bg }}
                      >
                        {cita.estado === 'completada'
                          ? <CheckCircle2 size={16} style={{ color: s.text }} />
                          : cita.estado === 'cancelada'
                            ? <XCircle size={16} style={{ color: s.text }} />
                            : <AlertCircle size={16} style={{ color: s.text }} />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-semibold truncate">
                          {cita.tratamiento}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {fDateShort(f)} · {fTime(f)} · {cita.medico_nombre}
                        </p>
                      </div>

                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmación cancelar */}
      {cancelConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setCancelConfirm(null)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 p-6 shadow-2xl">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <XCircle size={22} className="text-red-500" />
              </div>
              <h3 className="text-gray-900 font-bold text-base">¿Cancelar cita?</h3>
              <p className="text-gray-500 text-sm mt-1">
                {cancelConfirm.tratamiento} —{' '}
                {(cancelConfirm.fecha instanceof Date ? cancelConfirm.fecha : new Date(cancelConfirm.fecha))
                  .toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Mantener cita
              </button>
              <button
                onClick={() => handleCancelar(cancelConfirm)}
                className="flex-1 py-3.5 rounded-2xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#dc2626' }}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </ClinicLayout>
  )
}
