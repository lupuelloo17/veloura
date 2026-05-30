import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import VelouraLogo from '../../components/brand/VelouraLogo'

const ADMIN_RECEPCION_NAV = [
  { label: 'Dashboard',     icon: 'ti-layout-dashboard', path: 'dashboard'      },
  { label: 'Pacientes',     icon: 'ti-users',             path: 'pacientes'      },
  { label: 'Agenda',        icon: 'ti-calendar',          path: 'agenda'         },
  { label: 'Análisis',      icon: 'ti-microscope',        path: 'analisis'       },
  { label: 'Mensajes',      icon: 'ti-message',           path: 'conversaciones' },
  { label: 'Equipo',        icon: 'ti-id-badge',          path: 'equipo'         },
  { label: 'Finanzas',      icon: 'ti-chart-bar',         path: 'finanzas'       },
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
  equipo:         'Equipo',
  finanzas:       'Finanzas',
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

  // ── Sidebar móvil ──────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Cierra el drawer al cambiar de ruta
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const breadcrumb = getBreadcrumb(location.pathname)

  // ── Sidebar content reutilizable (desktop + drawer móvil) ─
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <VelouraLogo variant="wordmark" theme="cream" height="18px" safe />
        {clinica?.nombre && (
          <p style={{ fontSize:'10px', fontWeight:300, letterSpacing:'0.1em',
            textTransform:'uppercase', color:'rgba(247,245,242,0.28)', margin:'6px 0 0' }}>
            {clinica.nombre}
          </p>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
        {navItems.map(item => {
          const href     = `/clinica/${slug}/${item.path}`
          const segments = location.pathname.split('/')
          const isActive = segments[segments.length-1] === item.path
            || segments[segments.length-2] === item.path
          return (
            <Link key={item.path} to={href} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'11px 20px', textDecoration:'none',
              fontSize:'13px', fontWeight:300, letterSpacing:'0.02em',
              transition:'all 0.15s',
              borderLeft:`2px solid ${isActive ? 'var(--color-brand,#929C92)' : 'transparent'}`,
              background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: isActive ? '#C9D3CA' : 'rgba(247,245,242,0.32)',
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize:'16px' }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', gap:'8px' }}>
        <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:'rgba(201,211,202,0.15)', border:'1px solid rgba(201,211,202,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'11px', color:'#929C92' }}>
          {getInitials(user?.nombre)}
        </div>
        <span style={{ fontSize:'12px', fontWeight:300, color:'rgba(247,245,242,0.45)',
          flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {user?.nombre || user?.email}
        </span>
        <button onClick={handleLogout} style={{
          fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase',
          color:'rgba(247,245,242,0.2)', background:'none', border:'none',
          cursor:'pointer', flexShrink:0, fontFamily:"'DM Sans',system-ui",
        }}>
          Salir
        </button>
      </div>
    </>
  )

  return (
    <div style={{
      display:'flex', height:'100vh', overflow:'hidden',
      fontFamily:"'DM Sans',system-ui", background:'#F7F5F2',
    }}>

      {/* ── SIDEBAR DESKTOP (oculto en móvil) ────────────────── */}
      <div style={{
        width:'240px', flexShrink:0,
        background:'#161313',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
      }} className="vl-sidebar-desktop">
        <SidebarContent />
      </div>

      {/* ── DRAWER MÓVIL: overlay + panel deslizante ─────────── */}
      {sidebarOpen && (
        <>
          {/* Overlay oscuro */}
          <div onClick={() => setSidebarOpen(false)} style={{
            position:'fixed', inset:0, zIndex:90,
            background:'rgba(22,19,19,0.55)', backdropFilter:'blur(3px)',
          }} />
          {/* Panel */}
          <div style={{
            position:'fixed', top:0, left:0, bottom:0, width:'260px', zIndex:91,
            background:'#161313', display:'flex', flexDirection:'column',
            animation:'vl-slide-right 0.22s cubic-bezier(0.34,1.2,0.64,1)',
          }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
        minWidth:0 }}>

        {/* ── Top bar (sticky) ─────────────────────────────────── */}
        <div style={{
          position:'sticky', top:0, zIndex:40,
          height:'52px', background:'#FFFFFF',
          borderBottom:'1px solid rgba(22,19,19,0.06)',
          display:'flex', alignItems:'center',
          padding:'0 16px', flexShrink:0, gap:'12px',
        }}>
          {/* Hamburger — solo en móvil */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="vl-hamburger"
            style={{
              display:'none', /* se muestra via CSS en móvil */
              alignItems:'center', justifyContent:'center',
              width:36, height:36, borderRadius:2,
              border:'1px solid rgba(22,19,19,0.1)', background:'transparent',
              cursor:'pointer', flexShrink:0,
            }}
          >
            <i className="ti ti-menu-2" style={{ fontSize:'18px', color:'rgba(22,19,19,0.5)' }} />
          </button>

          <span style={{
            fontSize:'12px', fontWeight:300, letterSpacing:'0.06em',
            textTransform:'uppercase', color:'rgba(22,19,19,0.35)',
          }}>
            {breadcrumb}
          </span>
          <div style={{ flex:1 }} />
          {clinica?.nombre && (
            <span style={{ fontSize:'12px', fontWeight:300, color:'rgba(22,19,19,0.3)' }}>
              {clinica.nombre}
            </span>
          )}
        </div>

        {/* Content — con paddingBottom en móvil para que el bottom nav no tape nada */}
        <div className="vl-staff-content" style={{ flex:1 }}>
          {children}
        </div>
      </div>

      {/* ── BOTTOM NAV MOBILE (staff) ─────────────────────────── */}
      {/* Solo visible en <768px. Muestra los primeros 5 ítems como iconos. */}
      <nav className="vl-staff-bottom-nav" style={{
        display:'none', /* activado via CSS en mobile */
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        height:'60px',
        background:'rgba(22,19,19,0.92)',
        backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        borderTop:'1px solid rgba(255,255,255,0.07)',
        alignItems:'center',
        justifyContent:'space-around',
        paddingBottom:'env(safe-area-inset-bottom, 4px)',
      }}>
        {navItems.slice(0, 5).map(item => {
          const href     = `/clinica/${slug}/${item.path}`
          const segments = location.pathname.split('/')
          const isActive = segments[segments.length-1] === item.path
            || segments[segments.length-2] === item.path
          return (
            <Link key={item.path} to={href} style={{
              display:'flex', flexDirection:'column', alignItems:'center',
              gap:'3px', textDecoration:'none', flex:1, padding:'8px 4px',
            }}>
              <i className={`ti ${item.icon}`} style={{
                fontSize:'20px',
                color: isActive ? 'var(--color-brand,#929C92)' : 'rgba(247,245,242,0.3)',
              }} />
              <span style={{
                fontFamily:"'DM Mono',monospace", fontSize:'8px',
                letterSpacing:'0.08em', textTransform:'uppercase',
                color: isActive ? 'var(--color-brand,#929C92)' : 'rgba(247,245,242,0.25)',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── CSS RESPONSIVO ─────────────────────────────────────── */}
      <style>{`
        @keyframes vl-slide-right {
          from { transform: translateX(-100%) }
          to   { transform: translateX(0) }
        }

        /* ── Móvil (<768px) ── */
        @media (max-width: 767px) {
          .vl-sidebar-desktop   { display: none !important; }
          .vl-hamburger         { display: flex !important; }
          .vl-staff-bottom-nav  { display: flex !important; }
          /* Espacio para que el bottom nav no tape el contenido */
          .vl-staff-content     { padding-bottom: calc(60px + env(safe-area-inset-bottom, 8px)) !important; }
        }

        /* ── Desktop (≥768px) ── */
        @media (min-width: 768px) {
          .vl-hamburger        { display: none !important; }
          .vl-staff-bottom-nav { display: none !important; }
        }

        /* ── Texto responsivo global ── */
        @media (max-width: 767px) {
          /* Reducir padding de páginas internas */
          [data-vl-page] { padding: 16px !important; }
          /* Tablas → bloques apilados */
          .vl-responsive-table thead { display: none; }
          .vl-responsive-table tbody tr {
            display: block;
            background: #FFFFFF;
            border: 1px solid rgba(22,19,19,0.08);
            border-radius: 2px;
            margin-bottom: 8px;
            padding: 12px 16px;
          }
          .vl-responsive-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid rgba(22,19,19,0.05);
            font-size: 13px;
          }
          .vl-responsive-table tbody td:last-child { border-bottom: none; }
          .vl-responsive-table tbody td::before {
            content: attr(data-label);
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(22,19,19,0.3);
            font-family: 'DM Mono', monospace;
          }
        }
      `}</style>
    </div>
  )
}
