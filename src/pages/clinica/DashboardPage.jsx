import { useNavigate, useParams } from 'react-router-dom'
import { Users, CalendarDays, Microscope, TrendingUp, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'
import { formatCOP } from '../../config/planes'

// ── Mock stats ────────────────────────────────────────────────
const MOCK_STATS = {
  pacientes_total: 148,
  sesiones_mes: 34,
  analisis_total: 27,
  alertas_abandono: 5,
}

const MOCK_CITAS = [
  { id: 1, paciente: 'Valentina Morales',   hora: '09:00', tratamiento: 'Peeling Enzimático',        medico: 'Dra. López' },
  { id: 2, paciente: 'Sofía Restrepo',      hora: '10:30', tratamiento: 'Vitamina C + Hialurónico',  medico: 'Dra. López' },
  { id: 3, paciente: 'María Camila Torres', hora: '12:00', tratamiento: 'Dermoscopia + Consulta',    medico: 'Dr. Ruiz'   },
]

const MOCK_RIESGO = [
  { nivel: 'alto',     cantidad: 3,  color: '#dc2626' },
  { nivel: 'moderado', cantidad: 9,  color: '#d97706' },
  { nivel: 'bajo',     cantidad: 15, color: '#16a34a' },
]

export default function DashboardPage() {
  const navigate        = useNavigate()
  const { slug }        = useParams()
  const { clinica, plan, hasFeature } = useClinic()
  const brand           = clinica?.color_primario ?? '#E8A0B0'
  const today           = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const renovacion = clinica?.fecha_renovacion
    ? new Date(clinica.fecha_renovacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* ── Header ── */}
        <div className="bg-white px-5 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              {/* Logo placeholder */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-white text-lg font-bold"
                style={{ backgroundColor: brand }}
              >
                {clinica?.nombre?.[0] ?? 'C'}
              </div>
              <h1 className="text-gray-900 font-bold text-lg leading-tight">{clinica?.nombre}</h1>
              <p className="text-gray-400 text-xs mt-0.5 capitalize">{today}</p>
            </div>
            <div className="text-right">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: brand + '22', color: brand }}
              >
                {plan?.nombre}
              </span>
              <p className="text-gray-400 text-[10px] mt-1">Renueva {renovacion}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">
          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Pacientes activos',   value: MOCK_STATS.pacientes_total, icon: Users,        sub: `de ${plan?.max_pacientes === Infinity ? '∞' : plan?.max_pacientes}` },
              { label: 'Sesiones este mes',   value: MOCK_STATS.sesiones_mes,    icon: CalendarDays, sub: 'últimos 30 días'   },
              { label: 'Análisis realizados', value: MOCK_STATS.analisis_total,  icon: Microscope,   sub: 'dermoscopia IA'    },
              { label: 'Alertas abandono',    value: MOCK_STATS.alertas_abandono,icon: AlertCircle,  sub: 'requieren contacto'},
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
                <Icon size={16} className="text-gray-400 mb-2" />
                <p className="text-gray-900 text-2xl font-bold">{value}</p>
                <p className="text-gray-700 text-xs font-medium leading-snug">{label}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Citas de hoy ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-900 font-semibold text-sm">Citas de hoy</p>
              <button
                onClick={() => navigate(`/clinica/${slug}/citas`)}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: brand }}
              >
                Ver todas <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_CITAS.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: brand }}
                  >
                    {c.hora}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{c.paciente}</p>
                    <p className="text-gray-400 text-xs truncate">{c.tratamiento} · {c.medico}</p>
                  </div>
                  <CheckCircle2 size={16} className="text-gray-200 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Riesgo dermoscópico (feature-gated) ── */}
          <FeatureGate feature="dermoscopia_ia">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-900 font-semibold text-sm">Análisis dermoscópicos</p>
                <button
                  onClick={() => navigate(`/clinica/${slug}/analisis`)}
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: brand }}
                >
                  Ver <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_RIESGO.map(r => (
                  <div key={r.nivel} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold capitalize px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: r.color + '15', color: r.color }}
                    >
                      {r.nivel}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(r.cantidad / 27) * 100}%`, backgroundColor: r.color }}
                      />
                    </div>
                    <span className="text-gray-600 text-xs font-semibold w-4 text-right">{r.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          </FeatureGate>

          {/* ── Alertas abandono (feature-gated) ── */}
          <FeatureGate feature="alertas_abandono">
            <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderLeftColor: '#d97706' }}>
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 font-semibold text-sm">
                    {MOCK_STATS.alertas_abandono} pacientes sin actividad reciente
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                    No han registrado sesión en más de 60 días. Se recomienda contacto de reactivación.
                  </p>
                  <button
                    className="mt-2 text-xs font-semibold"
                    style={{ color: brand }}
                  >
                    Ver pacientes →
                  </button>
                </div>
              </div>
            </div>
          </FeatureGate>

          {/* ── Uso del plan ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-900 font-semibold text-sm mb-3">Uso del plan</p>
            {[
              { label: 'Pacientes',  used: MOCK_STATS.pacientes_total, max: plan?.max_pacientes },
              { label: 'Médicos',   used: 3,                           max: plan?.max_medicos   },
            ].map(({ label, used, max }) => {
              const pct = max === Infinity ? 20 : Math.round((used / max) * 100)
              const isHigh = pct > 80
              return (
                <div key={label} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 text-xs">{label}</span>
                    <span className="text-gray-800 text-xs font-semibold">
                      {used} / {max === Infinity ? '∞' : max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isHigh ? '#dc2626' : brand,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ClinicLayout>
  )
}
