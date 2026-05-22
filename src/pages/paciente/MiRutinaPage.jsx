import { useState } from 'react'
import { useAuth }    from '../../contexts/AuthContext'
import { useClinic }  from '../../contexts/ClinicContext'
import { useRoutine } from '../../hooks/useRoutine'

function getInitials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd} · ${mm} · ${yyyy}`
}

export default function MiRutinaPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()
  const { rutinas, loading, error } = useRoutine(user?.email, clinica?.id)

  const [tabActiva, setTabActiva] = useState('manana')
  const [rutinaIdx, setRutinaIdx] = useState(0)
  const [expanded,  setExpanded]  = useState(new Set())
  const [completed, setCompleted] = useState(new Set())

  function toggleExpanded(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleCompleted(key) {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        // Colapsar si se completa
        setExpanded(e => { const s = new Set(e); s.delete(key); return s })
      }
      return next
    })
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minHeight: '100vh', background: 'var(--vl-page-dark)' }}>
        <div className="vl-skeleton" style={{ height: '160px' }} />
        <div className="vl-skeleton" style={{ height: '60px' }} />
        <div className="vl-skeleton" style={{ height: '80px' }} />
        <div className="vl-skeleton" style={{ height: '80px' }} />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: 'var(--vl-carbon)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ borderLeft: '2px solid var(--vl-taupe)', paddingLeft: '14px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-taupe)', lineHeight: 1.7 }}>{error}</p>
        </div>
      </div>
    )
  }

  // ── Sin rutina ───────────────────────────────────────────────
  if (rutinas.length === 0) {
    return (
      <div style={{
        background: 'var(--vl-carbon)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--vl-font-display)',
          fontSize: '16px', fontStyle: 'italic',
          color: 'var(--vl-sage-mid)', margin: 0,
        }}>
          Sin rutina asignada
        </p>
      </div>
    )
  }

  const rutina  = rutinas[rutinaIdx] || rutinas[0]
  const pasos   = tabActiva === 'manana' ? rutina.pasos_manana : rutina.pasos_noche
  const total   = pasos.length
  const done    = pasos.filter((p, i) => completed.has(`${tabActiva}-${p.id ?? i}`)).length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div style={{ fontFamily: 'var(--vl-font-body)', background: 'var(--vl-page)', paddingBottom: '80px' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '32px 24px 0', overflow: 'hidden', position: 'relative' }}>
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          width: '120px', height: '120px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.06)', pointerEvents: 'none',
        }} />

        {/* Eyebrow */}
        <p className="vl-eyebrow" style={{ margin: '0 0 16px' }}>Protocolo recetado</p>

        {/* Título */}
        <h1 style={{
          fontFamily: 'var(--vl-font-display)',
          fontSize: '40px', fontWeight: 400, lineHeight: 1.0,
          letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--vl-page)',
        }}>
          Mi Rutina<br />
          <em style={{ color: 'var(--vl-sage)', fontStyle: 'italic' }}>Recetada</em>
        </h1>

        <p style={{ margin: '0', fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.35)', letterSpacing: '0.06em' }}>
          Protocolo diseñado para tu piel
        </p>

        {/* Select rutina */}
        {rutinas.length > 1 && (
          <select
            value={rutinaIdx}
            onChange={e => { setRutinaIdx(Number(e.target.value)); setExpanded(new Set()); setCompleted(new Set()) }}
            style={{
              marginTop: '14px', width: '100%', padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)', color: 'var(--vl-sage)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px',
              fontFamily: 'var(--vl-font-body)', fontSize: '12px',
              letterSpacing: '0.04em', outline: 'none',
            }}
          >
            {rutinas.map((r, i) => (
              <option key={r.id} value={i}>{r.nombre}</option>
            ))}
          </select>
        )}

        {/* Doctor row */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '20px', marginTop: '20px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {rutina.medico?.foto ? (
            <img
              src={rutina.medico.foto}
              alt={rutina.medico.nombre}
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="vl-avatar-dark">{getInitials(rutina.medico?.nombre)}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: 'var(--vl-page)', fontSize: '13px', fontWeight: 400 }}>
              {rutina.medico?.nombre || 'Especialista'}
            </p>
            {rutina.medico?.especialidad && (
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 300 }}>
                {rutina.medico.especialidad}
              </p>
            )}
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 300, flexShrink: 0 }}>
            {formatDate(rutina.asignado_en)}
          </p>
        </div>
      </div>

      {/* ── SELECTOR DE MOMENTO ──────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '0 24px 20px' }}>
        <div style={{
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '2px', overflow: 'hidden', display: 'flex',
          marginTop: '20px',
        }}>
          {[
            { key: 'manana', label: 'Mañana' },
            { key: 'noche',  label: 'Noche'  },
          ].map(tab => {
            const activa = tabActiva === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { setTabActiva(tab.key); setExpanded(new Set()) }}
                style={{
                  flex: 1, padding: '14px', border: 'none',
                  background: activa ? 'rgba(201,211,202,0.08)' : 'transparent',
                  color: activa ? 'var(--vl-sage)' : 'rgba(255,255,255,0.2)',
                  fontSize: '11px', fontWeight: 300,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'var(--vl-transition)',
                  fontFamily: 'var(--vl-font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {tab.label}
                {activa && (
                  <span style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: 'var(--vl-sage)', opacity: 0.6, flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── BARRA DE PROGRESO ────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '0 24px 24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '2px', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,245,242,0.3)' }}>
              Completado hoy
            </span>
            <span style={{ fontFamily: 'var(--vl-font-display)', fontSize: '22px', fontWeight: 300, color: 'var(--vl-sage)' }}>
              {done}/{total}
            </span>
          </div>
          <div className="vl-progress-bar-dark">
            <div className="vl-progress-fill-dark" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-page)', flex: 1 }}>
        <div style={{ padding: '24px 24px 0' }}>

          {pasos.length === 0 ? (
            <p style={{ color: 'var(--vl-sage-mid)', fontSize: '13px', fontStyle: 'italic', fontFamily: 'var(--vl-font-display)', textAlign: 'center', padding: '32px 0', margin: 0 }}>
              Sin pasos para la {tabActiva === 'manana' ? 'mañana' : 'noche'}
            </p>
          ) : (
            <div>
              {pasos.map((paso, i) => {
                const key        = `${tabActiva}-${paso.id ?? i}`
                const isExpanded = expanded.has(key)
                const isDone     = completed.has(key)
                const frecLabel  = paso.frecuencia_dias === 1
                  ? 'Diario'
                  : `Cada ${paso.frecuencia_dias} días`
                const isLast = i === pasos.length - 1

                return (
                  <div key={key}>
                    {/* Step row */}
                    <div
                      onClick={() => !isDone && toggleExpanded(key)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr 24px',
                        padding: '20px 0',
                        cursor: isDone ? 'default' : 'pointer',
                        alignItems: 'start',
                      }}
                    >
                      {/* Número */}
                      <span style={{
                        fontFamily: 'var(--vl-font-display)',
                        fontSize: '44px', fontWeight: 300, lineHeight: 0.9,
                        color: isExpanded && !isDone ? 'var(--vl-carbon)' : 'rgba(22,19,19,0.10)',
                        transition: 'color 0.2s',
                        opacity: isDone ? 0.3 : 1,
                        textDecoration: isDone ? 'line-through' : 'none',
                        userSelect: 'none',
                      }}>
                        {i + 1}
                      </span>

                      {/* Info */}
                      <div style={{ paddingTop: '4px' }}>
                        <p style={{
                          margin: '0 0 3px',
                          fontFamily: 'var(--vl-font-display)',
                          fontSize: '18px', fontWeight: 400,
                          color: 'var(--vl-carbon)', lineHeight: 1.2,
                          opacity: isDone ? 0.3 : 1,
                        }}>
                          {paso.nombre_producto}
                        </p>
                        <p style={{
                          margin: 0,
                          fontSize: '10px', fontWeight: 300,
                          color: 'var(--vl-sage-mid)',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          {frecLabel}
                        </p>
                      </div>

                      {/* Chevron */}
                      {!isDone && (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: '1px solid rgba(22,19,19,0.15)',
                          background: isExpanded ? 'var(--vl-carbon)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: '6px', flexShrink: 0,
                          transition: 'var(--vl-transition)',
                        }}>
                          <i
                            className="ti ti-chevron-down"
                            style={{
                              fontSize: '11px',
                              color: isExpanded ? 'var(--vl-white)' : 'rgba(22,19,19,0.4)',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                              display: 'block', lineHeight: 1,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Body expandido */}
                    {isExpanded && !isDone && (
                      <div style={{ paddingLeft: '48px', paddingBottom: '20px' }}>
                        {paso.instrucciones && (
                          <p style={{
                            margin: '0 0 12px', fontSize: '13px', fontWeight: 300,
                            color: 'rgba(22,19,19,0.55)', lineHeight: 1.8,
                          }}>
                            {paso.instrucciones}
                          </p>
                        )}
                        {paso.advertencias && (
                          <div style={{ borderLeft: '2px solid var(--vl-taupe)', paddingLeft: '14px', marginBottom: '12px' }}>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 300, color: 'var(--vl-taupe)', lineHeight: 1.7 }}>
                              {paso.advertencias}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleCompleted(key) }}
                          style={{
                            width: '100%',
                            background: 'var(--vl-carbon)',
                            color: 'var(--vl-sage)',
                            border: 'none', borderRadius: '2px',
                            padding: '11px',
                            fontFamily: 'var(--vl-font-body)',
                            fontSize: '11px', fontWeight: 400,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            cursor: 'pointer', transition: 'var(--vl-transition)',
                          }}
                        >
                          Completado
                        </button>
                      </div>
                    )}

                    {/* Divider */}
                    {!isLast && (
                      <div style={{ height: '1px', background: 'rgba(22,19,19,0.08)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{
          margin: '24px',
          padding: '16px 18px',
          border: '1px solid rgba(22,19,19,0.06)',
          borderLeft: '2px solid var(--vl-sage-mid)',
        }}>
          <p style={{
            margin: 0,
            fontSize: '11px', fontWeight: 300,
            color: 'rgba(22,19,19,0.4)', lineHeight: 1.8, letterSpacing: '0.02em',
          }}>
            Consulta con tu doctora antes de modificar esta rutina o agregar nuevos productos.
            Cada piel es única y los cambios pueden afectar los resultados de tu tratamiento.
          </p>
        </div>
      </div>
    </div>
  )
}
