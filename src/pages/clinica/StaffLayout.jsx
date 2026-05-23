import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'

const ADMIN_RECEPCION_NAV = [
  { label: 'Dashboard',     icon: 'ti-layout-dashboard', path: 'dashboard'      },
  { label: 'Pacientes',     icon: 'ti-users',             path: 'pacientes'      },
  { label: 'Agenda',        icon: 'ti-calendar',          path: 'agenda'         },
  { label: 'Análisis',      icon: 'ti-microscope',        path: 'analisis'       },
  { label: 'Mensajes',      icon: 'ti-message',           path: 'conversaciones' },
  { label: 'Configuración', icon: 'ti-settings',          path: 'configuracion'  },
]

const MEDICO_NAV = [
  { label: 'Mi Agenda',  icon: 'ti-calendar',   path: 'dashboard'      },
  { label: 'Pacientes',  icon: 'ti-users',       path: 'pacientes'      },
  { label: 'Análisis',   icon: 'ti-microscope',  path: 'analisis'       },
  { label: 'Mensajes',   icon: 'ti-message',     path: 'conversaciones' },
]

const BREADCRUMB_MAP = {
  dashboard:      'Dashboard',
  pacientes:      'Pacientes',
  agenda:         'Agenda',
  analisis:       'Análisis',
  conversaciones: 'Mensajes',
  configuracion:  'Configuración',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getBreadcrumb(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  return BREADCRUMB_MAP[last] || last
}

export default function StaffLayout({ children }) {
  const navigate        = useNavigate()
  const location        = useLocation()
  const { slug }        = useParams()
  const { user, logout } = useAuth()
  const { clinica }     = useClinic()

  const isMedico = user?.rol === 'medico'
  const navItems = isMedico ? MEDICO_NAV : ADMIN_RECEPCION_NAV

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const breadcrumb = getBreadcrumb(location.pathname)

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui",
      background: '#F7F5F2',
    }}>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <div style={{
        width: '240px', flexShrink: 0,
        background: '#161313',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '18px', fontWeight: 300,
            color: '#F7F5F2', letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Veloura
          </p>
          {clinica?.nombre && (
            <p style={{
              fontSize: '10px', fontWeight: 300,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(247,245,242,0.3)',
              margin: '2px 0 0',
            }}>
              {clinica.nombre}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const href   = `/clinica/${slug}/${item.path}`
            const active = location.pathname.includes(`/${item.path}`)
            return (
              <Link
                key={item.path}
                to={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 20px', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 300,
                  letterSpacing: '0.02em',
                  transition: 'all 0.15s',
                  borderLeft: `2px solid ${active ? '#929C92' : 'transparent'}`,
                  background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: active ? '#C9D3CA' : 'rgba(247,245,242,0.35)',
                }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: '16px' }} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(201,211,202,0.15)',
            border: '1px solid rgba(201,211,202,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#929C92', flexShrink: 0,
          }}>
            {getInitials(user?.nombre)}
          </div>
          <span style={{
            fontSize: '12px', fontWeight: 300,
            color: 'rgba(247,245,242,0.5)',
            flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.nombre || user?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(247,245,242,0.2)', background: 'none',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              fontFamily: "'DM Sans', system-ui",
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          height: '52px', background: '#FFFFFF',
          borderBottom: '1px solid rgba(22,19,19,0.06)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', flexShrink: 0, gap: '12px',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: 300,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'rgba(22,19,19,0.35)',
          }}>
            {breadcrumb}
          </span>
          <div style={{ flex: 1 }} />
          {clinica?.nombre && (
            <span style={{
              fontSize: '12px', fontWeight: 300,
              color: 'rgba(22,19,19,0.35)',
            }}>
              {clinica.nombre}
            </span>
          )}
        </div>

        {/* Content area */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
