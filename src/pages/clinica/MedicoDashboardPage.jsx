import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCitas, ESTADO_STYLE } from '../../contexts/CitasContext'
import FeatureGate from '../../components/FeatureGate'
import StaffLayout from './StaffLayout'
import { fTime } from '../../services/recordatorios'
import { supabase } from '../../lib/supabase'
import { formatFecha } from '../../utils/fecha'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RIESGO_STYLE = {
  bajo:     { bg: '#dcfce7', text: '#15803d' },
  moderado: { bg: '#fef9c3', text: '#a16207' },
  alto:     { bg: '#fee2e2', text: '#b91c1c' },
}

// Colores de línea vertical por estado de cita
const ESTADO_LINE = {
  pendiente:  '#C9A46A',
  confirmada: '#929C92',
  completada: '#A39384',
  cancelada:  'rgba(22,19,19,0.15)',
  no_asistio: 'rgba(22,19,19,0.1)',
}

// Badge inline style por estado
function estadoBadgeStyle(estado) {
  switch (estado) {
    case 'pendiente':  return { background: 'rgba(201,164,106,0.08)', border: '1px solid rgba(201,164,106,0.2)', color: '#C9A46A' }
    case 'confirmada': return { background: 'rgba(146,156,146,0.08)', border: '1px solid rgba(146,156,146,0.2)', color: '#929C92' }
    case 'completada': return { background: 'rgba(22,19,19,0.04)',    border: '1px solid rgba(22,19,19,0.1)',    color: 'rgba(22,19,19,0.4)' }
    default:           return { background: 'rgba(22,19,19,0.04)',    border: '1px solid rgba(22,19,19,0.08)',   color: 'rgba(22,19,19,0.25)' }
  }
}

const card = {
  background: '#FFFFFF',
  border: '1px solid rgba(22,19,19,0.07)',
  borderRadius: '2px',
}

