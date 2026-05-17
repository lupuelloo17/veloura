import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Stethoscope, User, Microscope, FlaskConical, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const DEMO_VIEWS = [
  {
    id: 'admin',
    icon: ShieldCheck,
    label: 'Ver como Admin',
    desc: 'Panel completo — métricas, equipo médico, alertas y configuración de clínica',
    role: 'admin',
    color: '#2D2D2D',
    action: 'clinic',
  },
  {
    id: 'medico',
    icon: Stethoscope,
    label: 'Ver como Médico',
    desc: 'Vista de Dra. García — sus pacientes, citas del día y análisis propios',
    role: 'medico',
    color: '#C8A882',
    action: 'clinic',
  },
  {
    id: 'paciente',
    icon: User,
    label: 'Ver como Paciente',
    desc: 'App para pacientes — inicio, análisis facial, reservas e historial',
    role: null,
    color: '#E8A0B0',
    action: 'patient',
  },
  {
    id: 'dermoscopia',
    icon: Microscope,
    label: 'Ver Análisis Dermoscópico',
    desc: 'Seven-Point Checklist con protocolo cosmecéutico y generación de informe',
    role: null,
    color: '#1B3A6B',
    action: 'dermoscopia',
  },
]

export default function DemoPage() {
  const navigate       = useNavigate()
  const { loginAsDemo } = useAuth()

  function handleView(view) {
    if (view.action === 'clinic') {
      const user = loginAsDemo(view.role)
      navigate(`/clinica/${user.clinica_slug}/dashboard`)
    } else if (view.action === 'patient') {
      navigate('/home')
    } else if (view.action === 'dermoscopia') {
      navigate('/dermoscopia')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-[780px] animate-fade-in">
      {/* Demo banner */}
      <div className="flex items-center gap-2 bg-amber-400 px-5 py-2.5">
        <FlaskConical size={14} className="text-amber-900 flex-shrink-0" />
        <p className="text-amber-900 text-xs font-semibold">
          Modo demo — los datos son ficticios
        </p>
      </div>

      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-5 border-b border-gray-100">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <FlaskConical size={22} className="text-gray-500" />
        </div>
        <h1 className="text-gray-900 font-bold text-xl leading-tight">Demo interactiva</h1>
        <p className="text-gray-400 text-sm mt-1 leading-relaxed">
          Explora Veloura desde el rol que quieras. Sin registro, sin contraseña.
        </p>
      </div>

      {/* View buttons */}
      <div className="flex-1 bg-gray-50 px-5 py-5 space-y-3">
        {DEMO_VIEWS.map(view => {
          const Icon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => handleView(view)}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
            >
              {/* Icon badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: view.color }}
              >
                <Icon size={20} className="text-white" strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-semibold">{view.label}</p>
                <p className="text-gray-400 text-xs leading-snug mt-0.5">{view.desc}</p>
              </div>

              <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="bg-white px-6 py-5 border-t border-gray-100">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          Veloura · Prototipo v0.1 · Datos 100% ficticios
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full mt-3 text-gray-500 text-xs font-medium py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Ir al login real →
        </button>
      </div>
    </div>
  )
}
