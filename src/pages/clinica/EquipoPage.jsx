import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import StaffLayout from './StaffLayout'
import HorarioDrawer from '../../components/HorarioDrawer'

/* ─── UUID guard ─────────────────────────────────────────────────────────── */
const isValidUUID = id =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')

/* ─── Role config ────────────────────────────────────────────────────────── */
const ROL_CONFIG = {
  admin:     { label: 'Admin',      color: '#161313', bg: 'rgba(22,19,19,0.08)',     border: 'rgba(22,19,19,0.15)'     },
  medico:    { label: 'Médico',     color: '#3d6b4f', bg: 'rgba(61,107,79,0.10)',    border: 'rgba(61,107,79,0.20)'    },
  recepcion: { label: 'Recepción',  color: '#7a5c3e', bg: 'rgba(163,147,132,0.12)', border: 'rgba(163,147,132,0.25)'  },
}

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const MOCK_EQUIPO = [
  {
    id: 'mock-admin',
    nombre: 'Admin Lumière',
    rol: 'admin',
    email: 'admin@lumiere.com',
    foto: null,
    activo: true,
    especialidad: 'Administración',
  },
  {
    id: 'mock-garcia',
    nombre: 'Dra. María García',
    rol: 'medico',
    email: 'dra.garcia@lumiere.com',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face',
    activo: true,
    especialidad: 'Medicina Estética',
  },
  {
    id: 'mock-ruiz',
    nombre: 'Dr. Carlos Ruiz',
    rol: 'medico',
    email: 'dr.ruiz@lumiere.com',
    foto: null,
    activo: true,
    especialidad: 'Dermatología',
  },
  {
    id: 'mock-recep',
    nombre: 'Lucía Fernández',
    rol: 'recepcion',
    email: 'lucia@lumiere.com',
    foto: null,
    activo: true,
    especialidad: 'Recepción y atención al paciente',
  },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const AVATAR_PALETTE = [
  '#A39384', '#929C92', '#7a8c9a', '#8a7a9c', '#9c8a7a',
]
function avatarColor(id = '') {
  const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}

/* ─── Subcomponents ──────────────────────────────────────────────────────── */
function AvatarCircle({ empleado, size = 48 }) {
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = empleado.foto && !imgErr

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: showPhoto ? 'transparent' : avatarColor(empleado.id),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        color: '#fff',
        border: '2px solid rgba(255,255,255,0.8)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
      }}
    >
      {showPhoto ? (
        <img
          src={empleado.foto}
          alt={empleado.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgErr(true)}
        />
      ) : (
        getInitials(empleado.nombre)
      )}
    </div>
  )
}

