import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, CalendarDays, Clock, LogOut, Microscope, CheckCircle2 } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'

const MY_PATIENTS = [
  {
    id: 'p1', nombre: 'Valentina Morales', ultima_sesion: '18 oct 2025',
    sesiones: 6, riesgo: 'moderado',
    foto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 'p2', nombre: 'Sofía Restrepo', ultima_sesion: '5 nov 2025',
    sesiones: 3, riesgo: 'bajo',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  },
]

const TODAY_APPTS = [
  { id: 1, hora: '09:00', paciente: 'Sofía Restrepo',    tratamiento: 'Consulta inicial + Dermoscopia', completada: false },
  { id: 2, hora: '11:00', paciente: 'Valentina Morales', tratamiento: 'Seguimiento Peeling Enzimático',  completada: true  },
]

const RIESGO_STYLE = {
  bajo:     { bg: '#dcfce7', text: '#15803d' },
  moderado: { bg: '#fef9c3', text: '#a16207' },
  alto:     { bg: '#fee2e2', text: '#b91c1c' },
}

export default function MedicoDashboardPage() {
  const navigate  = useNavigate()
  const { slug }  = useParams()
  const { clinica } = useClinic()
  const { user, logout } = useAuth()
  const brand = clinica?.color_primario ?? '#C8A882'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* ── Header ── */}
        <div className="bg-white px-5 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Doctor photo */}
              {user?.foto
                ? <img src={user.foto} alt={user.nombre} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: brand }}
                  >
                    {user?.nombre?.[0] ?? 'D'}
                  </div>
                )
              }
              <div>
                <p className="text-gray-400 text-xs font-medium">{clinica?.nombre}</p>
                <h1 className="text-gray-900 font-bold text-lg leading-tight">
                  {user?.nombre ?? 'Doctora'}
                </h1>
                <p className="text-gray-400 text-xs">{user?.especialidad ?? 'Medicina Estética'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Today date */}
          <p className="text-gray-400 text-xs mt-3 capitalize">{today}</p>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mis pacientes', value: MY_PATIENTS.length },
              { label: 'Citas hoy',     value: TODAY_APPTS.length },
              { label: 'Pendientes',    value: TODAY_APPTS.filter(a => !a.completada).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="text-gray-900 text-2xl font-bold">{value}</p>
                <p className="text-gray-500 text-[10px] leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Today's appointments */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-900 font-semibold text-sm mb-3 flex items-center gap-2">
              <CalendarDays size={14} className="text-gray-400" />
              Mis citas de hoy
            </p>
            <div className="space-y-2">
              {TODAY_APPTS.map(a => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-xl ${
                    a.completada ? 'bg-gray-50 opacity-60' : 'bg-white border border-gray-100'
                  }`}
                >
                  <div
                    className="w-12 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: a.completada ? '#d1d5db' : brand }}
                  >
                    {a.hora}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{a.paciente}</p>
                    <p className="text-gray-400 text-xs truncate">{a.tratamiento}</p>
                  </div>
                  {a.completada
                    ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    : <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: brand }} />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* My patients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-900 font-semibold text-sm">Mis pacientes</p>
              <button
                onClick={() => navigate(`/clinica/${slug}/pacientes`)}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: brand }}
              >
                Ver todos <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {MY_PATIENTS.map(p => {
                const rs = RIESGO_STYLE[p.riesgo]
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/clinica/${slug}/paciente/${p.id}`)}
                    className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm text-left active:scale-95 transition-transform"
                  >
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-semibold truncate">{p.nombre}</p>
                      <p className="text-gray-400 text-xs">{p.sesiones} sesiones · {p.ultima_sesion}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                      style={{ backgroundColor: rs.bg, color: rs.text }}
                    >
                      {p.riesgo}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* New analysis CTA */}
          <FeatureGate feature="dermoscopia_ia">
            <button
              onClick={() => navigate('/dermoscopia')}
              className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-colors active:scale-95"
              style={{ borderColor: brand, color: brand }}
            >
              <Microscope size={16} />
              Iniciar análisis dermoscópico
            </button>
          </FeatureGate>
        </div>
      </div>
    </ClinicLayout>
  )
}
