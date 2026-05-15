import { useNavigate, useParams } from 'react-router-dom'
import {
  Users, CalendarDays, TrendingUp, Microscope,
  ChevronRight, AlertCircle, ShieldCheck, LogOut,
  Building2, CreditCard,
} from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'
import { formatCOP } from '../../config/planes'

const STATS = [
  { label: 'Pacientes',     value: 148,  sub: 'de 300 máx.',    icon: Users        },
  { label: 'Sesiones/mes',  value: 34,   sub: 'últimos 30 días', icon: CalendarDays },
  { label: 'Análisis IA',   value: 27,   sub: 'dermoscópicos',   icon: Microscope   },
  { label: 'Ing. estimado', value: '~$8.4M', sub: 'COP este mes', icon: TrendingUp },
]

const DOCTORS = [
  { nombre: 'Dra. García',      especialidad: 'Medicina Estética', pacientes: 48, sesiones_mes: 20, activo: true,  foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face' },
  { nombre: 'Dr. Ruiz',         especialidad: 'Dermatología',       pacientes: 31, sesiones_mes: 9,  activo: true,  foto: null },
  { nombre: 'Dra. Montoya',     especialidad: 'Medicina Estética',  pacientes: 12, sesiones_mes: 5,  activo: false, foto: null },
]

const ALERTS = [
  { tipo: 'abandono',   texto: '5 pacientes sin actividad en +60 días', color: '#d97706' },
  { tipo: 'renovacion', texto: 'Plan Premium · Renueva en 11 meses',    color: '#2563eb' },
  { tipo: 'capacidad',  texto: 'Capacidad al 49% (148/300 pacientes)',  color: '#16a34a' },
]

export default function AdminDashboardPage() {
  const navigate   = useNavigate()
  const { slug }   = useParams()
  const { clinica, plan } = useClinic()
  const { user, logout }  = useAuth()
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
        <div className="bg-white px-5 pt-7 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: brand }}
              >
                {clinica?.nombre?.[0] ?? 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-gray-900 font-bold text-base leading-tight">
                    {clinica?.nombre}
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                    <ShieldCheck size={9} /> ADMIN
                  </span>
                </div>
                <p className="text-gray-400 text-xs capitalize">{today}</p>
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

          {/* Plan pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: brand + '18', color: brand }}
          >
            <CreditCard size={11} />
            {plan?.nombre} · {formatCOP(plan?.precio_cop ?? 0)} / mes
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {STATS.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
                <Icon size={15} className="text-gray-400 mb-2" />
                <p className="text-gray-900 text-2xl font-bold">{value}</p>
                <p className="text-gray-700 text-xs font-medium leading-snug">{label}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {ALERTS.map(a => (
              <div
                key={a.tipo}
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border-l-4"
                style={{ borderLeftColor: a.color }}
              >
                <AlertCircle size={15} style={{ color: a.color }} className="flex-shrink-0" />
                <p className="text-gray-700 text-xs">{a.texto}</p>
              </div>
            ))}
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-900 font-semibold text-sm">Equipo médico</p>
              <span className="text-gray-400 text-xs">{DOCTORS.filter(d => d.activo).length} activos</span>
            </div>
            <div className="space-y-3">
              {DOCTORS.map(d => (
                <div key={d.nombre} className="flex items-center gap-3">
                  {d.foto
                    ? <img src={d.foto} alt={d.nombre} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                    : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: d.activo ? brand : '#d1d5db' }}
                      >
                        {d.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${d.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {d.nombre}
                    </p>
                    <p className="text-gray-400 text-xs">{d.especialidad}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-900 text-sm font-bold">{d.pacientes}</p>
                    <p className="text-gray-400 text-[10px]">pacientes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dermoscopy (feature-gated) */}
          <FeatureGate feature="dermoscopia_ia">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-900 font-semibold text-sm">Análisis dermoscópicos</p>
                <button
                  onClick={() => navigate(`/clinica/${slug}/analisis`)}
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: brand }}
                >
                  Ver todos <ChevronRight size={12} />
                </button>
              </div>
              {[
                { nivel: 'alto',     n: 3,  color: '#dc2626' },
                { nivel: 'moderado', n: 9,  color: '#d97706' },
                { nivel: 'bajo',     n: 15, color: '#16a34a' },
              ].map(r => (
                <div key={r.nivel} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span
                    className="text-[10px] font-bold capitalize w-16 text-right"
                    style={{ color: r.color }}
                  >{r.nivel}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.n / 27) * 100}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-gray-600 text-xs font-semibold w-5 text-right">{r.n}</span>
                </div>
              ))}
            </div>
          </FeatureGate>

          {/* Clinic info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-900 font-semibold text-sm mb-2 flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> Configuración
            </p>
            {[
              { label: 'Sede',     value: `${clinica?.ciudad ?? '—'}, ${clinica?.pais ?? '—'}` },
              { label: 'Slug',     value: clinica?.slug ?? '—' },
              { label: 'Color',    value: clinica?.color_primario ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="text-gray-800 text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClinicLayout>
  )
}
