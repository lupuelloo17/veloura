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
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: '80px', borderRadius: '12px',
            background: 'linear-gradient(90deg, #F0EDE8 25%, #FAF7F3 50%, #F0EDE8 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        ))}
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        margin: '16px', padding: '12px 16px', background: '#FEE2E2',
        border: '1px solid #FECACA', borderRadius: '10px', color: '#991B1B', fontSize: '14px',
      }}>
        {error}
      </div>
    )
  }

  // ── Sin rutina ───────────────────────────────────────────────
  if (rutinas.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px',
      }}>
        <span style={{ fontSize: '48px' }}>🧴</span>
        <p style={{ color: '#6B7280', fontSize: '15px', textAlign: 'center', margin: 0 }}>
          Sin rutina asignada aún
        </p>
      </div>
    )
  }

  const rutina = rutinas[rutinaIdx] || rutinas[0]
  const pasos  = tabActiva === 'manana' ? rutina.pasos_manana : rutina.pasos_noche

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FAFAF9' }}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#2D2A26' }}>
            Mi Rutina
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#C9A46A', fontWeight: '500' }}>
            Recetada por Especialista
          </p>
        </div>

        {/* Select si hay más de una rutina */}
        {rutinas.length > 1 && (
          <select
            value={rutinaIdx}
            onChange={e => setRutinaIdx(Number(e.target.value))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '10px',
              border: '1px solid #E5E0D8', background: '#FFFFFF',
              color: '#2D2A26', fontSize: '14px',
            }}
          >
            {rutinas.map((r, i) => (
              <option key={r.id} value={i}>{r.nombre}</option>
            ))}
          </select>
        )}

        {/* Tarjeta médico */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #F0EDE8',
          borderRadius: '12px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {rutina.medico?.foto ? (
            <img
              src={rutina.medico.foto}
              alt={rutina.medico.nombre}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#FDF8F0', color: '#C9A46A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '15px', flexShrink: 0,
            }}>
              {getInitials(rutina.medico?.nombre)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: '600', color: '#2D2A26', fontSize: '14px' }}>
              {rutina.medico?.nombre || 'Especialista'}
            </p>
            {rutina.medico?.especialidad && (
              <p style={{ margin: '1px 0 0', color: '#6B7280', fontSize: '12px' }}>
                {rutina.medico.especialidad}
              </p>
            )}
          </div>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: '11px', textAlign: 'right', flexShrink: 0 }}>
            {formatDate(rutina.asignado_en)}
          </p>
        </div>

        {/* Descripción */}
        {rutina.descripcion && (
          <div style={{
            background: '#FFFFFF',
            borderLeft: '3px solid #C9A46A',
            borderRadius: '0 10px 10px 0',
            padding: '10px 14px',
          }}>
            <p style={{ margin: 0, color: '#4B4540', fontSize: '13px', lineHeight: '1.5' }}>
              {rutina.descripcion}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'manana', label: '🌅 Mañana', count: rutina.pasos_manana.length },
            { key: 'noche',  label: '🌙 Noche',  count: rutina.pasos_noche.length  },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px', fontWeight: '600', fontSize: '13px',
                background: tabActiva === tab.key ? '#2D2A26' : '#F7F3EE',
                color:      tabActiva === tab.key ? '#C9A46A' : '#9CA3AF',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              <span style={{
                background: tabActiva === tab.key ? '#C9A46A' : '#E5E0D8',
                color:      tabActiva === tab.key ? '#2D2A26' : '#6B7280',
                borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Lista de pasos */}
        {pasos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pasos.map((paso, i) => (
              <RoutineStepItem key={paso.id} paso={paso} index={i} />
            ))}
          </div>
        ) : (
          <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No hay pasos para la {tabActiva === 'manana' ? 'mañana' : 'noche'}
          </p>
        )}

        {/* Disclaimer */}
        <div style={{
          background: '#F7F3EE',
          borderLeft: '3px solid #C9A46A',
          borderRadius: '0 10px 10px 0',
          padding: '10px 14px',
        }}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '12px', lineHeight: '1.5' }}>
            Consulta con tu doctora antes de modificar esta rutina o agregar nuevos productos.
            Cada piel es única y los cambios pueden afectar los resultados de tu tratamiento.
          </p>
        </div>

      </div>
    </div>
  )
}
