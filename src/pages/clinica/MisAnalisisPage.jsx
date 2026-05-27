import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ClinicLayout from './ClinicLayout'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const isValidUUID = id =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')

const RIESGO_STYLE = {
  alto:     { color: '#C9A46A', bg: 'rgba(201,164,106,0.10)', border: 'rgba(201,164,106,0.2)', label: 'ALTO'     },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)', label: 'MODERADO' },
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)', label: 'BAJO'     },
}

// Datos de demostración — se usan cuando user.id no es un UUID real (modo demo).
const MOCK_ANALISIS = [
  {
    id: 'mock-a1',
    fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nivel_riesgo: 'moderado',
    puntuacion_total: 3,
    imagen_url: null,
    diagnostico_preliminar:
      'Lesión melanocítica con criterios menores de atipía. Red pigmentada levemente irregular en zona periférica. Sin criterios mayores de malignidad. Se recomienda valoración presencial en 4-6 semanas.',
    tipo_piel: 'Fototipo III',
    confianza: 'media',
    requiere_atencion_urgente: false,
    criterios_pos: 2,
  },
  {
    id: 'mock-a2',
    fecha: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    nivel_riesgo: 'bajo',
    puntuacion_total: 1,
    imagen_url: null,
    diagnostico_preliminar:
      'Hallazgos dermoscópicos dentro de parámetros benignos. Patrón globular uniforme compatible con nevus intradérmico. Control fotográfico comparativo recomendado en 12 meses.',
    tipo_piel: 'Fototipo II-III',
    confianza: 'alta',
    requiere_atencion_urgente: false,
    criterios_pos: 0,
  },
  {
    id: 'mock-a3',
    fecha: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    nivel_riesgo: 'bajo',
    puntuacion_total: 0,
    imagen_url: null,
    diagnostico_preliminar:
      'Sin hallazgos dermoscópicos relevantes. Lesión homogénea sin criterios de atipia. Análisis de cribado inicial satisfactorio.',
    tipo_piel: 'Fototipo II',
    confianza: 'alta',
    requiere_atencion_urgente: false,
    criterios_pos: 0,
  },
]