export default function MedicoDashboardPage() {
  const navigate  = useNavigate()
  const { slug }  = useParams()
  const { clinica } = useClinic()
  const { user, logout } = useAuth()
  const { citas } = useCitas()
  const brand = clinica?.color_primario ?? '#C8A882'

  const todayDate = new Date()
  const today = todayDate.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const citasHoy = useMemo(() =>
    citas
      .filter(c => {
        const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
        return f.getFullYear() === todayDate.getFullYear() &&
               f.getMonth()    === todayDate.getMonth()    &&
               f.getDate()     === todayDate.getDate()
      })
      .sort((a, b) => {
        const fa = a.fecha instanceof Date ? a.fecha : new Date(a.fecha)
        const fb = b.fecha instanceof Date ? b.fecha : new Date(b.fecha)
        return fa - fb
      }),
    [citas]
  )

  const [myPatients, setMyPatients] = useState([])
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('pacientes')
      .select('id, nombre, apellido, foto_perfil, total_visitas, ultima_visita, riesgo')
      .then(({ data }) => {
        if (data) setMyPatients(data.map(p => ({
          id:            p.id,
          nombre:        `${p.nombre} ${p.apellido}`,
          foto:          p.foto_perfil ?? null,
          sesiones:      p.total_visitas ?? 0,
          ultima_sesion: formatFecha(p.ultima_visita),
          riesgo:        p.riesgo ?? 'bajo',
        })))
      })
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const pendientes = citasHoy.filter(c => c.estado === 'pendiente').length

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <p style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(22,19,19,0.3)', textTransform: 'capitalize', margin: '0 0 6px' }}>
              {today}
            </p>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
              Buenos días, {user?.nombre?.split(' ')[0] ?? 'Doctor'}
            </h1>
            <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: '4px 0 0' }}>
              {clinica?.nombre}
            </p>
          </div>

          {/* Mini KPI cards */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {[
              { valor: citasHoy.length,    label: 'CITAS HOY'    },
              { valor: pendientes,         label: 'PENDIENTES'   },
              { valor: myPatients.length,  label: 'MIS PACIENTES'},
            ].map(kpi => (
              <div key={kpi.label} style={{ ...card, padding: '12px 20px', textAlign: 'center', minWidth: '80px' }}>
                <p style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', lineHeight: 1, margin: '0 0 4px' }}>
                  {kpi.valor}
                </p>
                <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', letterSpacing: '0.1em', margin: 0 }}>
                  {kpi.label}
                </p>
              </div>
            ))}
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', padding: '6px 14px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', cursor: 'pointer', fontFamily: DM_SANS, alignSelf: 'center' }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── GRID PRINCIPAL ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Agenda de hoy */}
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Agenda de hoy</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)' }}>
                  {citasHoy.length} CITAS
                </span>
                <button
                  onClick={() => navigate(`/clinica/${slug}/agenda`)}
                  style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Ver agenda →
                </button>
              </div>
            </div>

            {citasHoy.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <i className="ti ti-calendar-off" style={{ fontSize: '24px', color: 'rgba(22,19,19,0.15)', display: 'block', marginBottom: '8px' }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
                  Sin citas programadas para hoy
                </p>
              </div>
            ) : (
              citasHoy.map(cita => {
                const f         = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
                const completada = cita.estado === 'completada'
                const lineColor  = ESTADO_LINE[cita.estado] ?? 'rgba(22,19,19,0.1)'
                const badge      = estadoBadgeStyle(cita.estado)
                return (
                  <div key={cita.id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(22,19,19,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Hora */}
                    <span style={{ fontFamily: DM_MONO, fontSize: '13px', color: '#161313', width: '48px', flexShrink: 0 }}>
                      {fTime(f)}
                    </span>

                    {/* Línea vertical */}
                    <div style={{ width: '2px', height: '36px', borderRadius: '1px', flexShrink: 0, background: lineColor }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: completada ? 'rgba(22,19,19,0.35)' : '#161313', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cita.paciente_nombre}
                      </p>
                      <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cita.tratamiento}
                      </p>
                    </div>

                    {/* Badge + acción */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', ...badge }}>
                        {cita.estado?.replace('_', ' ')}
                      </span>
                      {!completada && (
                        <button
                          onClick={() => navigate(`/clinica/${slug}/paciente/${cita.paciente_id}`)}
                          style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(22,19,19,0.12)', borderRadius: '2px', padding: '5px 10px', background: 'transparent', color: 'rgba(22,19,19,0.5)', cursor: 'pointer' }}
                        >
                          Iniciar
                        </button>
                      )}
                      {completada && (
                        <i className="ti ti-circle-check" style={{ fontSize: '16px', color: '#929C92' }} />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Columna derecha — Mis pacientes */}
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Mis pacientes</span>
              <button
                onClick={() => navigate(`/clinica/${slug}/pacientes`)}
                style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Ver todos →
              </button>
            </div>

            {myPatients.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <i className="ti ti-users" style={{ fontSize: '24px', color: 'rgba(22,19,19,0.15)', display: 'block', marginBottom: '8px' }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
                  Sin pacientes asignados
                </p>
              </div>
            ) : (
              myPatients.map(p => {
                const rs = RIESGO_STYLE[p.riesgo]
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/clinica/${slug}/paciente/${p.id}`)}
                    style={{ padding: '14px 20px', borderBottom: '1px solid rgba(22,19,19,0.04)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                  >
                    {p.foto ? (
                      <img src={p.foto} alt={p.nombre} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(146,156,146,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: FRAUNCES, fontSize: '12px', color: '#929C92' }}>
                          {p.nombre.split(' ').map(s => s[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nombre}
                      </p>
                      <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', letterSpacing: '0.04em', margin: '2px 0 0' }}>
                        {p.sesiones} sesiones · {p.ultima_sesion}
                      </p>
                    </div>
                    <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', flexShrink: 0, background: rs.bg, color: rs.text }}>
                      {p.riesgo}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── DERMOSCOPIA CTA ─────────────────────────────── */}
        <FeatureGate feature="dermoscopia_ia">
          <div style={{ ...card, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 4px' }}>
                Análisis dermoscópico
              </p>
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: 0 }}>
                Inicia un nuevo análisis asistido por IA
              </p>
            </div>
            <button
              onClick={() => navigate('/dermoscopia')}
              style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
            >
              <i className="ti ti-microscope" style={{ fontSize: '13px' }} />
              Iniciar análisis
            </button>
          </div>
        </FeatureGate>

      </div>
    </StaffLayout>
  )
}
