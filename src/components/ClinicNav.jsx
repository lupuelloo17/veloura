import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, Microscope, CalendarDays } from 'lucide-react'
import { useClinic } from '../contexts/ClinicContext'

export default function ClinicNav() {
  const navigate    = useNavigate()
  const { pathname } = useLocation()
  const { slug }    = useParams()
  const { clinica } = useClinic()

  const TABS = [
    { label: 'Dashboard',  icon: LayoutDashboard, path: `/clinica/${slug}/dashboard` },
    { label: 'Pacientes',  icon: Users,            path: `/clinica/${slug}/pacientes` },
    { label: 'Análisis',   icon: Microscope,       path: `/clinica/${slug}/analisis`  },
    { label: 'Citas',      icon: CalendarDays,     path: `/clinica/${slug}/citas`     },
  ]

  const brand = clinica?.color_primario ?? '#E8A0B0'

  return (
    <nav className="border-t border-gray-100 bg-white px-1 py-2 flex items-center justify-around">
      {TABS.map(({ label, icon: Icon, path }) => {
        const active = pathname.startsWith(path)
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
          >
            <Icon
              size={20}
              style={active ? { color: brand } : {}}
              className={active ? '' : 'text-gray-300'}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span
              className="text-[10px] font-medium"
              style={active ? { color: brand } : { color: '#9ca3af' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
