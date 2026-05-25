import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase } from '../../lib/supabase'
import ClinicLayout from './ClinicLayout'
import SolicitarCitaDrawer from '../../components/SolicitarCitaDrawer'

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const DM_MONO   = "'DM Mono', monospace"
const DM_SANS   = "'DM Sans', system-ui, sans-serif"
const FRAUNCES  = "'Fraunces', Georgia, serif"

const ESTADO_BADGE = {
  pendiente:  { color: '#C8A882',              bg: 'rgba(200,168,130,0.12)', border: 'rgba(200,168,130,0.25)', label: 'Pendiente'  },
  confirmada: { color: '#6B8F6E',              bg: 'rgba(107,143,110,0.10)', border: 'rgba(107,143,110,0.20)', label: 'Confirmada' },
  completada: { color: 'rgba(22,19,19,0.45)',  bg: 'rgba(22,19,19,0.04)',    border: 'rgba(22,19,19,0.10)',    label: 'Completada' },
  cancelada:  { color: 'rgba(22,19,19,0.35)',  bg: 'rgba(22,19,19,0.03)',    border: 'rgba(22,19,19,0.08)',    label: 'Cancelada'  },
  no_asistio: { color: 'rgba(22,19,19,0.35)',  bg: 'rgba(22,19,19,0.03)',    border: 'rgba(22,19,19,0.08)',    label: 'No asistió' },
}