function RolBadge({ rol }) {
  const cfg = ROL_CONFIG[rol] ?? ROL_CONFIG.recepcion
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 20,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: 11,
        fontFamily: 'DM Mono, monospace',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(22,19,19,0.08)',
        borderRadius: 14,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flex: '1 1 140px',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: accent ?? 'rgba(22,19,19,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <i className={icon} style={{ color: '#161313' }} />
      </div>
      <div>
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#161313',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: '#929C92',
            marginTop: 3,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

function EmpleadoCard({ empleado, onHorario, onToggleActivo, isMock }) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    if (isMock) {
      onToggleActivo(empleado.id, !empleado.activo)
      return
    }
    setToggling(true)
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: !empleado.activo })
      .eq('id', empleado.id)
    if (!error) onToggleActivo(empleado.id, !empleado.activo)
    setToggling(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      style={{
        background: '#fff',
        border: '1px solid rgba(22,19,19,0.08)',
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'box-shadow 0.18s',
        opacity: empleado.activo ? 1 : 0.6,
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(22,19,19,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Avatar */}
      <AvatarCircle empleado={empleado} size={50} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              color: '#161313',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {empleado.nombre}
          </span>
          <RolBadge rol={empleado.rol} />
        </div>
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: '#929C92',
            marginTop: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {empleado.email}
        </div>
        {empleado.especialidad && (
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              color: '#A39384',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {empleado.especialidad}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Activo toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={empleado.activo ? 'Desactivar empleado' : 'Activar empleado'}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid rgba(22,19,19,0.10)',
            background: empleado.activo ? 'rgba(61,107,79,0.08)' : 'rgba(22,19,19,0.04)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s',
          }}
        >
          <i
            className={empleado.activo ? 'ti ti-eye' : 'ti ti-eye-off'}
            style={{ fontSize: 15, color: empleado.activo ? '#3d6b4f' : '#929C92' }}
          />
        </button>

        {/* Horario button */}
        <button
          onClick={() => onHorario(empleado)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid rgba(22,19,19,0.14)',
            background: '#F7F5F2',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: '#161313',
            transition: 'all 0.18s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#161313'
            e.currentTarget.style.color = '#F7F5F2'
            e.currentTarget.style.borderColor = '#161313'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#F7F5F2'
            e.currentTarget.style.color = '#161313'
            e.currentTarget.style.borderColor = 'rgba(22,19,19,0.14)'
          }}
        >
          <i className="ti ti-calendar-time" style={{ fontSize: 14 }} />
          Horario
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function EquipoPage() {
  const { clinica } = useClinic()
  const { user } = useAuth()

  const [equipo, setEquipo]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [drawerEmpleado, setDrawerEmpleado] = useState(null) // empleado selected for horario drawer
  const [filterRol, setFilterRol] = useState('todos')
  const [filterActivo, setFilterActivo] = useState('activos')

  const isMock = !isValidUUID(clinica?.id)

  /* ── Load team ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!clinica?.id) return

    async function loadEquipo() {
      setLoading(true)
      setError(null)

      if (isMock) {
        await new Promise(r => setTimeout(r, 350))
        setEquipo(MOCK_EQUIPO)
        setLoading(false)
        return
      }

      const { data, error: dbErr } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, foto, activo, especialidad')
        .eq('clinica_id', clinica.id)
        .in('rol', ['admin', 'medico', 'recepcion'])
        .order('rol')
        .order('nombre')

      if (dbErr) {
        console.error('[EquipoPage] loadEquipo error:', dbErr)
        setError('No se pudo cargar el equipo. Por favor, intenta de nuevo.')
        setEquipo([])
      } else {
        setEquipo(data ?? [])
      }
      setLoading(false)
    }

    loadEquipo()
  }, [clinica?.id, isMock])

  /* ── Toggle activo ─────────────────────────────────────────────────────── */
  function handleToggleActivo(id, nuevoActivo) {
    setEquipo(prev =>
      prev.map(e => (e.id === id ? { ...e, activo: nuevoActivo } : e))
    )
  }

  /* ── Filtered list ─────────────────────────────────────────────────────── */
  const filtered = equipo.filter(e => {
    const rolOk    = filterRol    === 'todos'   || e.rol === filterRol
    const activoOk = filterActivo === 'todos'   || (filterActivo === 'activos' ? e.activo : !e.activo)
    return rolOk && activoOk
  })

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const stats = {
    total:     equipo.length,
    medicos:   equipo.filter(e => e.rol === 'medico').length,
    recepcion: equipo.filter(e => e.rol === 'recepcion').length,
    activos:   equipo.filter(e => e.activo).length,
  }

  /* ── Styles ─────────────────────────────────────────────────────────────── */
  const chipBase = {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid rgba(22,19,19,0.12)',
    background: 'transparent',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#929C92',
  }
  const chipActive = {
    ...chipBase,
    background: '#161313',
    color: '#F7F5F2',
    borderColor: '#161313',
  }

  return (
    <StaffLayout>
      <div
        style={{
          padding: '32px 36px',
          maxWidth: 900,
          margin: '0 auto',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 28,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 30,
                fontWeight: 700,
                color: '#161313',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Equipo
            </h1>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: '#929C92',
                margin: '6px 0 0',
              }}
            >
              Gestiona el personal de {clinica?.nombre ?? 'tu clínica'} y sus horarios de atención.
            </p>
          </div>

          {isMock && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(163,147,132,0.12)',
                border: '1px solid rgba(163,147,132,0.25)',
                fontSize: 12,
                color: '#A39384',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              <i className="ti ti-flask" style={{ fontSize: 13 }} />
              MODO DEMO
            </div>
          )}
        </div>

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <StatCard icon="ti ti-users" label="Total empleados" value={stats.total} />
            <StatCard icon="ti ti-stethoscope" label="Médicos" value={stats.medicos} accent="rgba(61,107,79,0.08)" />
            <StatCard icon="ti ti-headset" label="Recepción" value={stats.recepcion} accent="rgba(163,147,132,0.12)" />
            <StatCard icon="ti ti-circle-check" label="Activos" value={stats.activos} accent="rgba(22,19,19,0.05)" />
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        {!loading && !error && equipo.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: '#929C92', marginRight: 4 }}>Rol:</span>
            {['todos', 'admin', 'medico', 'recepcion'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRol(r)}
                style={filterRol === r ? chipActive : chipBase}
              >
                {r === 'todos' ? 'Todos' : ROL_CONFIG[r]?.label ?? r}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'rgba(22,19,19,0.1)', margin: '0 6px' }} />
            <span style={{ fontSize: 12, color: '#929C92', marginRight: 4 }}>Estado:</span>
            {[
              { k: 'activos', label: 'Activos' },
              { k: 'inactivos', label: 'Inactivos' },
              { k: 'todos', label: 'Todos' },
            ].map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setFilterActivo(k)}
                style={filterActivo === k ? chipActive : chipBase}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              gap: 12,
              color: '#929C92',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '2.5px solid rgba(22,19,19,0.12)',
                borderTopColor: '#161313',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
              Cargando equipo…
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              background: 'rgba(220,53,69,0.06)',
              border: '1px solid rgba(220,53,69,0.2)',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#b91c1c',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
            }}
          >
            <i className="ti ti-alert-circle" style={{ fontSize: 20 }} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#929C92',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                }}
              >
                <i className="ti ti-users-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
                No se encontraron empleados con los filtros seleccionados.
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(emp => (
                  <EmpleadoCard
                    key={emp.id}
                    empleado={emp}
                    onHorario={setDrawerEmpleado}
                    onToggleActivo={handleToggleActivo}
                    isMock={isMock}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── Footer note ────────────────────────────────────────────────── */}
        {!loading && !error && (
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              color: '#929C92',
              marginTop: 28,
              textAlign: 'center',
            }}
          >
            Para invitar nuevos empleados, ve a{' '}
            <a
              href="#"
              onClick={e => { e.preventDefault(); window.history.pushState(null, '', window.location.pathname.replace(/equipo$/, 'configuracion')) ; window.dispatchEvent(new PopStateEvent('popstate')) }}
              style={{ color: '#161313', textDecoration: 'underline' }}
            >
              Configuración → Equipo
            </a>
            .
          </p>
        )}
      </div>

      {/* ── Horario Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerEmpleado && (
          <HorarioDrawer
            empleado={drawerEmpleado}
            clinicaId={clinica?.id}
            onClose={() => setDrawerEmpleado(null)}
          />
        )}
      </AnimatePresence>
    </StaffLayout>
  )
}
