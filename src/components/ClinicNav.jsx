import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useClinic } from '../contexts/ClinicContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const ICON_MAP = {
  dashboard:      'ti-layout-dashboard',
  pacientes:      'ti-users',
  analisis:       'ti-microscope',
  agenda:         'ti-calendar',
  configuracion:  'ti-settings',
  inicio:         'ti-home',
  evolucion:      'ti-photo',
  rutina:         'ti-clipboard-list',
  chat:           'ti-message-circle',
  datos:          'ti-user',
}

export default function ClinicNav() {
  const navigate           = useNavigate()
  const { pathname, hash } = useLocation()
  const { slug }           = useParams()
  const { clinica }        = useClinic()
  const { user }           = useAuth()

  const isAdmin    = user?.rol === 'admin'
  const isMedico   = user?.rol === 'medico'
  const isPaciente = user?.rol === 'paciente'

  // Badge de mensajes no leídos
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!supabase || !user?.id) return
    let cancelled = false

    async function fetchUnread() {
      if (isPaciente) {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('destinatario_id', user.id)
          .eq('leido', false)
          .neq('remitente_id', user.id)
        if (!cancelled) setUnread(count ?? 0)
      } else if (isMedico) {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('destinatario_usuario_id', user.id)
          .eq('leido', false)
        if (!cancelled) setUnread(count ?? 0)
      } else {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('clinica_id', user.clinica_id)
          .eq('leido', false)
        if (!cancelled) setUnread(count ?? 0)
      }
    }

    fetchUnread()
    const ch = supabase
      .channel(`nav-unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, fetchUnread)
      .subscribe()
    return () => { cancelled = true; ch.unsubscribe() }
  }, [user?.id, isPaciente, user?.clinica_id])

  const TABS = isPaciente
    ? [
        { label: 'Inicio',    icon: 'inicio',        path: `/clinica/${slug}/mi-perfil` },
        { label: 'Evolución', icon: 'evolucion',     path: `/clinica/${slug}/mi-perfil/evolucion` },
        { label: 'Rutina',    icon: 'rutina',        path: `/clinica/${slug}/mi-perfil/rutina` },
        { label: 'Chat',      icon: 'chat',          path: `/clinica/${slug}/mi-perfil/chat`, badge: unread },
        { label: 'Datos',     icon: 'datos',         path: `/clinica/${slug}/mi-perfil/datos` },
      ]
    : isMedico
    ? [
        { label: 'Dashboard', icon: 'dashboard',     path: `/clinica/${slug}/dashboard` },
        { label: 'Pacientes', icon: 'pacientes',     path: `/clinica/${slug}/pacientes` },
        { label: 'Análisis',  icon: 'analisis',      path: `/clinica/${slug}/analisis`  },
        { label: 'Agenda',    icon: 'agenda',        path: `/clinica/${slug}/agenda`    },
        { label: 'Chat',      icon: 'chat',          path: `/clinica/${slug}/conversaciones`, badge: unread },
      ]
    : isAdmin
    ? [
        { label: 'Dashboard', icon: 'dashboard',     path: `/clinica/${slug}/dashboard` },
        { label: 'Pacientes', icon: 'pacientes',     path: `/clinica/${slug}/pacientes` },
        { label: 'Análisis',  icon: 'analisis',      path: `/clinica/${slug}/analisis`  },
        { label: 'Chat',      icon: 'chat',          path: `/clinica/${slug}/conversaciones`, badge: unread },
        { label: 'Config',    icon: 'configuracion', path: `/clinica/${slug}/configuracion` },
      ]
    : [
        { label: 'Dashboard', icon: 'dashboard',     path: `/clinica/${slug}/dashboard` },
        { label: 'Pacientes', icon: 'pacientes',     path: `/clinica/${slug}/pacientes` },
        { label: 'Análisis',  icon: 'analisis',      path: `/clinica/${slug}/analisis`  },
        { label: 'Agenda',    icon: 'agenda',        path: `/clinica/${slug}/agenda`    },
        { label: 'Chat',      icon: 'chat',          path: `/clinica/${slug}/conversaciones`, badge: unread },
      ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#FFFFFF',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(22,19,19,0.06)',
      padding: '6px 0 env(safe-area-inset-bottom, 10px)',
      display: 'flex',
    }}>
      {TABS.map(({ label, icon, path, hash: tabHash, badge }) => {
        const active = tabHash
          ? (pathname === path && hash === tabHash)
          : pathname.startsWith(path)
        const isInicio = path === `/clinica/${slug}/mi-perfil` && !tabHash
        const activeFixed = isInicio
          ? (pathname === path && !hash)
          : active

        return (
          <button
            key={`${path}${tabHash ?? ''}`}
            onClick={() => navigate(path + (tabHash ?? ''))}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '56px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              transition: 'all 0.18s',
              padding: 0,
              position: 'relative',
            }}
          >
            {/* Icono con badge */}
            <div style={{ position: 'relative' }}>
              <i
                className={`ti ${ICON_MAP[icon]}`}
                style={{
                  fontSize: '22px',
                  color: activeFixed ? '#161313' : 'rgba(22,19,19,0.28)',
                  display: 'block',
                  lineHeight: 1,
                }}
              />
              {badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: '-4px',
                  minWidth: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#161313',
                  color: '#C9D3CA',
                  fontSize: '8px',
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                  lineHeight: 1,
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span style={{
              fontFamily: "'DM Sans', system-ui",
              fontSize: '9px',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeFixed ? '#161313' : 'rgba(22,19,19,0.28)',
            }}>
              {label}
            </span>

            {/* Punto activo */}
            {activeFixed && (
              <div style={{
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: '#929C92',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
