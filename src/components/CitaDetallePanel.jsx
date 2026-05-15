import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Clock, User, ChevronRight, CheckCircle2, XCircle, Pencil } from 'lucide-react'
import { ESTADO_STYLE } from '../contexts/CitasContext'
import { useCitas } from '../contexts/CitasContext'
import { useClinic } from '../contexts/ClinicContext'
import { fTime, fDate } from '../services/recordatorios'

const TODOS_ESTADOS = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio']

export default function CitaDetallePanel({ cita, onClose, slug }) {
  const navigate = useNavigate()
  const { actualizarCita } = useCitas()
  const { clinica } = useClinic()
  const brand = clinica?.color_primario ?? '#C8A882'

  const [estado, setEstado]   = useState(cita.estado)
  const [notas, setNotas]     = useState(cita.notas_previas || '')
  const [guardado, setGuardado] = useState(false)

  const style = ESTADO_STYLE[estado]

  function cambiarEstado(nuevoEstado) {
    setEstado(nuevoEstado)
    actualizarCita(cita.id, { estado: nuevoEstado })
  }

  function guardarNotas() {
    actualizarCita(cita.id, { notas_previas: notas })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1500)
  }

  const fecha = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
  const canCancel = cita.estado !== 'cancelada' && cita.estado !== 'completada'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 animate-slide-up shadow-2xl"
           style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-bold text-base">Detalle de cita</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Paciente */}
          <div className="flex items-center gap-3 mb-4">
            {cita.paciente_foto
              ? <img src={cita.paciente_foto} alt={cita.paciente_nombre}
                     className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
              : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: brand }}
                >
                  {cita.paciente_nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
              )
            }
            <div>
              <p className="text-gray-900 font-semibold text-sm">{cita.paciente_nombre}</p>
              <p className="text-gray-400 text-xs">{cita.medico_nombre}</p>
            </div>
          </div>

          {/* Datos de la cita */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Pencil size={14} className="text-gray-400 flex-shrink-0" />
              <p className="text-gray-800 text-sm font-medium">{cita.tratamiento}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <p className="text-gray-600 text-sm">
                {fDate(fecha)} · {fTime(fecha)} · {cita.duracion_minutos} min
              </p>
            </div>
          </div>

          {/* Estado selector */}
          <div className="mb-4">
            <p className="text-gray-600 text-xs font-semibold mb-2">Estado</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TODOS_ESTADOS.map(e => {
                const s = ESTADO_STYLE[e]
                return (
                  <button
                    key={e}
                    onClick={() => cambiarEstado(e)}
                    className="py-2 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95"
                    style={e === estado
                      ? { backgroundColor: s.bg, borderColor: s.border, color: s.text }
                      : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#9ca3af' }
                    }
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notas previas */}
          <div className="mb-4">
            <p className="text-gray-600 text-xs font-semibold mb-2">Notas previas</p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Sin notas…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
            />
            <button
              onClick={guardarNotas}
              className="mt-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: guardado ? '#16a34a' : brand, color: '#fff' }}
            >
              {guardado ? '✓ Guardado' : 'Guardar notas'}
            </button>
          </div>

          {/* Acciones rápidas */}
          <div className="space-y-2 mb-4">
            {canCancel && estado !== 'confirmada' && (
              <button
                onClick={() => cambiarEstado('confirmada')}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
              >
                <CheckCircle2 size={16} /> Confirmar cita
              </button>
            )}
            {estado !== 'completada' && estado !== 'cancelada' && (
              <button
                onClick={() => cambiarEstado('completada')}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
              >
                <CheckCircle2 size={16} /> Marcar como completada
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => cambiarEstado('cancelada')}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
              >
                <XCircle size={16} /> Cancelar cita
              </button>
            )}
          </div>

          {/* Ver historial */}
          <button
            onClick={() => { onClose(); navigate(`/clinica/${slug}/paciente/${cita.paciente_id}`) }}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User size={15} />
            Ver historial completo del paciente
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    </>
  )
}
