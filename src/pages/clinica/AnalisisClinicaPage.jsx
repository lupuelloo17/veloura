import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Microscope, TrendingUp, Filter } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'

const MOCK_ANALISIS = [
  { id: 'a1', paciente: 'Valentina Morales',    fecha: '15 oct 2025', puntuacion: 3, nivel: 'moderado', criterios_pos: 2, medico: 'Dra. López' },
  { id: 'a2', paciente: 'María Camila Torres',  fecha: '1 dic 2025',  puntuacion: 7, nivel: 'alto',     criterios_pos: 5, medico: 'Dr. Ruiz'   },
  { id: 'a3', paciente: 'Sofía Restrepo',       fecha: '5 nov 2025',  puntuacion: 2, nivel: 'moderado', criterios_pos: 2, medico: 'Dra. López' },
  { id: 'a4', paciente: 'Alejandra Gómez',      fecha: '10 ene 2026', puntuacion: 0, nivel: 'bajo',     criterios_pos: 0, medico: 'Dra. López' },
  { id: 'a5', paciente: 'Natalia Herrera',      fecha: '22 feb 2026', puntuacion: 1, nivel: 'bajo',     criterios_pos: 1, medico: 'Dr. Ruiz'   },
  { id: 'a6', paciente: 'Isabella Martínez',    fecha: '3 mar 2026',  puntuacion: 5, nivel: 'alto',     criterios_pos: 4, medico: 'Dra. López' },
]

const RIESGO_STYLE = {
  bajo:     { bg: '#dcfce7', text: '#15803d', bar: '#22c55e' },
  moderado: { bg: '#fef9c3', text: '#a16207', bar: '#eab308' },
  alto:     { bg: '#fee2e2', text: '#b91c1c', bar: '#ef4444' },
}

const SUMMARY = [
  { nivel: 'alto',     label: 'Alto riesgo',    count: 2 },
  { nivel: 'moderado', label: 'Moderado',        count: 2 },
  { nivel: 'bajo',     label: 'Bajo riesgo',     count: 2 },
]

export default function AnalisisClinicaPage() {
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const navigate    = useNavigate()
  const brand       = clinica?.color_primario ?? '#E8A0B0'
  const [filter, setFilter] = useState('todos')

  const filtered = MOCK_ANALISIS.filter(a =>
    filter === 'todos' || a.nivel === filter
  )

  return (
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="bg-white px-5 pt-7 pb-4 border-b border-gray-100">
          <h1 className="text-gray-900 font-bold text-lg">Análisis dermoscópicos</h1>
          <p className="text-gray-400 text-xs mt-0.5">{MOCK_ANALISIS.length} análisis · {clinica?.nombre}</p>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">
          <FeatureGate feature="dermoscopia_ia">
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                {SUMMARY.map(s => {
                  const rs = RIESGO_STYLE[s.nivel]
                  return (
                    <button
                      key={s.nivel}
                      onClick={() => setFilter(filter === s.nivel ? 'todos' : s.nivel)}
                      className="bg-white rounded-2xl p-3 text-center shadow-sm border-2 transition-all"
                      style={{ borderColor: filter === s.nivel ? rs.text : 'transparent' }}
                    >
                      <p className="text-2xl font-bold" style={{ color: rs.text }}>{s.count}</p>
                      <p className="text-gray-500 text-[10px] leading-tight mt-0.5">{s.label}</p>
                    </button>
                  )
                })}
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {['todos', 'alto', 'moderado', 'bajo'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all"
                    style={filter === f
                      ? { backgroundColor: brand, borderColor: brand, color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
                    }
                  >
                    {f === 'todos' ? 'Todos' : `Riesgo ${f}`}
                  </button>
                ))}
              </div>

              {/* Analysis list */}
              <div className="space-y-2">
                {filtered.map(a => {
                  const rs = RIESGO_STYLE[a.nivel]
                  return (
                    <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-gray-900 text-sm font-semibold">{a.paciente}</p>
                          <p className="text-gray-400 text-xs">{a.medico} · {a.fecha}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                          style={{ backgroundColor: rs.bg, color: rs.text }}
                        >
                          {a.nivel}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 text-center flex-shrink-0">
                          <p className="text-gray-900 text-xl font-bold leading-none">{a.puntuacion}</p>
                          <p className="text-gray-400 text-[9px]">/ 9</p>
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(a.puntuacion / 9) * 100}%`, backgroundColor: rs.bar }}
                          />
                        </div>
                        <div className="w-14 text-right flex-shrink-0">
                          <p className="text-gray-600 text-xs font-semibold">{a.criterios_pos} criterios</p>
                          <p className="text-gray-400 text-[10px]">positivos</p>
                        </div>
                      </div>

                      {/* Derivation alert for high risk */}
                      {a.nivel === 'alto' && (
                        <div className="mt-2 bg-red-50 rounded-xl px-3 py-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                          <p className="text-red-700 text-[10px] font-semibold">
                            Derivación urgente a Dermatología recomendada
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* New analysis CTA */}
              <button
                onClick={() => navigate('/dermoscopia')}
                className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                style={{ borderColor: brand, color: brand }}
              >
                <Microscope size={16} />
                Iniciar nuevo análisis
              </button>
            </>
          </FeatureGate>
        </div>
      </div>
    </ClinicLayout>
  )
}
