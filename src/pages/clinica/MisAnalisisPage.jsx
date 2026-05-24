import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase } from '../../lib/supabase'
import ClinicLayout from './ClinicLayout'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RIESGO_STYLE = {
  alto:     { color: '#C9A46A', bg: 'rgba(201,164,106,0.10)', border: 'rgba(201,164,106,0.2)', label: 'ALTO'     },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)', label: 'MODERADO' },
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)', label: 'BAJO'     },
}

const RIESGO_MENSAJE = {
  bajo:     'No se detectan signos de alarma. Revisión rutinaria recomendada.',
  moderado: 'Algunos criterios merecen atención. Consulta con tu médico en las próximas semanas.',
  alto:     'Se detectan criterios de alerta. Consulta dermatológica urgente recomendada.',
}

function fmtFecha(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MisAnalisisPage() {
  const navigate   = useNavigate()
  const { slug }   = useParams()
  const { user }   = useAuth()
  const { clinica } = useClinic()

  const [analisis, setAnalisis] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supabase || !user?.id) { setCargando(false); return }
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

  return (
    <ClinicLayout>

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <div style={{ background: '#161313', padding: '32px 24px 28px' }}>
        <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(247,245,242,0.35)', margin: '0 0 8px' }}>
          Mis análisis
        </p>
        <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#F7F5F2', letterSpacing: '-0.02em', margin: 0 }}>
          Mis Análisis
        </h1>
        <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.4)', marginTop: '6px', marginBottom: 0 }}>
          Historial de análisis dermoscópicos
        </p>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────── */}
      <div style={{ padding: '20px 20px 104px', background: '#F7F5F2' }}>

        {/* Skeletons */}
        {cargando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: '80px', background: 'rgba(22,19,19,0.05)', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
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

        {/* Lista */}
        {!cargando && analisis.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analisis.map(a => {
              const nivel = (a.nivel_riesgo ?? a.nivel ?? 'bajo').toLowerCase()
              const rs    = RIESGO_STYLE[nivel] ?? RIESGO_STYLE.bajo
              const punt  = a.puntuacion_total ?? a.puntuacion ?? 0

              return (
                <div
                  key={a.id}
                  onClick={() => alert(`Informe completo del análisis del ${fmtFecha(a.fecha)}\n(Próximamente)`)}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  {/* Fila superior */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 9px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color }}>
                      {rs.label}
                    </span>
                    <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.35)', marginLeft: 'auto' }}>
                      {fmtFecha(a.fecha)}
                    </span>
                    <span style={{ fontFamily: DM_MONO, fontSize: '14px', color: 'rgba(22,19,19,0.2)' }}>→</span>
                  </div>

                  {/* Puntuación */}
                  <p style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', margin: '8px 0 0' }}>
                    {punt}/7
                  </p>

                  {/* Barra */}
                  <div style={{ height: '2px', background: 'rgba(22,19,19,0.06)', borderRadius: '1px', marginTop: '8px' }}>
                    <div style={{ width: `${(punt / 7) * 100}%`, height: '100%', background: rs.color, borderRadius: '1px' }} />
                  </div>

                  {/* Mensaje */}
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', lineHeight: 1.5, marginTop: '8px', marginBottom: 0 }}>
                    {RIESGO_MENSAJE[nivel]}
                  </p>
                </div>
              )
            })}
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
