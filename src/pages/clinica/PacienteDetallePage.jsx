import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Microscope, FileText, Phone, Mail } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'

// ── Mock patient data keyed by id ─────────────────────────────
const MOCK_PATIENT = {
  id: 'p1',
  nombre: 'Valentina', apellido: 'Morales',
  email: 'valentina.morales@email.com',
  telefono: '+57 310 555 0101',
  fecha_nacimiento: '1994-03-15',
  medico: 'Dra. Carmen López',
  tipo_piel: 'Mixta',
  alergias: 'Ninguna conocida',
  creado_en: '2025-07-03',
}

const MOCK_SESIONES = [
  { id: 's1', fecha: '18 oct 2025', tratamiento: 'Peeling Enzimático',            medico: 'Dra. López', nota: 'Piel notablemente más uniforme.', puntuacion: null },
  { id: 's2', fecha: '5 sep 2025',  tratamiento: 'Vitamina C + Ácido Hialurónico', medico: 'Dra. López', nota: 'Mejora en luminosidad.',          puntuacion: null },
  { id: 's3', fecha: '12 ago 2025', tratamiento: 'Hidratación Profunda',           medico: 'Dra. Ruiz',  nota: 'Primera sesión.',                 puntuacion: null },
]

const MOCK_ANALISIS = [
  { id: 'a1', fecha: '15 oct 2025', puntuacion: 3, nivel: 'moderado', criterios_pos: 2 },
  { id: 'a2', fecha: '10 ago 2025', puntuacion: 1, nivel: 'bajo',     criterios_pos: 1 },
]

const RIESGO_STYLE = {
  bajo:     { bg: '#dcfce7', text: '#15803d' },
  moderado: { bg: '#fef9c3', text: '#a16207' },
  alto:     { bg: '#fee2e2', text: '#b91c1c' },
}

const TABS = ['Información', 'Sesiones', 'Análisis']

export default function PacienteDetallePage() {
  const navigate    = useNavigate()
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const brand       = clinica?.color_primario ?? '#E8A0B0'
  const [tab, setTab] = useState(0)

  const edad = new Date().getFullYear() - new Date(MOCK_PATIENT.fecha_nacimiento).getFullYear()

  return (
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="bg-white px-5 pt-7 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(`/clinica/${slug}/pacientes`)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-gray-900 font-bold text-base leading-tight">
                {MOCK_PATIENT.nombre} {MOCK_PATIENT.apellido}
              </h1>
              <p className="text-gray-400 text-xs">{edad} años · {MOCK_PATIENT.medico}</p>
            </div>
          </div>

          {/* Avatar + quick stats */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: brand }}
            >
              {MOCK_PATIENT.nombre[0]}{MOCK_PATIENT.apellido[0]}
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Sesiones',  value: MOCK_SESIONES.length },
                { label: 'Análisis',  value: MOCK_ANALISIS.length },
                { label: 'Tipo piel', value: MOCK_PATIENT.tipo_piel },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-gray-900 font-bold text-base">{s.value}</p>
                  <p className="text-gray-400 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-gray-100 flex">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className="flex-1 py-3 text-xs font-semibold border-b-2 transition-colors"
              style={tab === i
                ? { borderBottomColor: brand, color: brand }
                : { borderBottomColor: 'transparent', color: '#9ca3af' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-3">

          {/* ── Tab 0: Info ── */}
          {tab === 0 && (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <p className="text-gray-900 font-semibold text-sm">Datos de contacto</p>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">{MOCK_PATIENT.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">{MOCK_PATIENT.telefono}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-gray-900 font-semibold text-sm">Ficha clínica</p>
                {[
                  { label: 'Tipo de piel',   value: MOCK_PATIENT.tipo_piel     },
                  { label: 'Alergias',       value: MOCK_PATIENT.alergias      },
                  { label: 'Médico asig.',   value: MOCK_PATIENT.medico        },
                  { label: 'Paciente desde', value: MOCK_PATIENT.creado_en     },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{label}</span>
                    <span className="text-gray-900 text-xs font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Tab 1: Sesiones ── */}
          {tab === 1 && (
            <div className="space-y-2">
              {MOCK_SESIONES.map(s => (
                <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-gray-900 text-sm font-semibold">{s.tratamiento}</p>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{s.fecha}</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{s.medico}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{s.nota}</p>
                </div>
              ))}
              <button
                className="w-full bg-white border border-dashed border-gray-200 text-xs font-medium text-gray-400 py-3 rounded-2xl"
              >
                + Nueva sesión
              </button>
            </div>
          )}

          {/* ── Tab 2: Análisis ── */}
          {tab === 2 && (
            <FeatureGate feature="dermoscopia_ia">
              <div className="space-y-2">
                {MOCK_ANALISIS.map(a => {
                  const rs = RIESGO_STYLE[a.nivel]
                  return (
                    <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-xs">{a.fecha}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: rs.bg, color: rs.text }}
                        >
                          Riesgo {a.nivel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-gray-900 text-2xl font-bold">{a.puntuacion}</p>
                          <p className="text-gray-400 text-[10px]">/ 9 pts</p>
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(a.puntuacion / 9) * 100}%`, backgroundColor: rs.text }}
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 text-sm font-semibold">{a.criterios_pos}</p>
                          <p className="text-gray-400 text-[10px]">criterios +</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => navigate(`/clinica/${slug}/analisis`)}
                  className="w-full text-xs font-semibold py-3 rounded-2xl border border-dashed border-gray-200 text-gray-400"
                >
                  + Nuevo análisis dermoscópico
                </button>
              </div>
            </FeatureGate>
          )}
        </div>
      </div>
    </ClinicLayout>
  )
}
