import { useState } from 'react'
import { useAuth }    from '../../contexts/AuthContext'
import { useClinic }  from '../../contexts/ClinicContext'
import { useRoutine } from '../../hooks/useRoutine'
import RoutineStepItem from '../../components/routines/RoutineStepItem'

function getInitials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function MiRutinaPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()
  const { rutinas, loading, error } = useRoutine(user?.email, clinica?.id)

  const [tabActiva, setTabActiva] = useState('manana')
  const [rutinaIdx, setRutinaIdx] = useState(0)

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--vl-cream)', minHeight: '100vh' }}>
        <div className="vl-skeleton" style={{ height: '120px' }} />
        <div className="vl-skeleton" style={{ height: '60px' }} />
        <div className="vl-skeleton" style={{ height: '60px' }} />
        <div className="vl-skeleton" style={{ height: '60px' }} />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '16px', background: 'var(--vl-cream)', minHeight: '100vh' }}>
        <div className="vl-warning-box">
          <i className="ti ti-alert-triangle" style={{ color: 'var(--vl-brand)', fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--vl-carbon-mid)' }}>{error}</p>
        </div>
      </div>
    )
  }

  // ── Sin rutina ───────────────────────────────────────────────
  if (rutinas.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        background: 'var(--vl-cream)', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', gap: '12px',
      }}>
        <i className="ti ti-clipboard-list" style={{ fontSize: '48px', color: 'var(--vl-brand-light)' }} />
        <h3 className="vl-h3" style={{ margin: 0, color: 'var(--vl-carbon)', textAlign: 'center' }}>
          Sin rutina asignada
        </h3>
        <p style={{ margin: 0, color: 'var(--vl-carbon-soft)', fontSize: '13px', textAlign: 'center' }}>
          Tu especialista aún no ha recetado una rutina para ti
        </p>
        <button className="vl-btn-primary">Contactar clínica</button>
      </div>
    )
  }

  const rutina = rutinas[rutinaIdx] || rutinas[0]
  const pasos  = tabActiva === 'manana' ? rutina.pasos_manana : rutina.pasos_noche

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--vl-cream)' }}>

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '28px 20px 0', position: 'relative' }}>

        {/* Badge */}
        <span className="vl-badge">
          <i className="ti ti-clipboard-list" />
          Rutina personalizada
        </span>

        {/* Título */}
        <h1 className="vl-h1" style={{ color: 'var(--vl-white)', margin: '8px 0 4px' }}>
          Mi Rutina Recetada
        </h1>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
          Protocolo diseñado para tu piel
        </p>

        {/* Select si hay más de una rutina */}
        {rutinas.length > 1 && (
          <select
            value={rutinaIdx}
            onChange={e => setRutinaIdx(Number(e.target.value))}
            className="vl-input"
            style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--vl-white)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            {rutinas.map((r, i) => (
              <option key={r.id} value={i}>{r.nombre}</option>
            ))}
          </select>
        )}

        {/* Doctor chip */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '40px',
          padding: '6px 14px 6px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '16px',
          marginBottom: '0',
          width: 'fit-content',
        }}>
          {rutina.medico?.foto ? (
            <img
              src={rutina.medico.foto}
              alt={rutina.medico.nombre}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="vl-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {getInitials(rutina.medico?.nombre)}
            </div>
          )}
          <div>
            <p style={{ margin: 0, color: 'var(--vl-white)', fontSize: '13px', fontWeight: 500 }}>
              {rutina.medico?.nombre || 'Especialista'}
            </p>
            {rutina.medico?.especialidad && (
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                {rutina.medico.especialidad}
              </p>
            )}
          </div>
          <p style={{ margin: '0 0 0 auto', color: 'rgba(255,255,255,0.3)', fontSize: '11px', flexShrink: 0 }}>
            {formatDate(rutina.asignado_en)}
          </p>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '12px 16px 16px' }}>
        <div style={{
          background: 'var(--vl-white)',
          borderRadius: '12px',
          padding: '4px',
          display: 'flex',
          gap: '0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {[
            { key: 'manana', icon: 'ti-sun',  label: 'Mañana', count: rutina.pasos_manana.length },
            { key: 'noche',  icon: 'ti-moon', label: 'Noche',  count: rutina.pasos_noche.length  },
          ].map(tab => {
            const activa = tabActiva === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setTabActiva(tab.key)}
                style={{
                  flex: 1,
                  background: activa ? 'var(--vl-carbon)' : 'transparent',
                  color: activa ? 'var(--vl-brand)' : 'rgba(45,42,38,0.4)',
                  borderRadius: '9px',
                  padding: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: activa ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'var(--vl-transition)',
                }}
              >
                <i className={`ti ${tab.icon}`} />
                {tab.label}
                <span className="vl-badge" style={{
                  fontSize: '10px',
                  padding: '1px 7px',
                  background: activa ? 'var(--vl-brand-alpha)' : 'rgba(45,42,38,0.06)',
                  color: activa ? 'var(--vl-brand)' : 'var(--vl-carbon-soft)',
                  borderColor: activa ? 'var(--vl-brand-alpha-border)' : 'transparent',
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-cream)', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Descripción */}
        {rutina.descripcion && (
          <div className="vl-card" style={{ borderLeft: '2px solid var(--vl-brand)', borderRadius: '0 12px 12px 0' }}>
            <p style={{ margin: 0, color: 'var(--vl-carbon-soft)', fontSize: '13px', lineHeight: 1.6 }}>
              {rutina.descripcion}
            </p>
          </div>
        )}

        {/* Label sección */}
        <p style={{
          margin: 0,
          textTransform: 'uppercase',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: 'var(--vl-carbon-soft)',
        }}>
          Pasos de la rutina
        </p>

        {/* Lista de pasos */}
        {pasos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pasos.map((paso, i) => (
              <RoutineStepItem key={paso.id} paso={paso} index={i} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--vl-carbon-soft)', fontSize: '14px', textAlign: 'center', padding: '20px 0', margin: 0 }}>
            No hay pasos para la {tabActiva === 'manana' ? 'mañana' : 'noche'}
          </p>
        )}

        {/* Disclaimer */}
        <div className="vl-warning-box">
          <i className="ti ti-info-circle" style={{ color: 'var(--vl-brand)', fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, color: 'var(--vl-carbon-soft)', fontSize: '12px', lineHeight: 1.6 }}>
            Consulta con tu doctora antes de modificar esta rutina o agregar nuevos productos.
            Cada piel es única y los cambios pueden afectar los resultados de tu tratamiento.
          </p>
        </div>

      </div>
    </div>
  )
}