function fmtFechaHora(d) {
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return ''
  const fecha = dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const hora  = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} · ${hora}`
}

export default function MisCitasPacientePage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user } = useAuth()
  const { clinica } = useClinic()

  const [citas,      setCitas]      = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [error,      setError]      = useState(null)

  async function recargar() {
    if (!supabase || !user?.id) { setCargando(false); return }
    setCargando(true)
    const { data, error: err } = await supabase
      .from('citas')
      .select('*')
      .eq('paciente_id', user.id)
      .order('fecha', { ascending: false })
    if (!err) setCitas(data || [])
    setCargando(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supabase || !user?.id) { setCargando(false); return }
      const { data } = await supabase
        .from('citas')
        .select('*')
        .eq('paciente_id', user.id)
        .order('fecha', { ascending: false })
      if (!cancelled) {
        setCitas(data || [])
        setCargando(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const { proximas, historico } = useMemo(() => {
    const ahora = new Date()
    const prox  = []
    const hist  = []
    for (const c of citas) {
      const f = new Date(c.fecha)
      if (f > ahora && c.estado !== 'cancelada' && c.estado !== 'completada') {
        prox.push(c)
      } else {
        hist.push(c)
      }
    }
    prox.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    return { proximas: prox, historico: hist }
  }, [citas])

  function handleSolicitarCita() {
    if (!clinica?.id || !isValidUUID(clinica.id)) {
      setError('Servicio no disponible en modo demo')
      return
    }
    setDrawerOpen(true)
  }

  async function handleCancelar(cita) {
    if (!clinica?.id || !isValidUUID(clinica.id)) {
      setError('Servicio no disponible en modo demo')
      return
    }
    const horasRestantes = (new Date(cita.fecha) - new Date()) / 36e5
    if (horasRestantes < 24) {
      alert('No se puede cancelar con menos de 24 horas de antelación. Contacta con tu clínica.')
      return
    }
    if (!confirm(`¿Cancelar la cita de ${cita.tratamiento}? La clínica recibirá la notificación.`)) return
    if (!supabase) return alert('Modo demo: sin Supabase configurado')
    const { error: err } = await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('id', cita.id)
    if (err) return alert('Error: ' + err.message)
    recargar()
  }

  return (
    <ClinicLayout>
      <div style={{ fontFamily: DM_SANS, background: 'var(--vl-page)', paddingBottom: '104px' }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div style={{
          background:  '#161313',
          padding:     '32px 24px 24px',
          position:    'relative',
          overflow:    'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            border: '1px solid rgba(201,211,202,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            width: '120px', height: '120px', borderRadius: '50%',
            border: '1px solid rgba(201,211,202,0.04)', pointerEvents: 'none',
          }} />

          <p style={{
            fontFamily:    DM_MONO,
            fontSize:      '10px',
            fontWeight:    300,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:         'rgba(201,211,202,0.5)',
            margin:        '0 0 12px',
          }}>
            Mis Citas
          </p>

          <h1 style={{
            fontFamily:    FRAUNCES,
            fontSize:      '40px',
            fontWeight:    400,
            letterSpacing: '-0.02em',
            color:         '#F7F5F2',
            margin:        '0 0 6px',
            lineHeight:    1.05,
          }}>
            Mis Citas
          </h1>

          <p style={{
            fontFamily:    DM_SANS,
            fontSize:      '12px',
            fontWeight:    300,
            color:         'rgba(247,245,242,0.35)',
            letterSpacing: '0.04em',
            margin:        0,
          }}>
            {citas.length} {citas.length === 1 ? 'cita registrada' : 'citas registradas'}
          </p>
        </div>

        {/* ── CONTENT ─────────────────────────────────────────── */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Error banner */}
          {error && (
            <div style={{
              background:  'rgba(200,168,130,0.08)',
              border:      '1px solid rgba(200,168,130,0.2)',
              borderLeft:  '3px solid #C8A882',
              borderRadius: '2px',
              padding:     '10px 14px',
              display:     'flex',
              alignItems:  'center',
              gap:         '10px',
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#C8A882', flexShrink: 0 }} />
              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#C8A882', margin: 0, flex: 1 }}>
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,168,130,0.6)', fontSize: '18px', lineHeight: 1, padding: 0, flexShrink: 0 }}
              >×</button>
            </div>
          )}

          {/* Solicitar cita */}
          <button
            onClick={handleSolicitarCita}
            style={{
              width:          '100%',
              background:     '#161313',
              color:          '#C9D3CA',
              border:         'none',
              borderRadius:   '2px',
              padding:        '14px 20px',
              fontFamily:     DM_SANS,
              fontSize:       '11px',
              fontWeight:     400,
              letterSpacing:  '0.12em',
              textTransform:  'uppercase',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
            }}
          >
            <i className="ti ti-calendar-plus" style={{ fontSize: '14px' }} />
            Solicitar nueva cita
          </button>

          {/* Loading */}
          {cargando && (
            <p style={{
              fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
              color: 'rgba(22,19,19,0.35)', textAlign: 'center', padding: '24px 0', margin: 0,
            }}>
              Cargando citas…
            </p>
          )}

          {/* Próximas */}
          {!cargando && (
            <SeccionCitas titulo="Próximas">
              {proximas.length === 0 ? (
                <EstadoVacio texto="No tienes citas próximas. Pulsa 'Solicitar nueva cita' para reservar." />
              ) : (
                proximas.map(c => (
                  <CitaCard
                    key={c.id}
                    cita={c}
                    onCancelar={() => handleCancelar(c)}
                  />
                ))
              )}
            </SeccionCitas>
          )}

          {/* Histórico */}
          {!cargando && historico.length > 0 && (
            <SeccionCitas titulo="Histórico">
              {historico.map(c => (
                <CitaCard key={c.id} cita={c} compacta />
              ))}
            </SeccionCitas>
          )}

        </div>
      </div>

      {drawerOpen && (
        <SolicitarCitaDrawer
          onClose={() => setDrawerOpen(false)}
          onGuardado={() => recargar()}
        />
      )}
    </ClinicLayout>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  SECCIÓN
// ═══════════════════════════════════════════════════════════════════
function SeccionCitas({ titulo, children }) {
  return (
    <div>
      <p style={{
        fontFamily:    DM_MONO,
        fontSize:      '9px',
        fontWeight:    300,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color:         'rgba(22,19,19,0.35)',
        margin:        '0 0 10px',
      }}>
        {titulo}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  CITA CARD
// ═══════════════════════════════════════════════════════════════════
function CitaCard({ cita, compacta, onCancelar }) {
  const badge = ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.pendiente
  const f = new Date(cita.fecha)
  const horasRestantes = (f - new Date()) / 36e5

  return (
    <div style={{
      background:    '#FFFFFF',
      border:        '1px solid rgba(22,19,19,0.07)',
      borderRadius:  '2px',
      padding:       compacta ? '14px 16px' : '16px 20px',
      opacity:       compacta ? 0.75 : 1,
    }}>

      {/* Tratamiento + badge */}
      <div style={{
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        gap:            '10px',
        marginBottom:   '8px',
      }}>
        <p style={{
          fontFamily: FRAUNCES,
          fontSize:   compacta ? '14px' : '16px',
          fontWeight: 300,
          color:      '#161313',
          margin:     0,
          lineHeight: 1.3,
        }}>
          {cita.tratamiento}
        </p>
        <span style={{
          fontFamily:    DM_MONO,
          fontSize:      '9px',
          fontWeight:    300,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         badge.color,
          background:    badge.bg,
          border:        `1px solid ${badge.border}`,
          borderRadius:  '2px',
          padding:       '3px 8px',
          flexShrink:    0,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: cita.duracion_minutos ? '4px' : 0 }}>
        <i className="ti ti-calendar" style={{ fontSize: '12px', color: 'rgba(22,19,19,0.3)', flexShrink: 0 }} />
        <p style={{
          fontFamily:    DM_SANS,
          fontSize:      '12px',
          fontWeight:    300,
          color:         'rgba(22,19,19,0.55)',
          margin:        0,
          textTransform: 'capitalize',
        }}>
          {fmtFechaHora(f)}
        </p>
      </div>

      {/* Duración */}
      {cita.duracion_minutos && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-clock" style={{ fontSize: '12px', color: 'rgba(22,19,19,0.25)', flexShrink: 0 }} />
          <p style={{
            fontFamily: DM_MONO,
            fontSize:   '10px',
            fontWeight: 300,
            color:      'rgba(22,19,19,0.3)',
            margin:     0,
          }}>
            {cita.duracion_minutos} min
          </p>
        </div>
      )}

      {/* Notas */}
      {!compacta && cita.notas_previas && (
        <p style={{
          fontFamily:  DM_SANS,
          fontSize:    '12px',
          fontWeight:  300,
          color:       'rgba(22,19,19,0.45)',
          background:  'rgba(22,19,19,0.03)',
          border:      '1px solid rgba(22,19,19,0.05)',
          borderRadius: '2px',
          padding:     '8px 12px',
          margin:      '10px 0 0',
          lineHeight:  1.6,
        }}>
          {cita.notas_previas}
        </p>
      )}

      {/* Aviso pendiente */}
      {!compacta && cita.estado === 'pendiente' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <i className="ti ti-clock" style={{ fontSize: '12px', color: '#C8A882', flexShrink: 0 }} />
          <p style={{
            fontFamily:    DM_MONO,
            fontSize:      '9px',
            fontWeight:    300,
            letterSpacing: '0.08em',
            color:         '#C8A882',
            margin:        0,
          }}>
            Pendiente de confirmación por la clínica
          </p>
        </div>
      )}

      {/* Cancelar */}
      {!compacta && onCancelar && (cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
        <button
          onClick={onCancelar}
          disabled={horasRestantes < 24}
          title={horasRestantes < 24 ? 'No se puede cancelar con <24h' : 'Cancelar cita'}
          style={{
            marginTop:     '12px',
            background:    'none',
            border:        '1px solid rgba(22,19,19,0.1)',
            borderRadius:  '2px',
            padding:       '7px 14px',
            fontFamily:    DM_MONO,
            fontSize:      '9px',
            fontWeight:    300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         horasRestantes < 24 ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.45)',
            cursor:        horasRestantes < 24 ? 'not-allowed' : 'pointer',
            opacity:       horasRestantes < 24 ? 0.5 : 1,
          }}
        >
          Cancelar cita
        </button>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  ESTADO VACÍO
// ═══════════════════════════════════════════════════════════════════
function EstadoVacio({ texto }) {
  return (
    <div style={{
      background:   '#FFFFFF',
      border:       '1px dashed rgba(22,19,19,0.10)',
      borderRadius: '2px',
      padding:      '28px 20px',
      textAlign:    'center',
    }}>
      <i className="ti ti-calendar-off" style={{ fontSize: '24px', color: 'rgba(22,19,19,0.15)', display: 'block', marginBottom: '10px' }} />
      <p style={{
        fontFamily: DM_SANS,
        fontSize:   '12px',
        fontWeight: 300,
        color:      'rgba(22,19,19,0.35)',
        lineHeight: 1.7,
        margin:     0,
      }}>
        {texto}
      </p>
    </div>
  )
}