function fmtFecha(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtMes(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export default function MisAnalisisPage() {
  const navigate   = useNavigate()
  const { slug }   = useParams()
  const { user }   = useAuth()

  const [analisis, setAnalisis] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Demo/mock mode: user.id no es un UUID real → usar datos locales.
      // Evita disparar consultas Supabase con IDs inválidos (error 400 RLS).
      if (!supabase || !isValidUUID(user?.id)) {
        setAnalisis(MOCK_ANALISIS)
        setCargando(false)
        return
      }
      const { data } = await supabase
        .from('analisis_dermoscopicos')
        .select('*')
        .eq('paciente_id', user.id)
        .order('fecha', { ascending: false })
      if (!cancelled) {
        setAnalisis(data || [])
        setCargando(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Agrupar por mes para la línea de tiempo
  const grupos = analisis.reduce((acc, a) => {
    const key = fmtMes(a.fecha)
    ;(acc[key] = acc[key] ?? []).push(a)
    return acc
  }, {})

  return (
    <ClinicLayout>

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#161313', padding: '32px 24px 28px' }}>
        <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(247,245,242,0.35)', margin: '0 0 8px' }}>
          Mis análisis
        </p>
        <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#F7F5F2', letterSpacing: '-0.02em', margin: 0 }}>
          Historial Dermoscópico
        </h1>
        <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.4)', marginTop: '6px', marginBottom: 0 }}>
          {!cargando && analisis.length > 0
            ? `${analisis.length} análisis registrado${analisis.length !== 1 ? 's' : ''}`
            : 'Seguimiento visual de tus lesiones dermoscópicas'}
        </p>
      </div>

      {/* ── CONTENIDO ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 104px', background: '#F7F5F2' }}>

        {/* Skeletons */}
        {cargando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{ height: '140px', background: 'rgba(22,19,19,0.05)', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }}
              />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!cargando && analisis.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <i className="ti ti-microscope" style={{ fontSize: '32px', color: 'rgba(22,19,19,0.15)', display: 'block' }} />
            <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', marginTop: '12px', marginBottom: '24px' }}>
              Sin análisis registrados
            </p>
            <button
              onClick={() => navigate(`/clinica/${slug}/dermoscopia`)}
              style={{ background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '12px 24px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Nuevo análisis
            </button>
          </div>
        )}

        {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
        {!cargando && analisis.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {Object.entries(grupos).map(([mes, items]) => (
              <div key={mes}>

                {/* Separador de mes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.28)', whiteSpace: 'nowrap' }}>
                    {mes}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(22,19,19,0.07)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(a => {
                    const nivel = (a.nivel_riesgo ?? a.nivel ?? 'bajo').toLowerCase()
                    const rs    = RIESGO_STYLE[nivel] ?? RIESGO_STYLE.bajo
                    const punt  = a.puntuacion_total ?? a.puntuacion ?? 0
                    const diag  = a.diagnostico_preliminar

                    return (
                      <div
                        key={a.id}
                        onClick={() => navigate(`/clinica/${slug}/dermoscopia`)}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid rgba(22,19,19,0.07)',
                          borderLeft: `3px solid ${rs.color}`,
                          borderRadius: '2px',
                          padding: '16px 20px',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Fila superior: fecha + badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.35)', letterSpacing: '0.04em' }}>
                            {fmtFecha(a.fecha)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {a.confianza && (
                              <span style={{ fontFamily: DM_MONO, fontSize: '8px', letterSpacing: '0.08em', color: 'rgba(22,19,19,0.28)', textTransform: 'uppercase' }}>
                                IA · {a.confianza}
                              </span>
                            )}
                            <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 9px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color }}>
                              {rs.label}
                            </span>
                          </div>
                        </div>

                        {/* Fila media: miniatura + puntuación */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                          {/* Miniatura */}
                          <div style={{
                            width: '64px', height: '64px', borderRadius: '2px', flexShrink: 0,
                            background: 'rgba(22,19,19,0.04)',
                            border: '1px solid rgba(22,19,19,0.07)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {a.imagen_url ? (
                              <img
                                src={a.imagen_url}
                                alt="Dermoscopia"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <i className="ti ti-microscope" style={{ fontSize: '20px', color: 'rgba(22,19,19,0.15)' }} />
                            )}
                          </div>

                          {/* Puntuación + barra */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                              <span style={{ fontFamily: FRAUNCES, fontSize: '36px', fontWeight: 300, color: '#161313', lineHeight: 1 }}>
                                {punt}
                              </span>
                              <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)' }}>
                                / 9 pts
                              </span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(22,19,19,0.06)', borderRadius: '2px' }}>
                              <div style={{ width: `${Math.min((punt / 9) * 100, 100)}%`, height: '100%', background: rs.color, borderRadius: '2px', transition: 'width 0.4s' }} />
                            </div>
                            {a.tipo_piel && (
                              <p style={{ fontFamily: DM_MONO, fontSize: '8px', color: 'rgba(22,19,19,0.28)', letterSpacing: '0.06em', margin: '6px 0 0', textTransform: 'uppercase' }}>
                                {a.tipo_piel}
                              </p>
                            )}
                          </div>

                          {/* Flecha */}
                          <span style={{ fontFamily: DM_MONO, fontSize: '14px', color: 'rgba(22,19,19,0.2)', alignSelf: 'center' }}>→</span>
                        </div>

                        {/* Diagnóstico IA */}
                        {diag && (
                          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(22,19,19,0.05)' }}>
                            <p style={{ fontFamily: DM_MONO, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.25)', margin: '0 0 5px' }}>
                              Diagnóstico IA
                            </p>
                            <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.55)', lineHeight: 1.6, margin: 0 }}>
                              {diag}
                            </p>
                          </div>
                        )}

                        {/* Alerta urgente */}
                        {a.requiere_atencion_urgente && (
                          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(139,58,58,0.06)', border: '1px solid rgba(139,58,58,0.15)', borderRadius: '2px' }}>
                            <p style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B3A3A', margin: 0 }}>
                              ⚠ Requiere atención urgente
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* CTA nuevo análisis */}
            <button
              onClick={() => navigate(`/clinica/${slug}/dermoscopia`)}
              style={{ width: '100%', background: 'none', border: '1px dashed rgba(22,19,19,0.15)', borderRadius: '2px', padding: '14px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', cursor: 'pointer', letterSpacing: '0.06em' }}
            >
              + Nuevo análisis dermoscópico
            </button>
          </div>
        )}

        {/* Nota privacidad */}
        <div style={{ marginTop: '16px', padding: '14px 16px', border: '1px solid rgba(22,19,19,0.06)', borderLeft: '2px solid rgba(146,156,146,0.3)', borderRadius: '2px' }}>
          <p style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', lineHeight: 1.6, margin: 0 }}>
            Tus análisis son privados. Solo tú y el médico que te tiene asignado pueden verlos. Otros miembros de la clínica (excepto admin) no tienen acceso.
          </p>
        </div>
      </div>
    </ClinicLayout>
  )
}
