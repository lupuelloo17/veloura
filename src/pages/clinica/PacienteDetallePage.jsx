import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import FeatureGate from '../../components/FeatureGate'
import StaffLayout from './StaffLayout'
import PACIENTES, { SESIONES_DB, ANALISIS_DB } from '../../data/pacientes'
import { supabase } from '../../lib/supabase'
import NuevaSesionDrawer from '../../components/NuevaSesionDrawer'
import { formatFecha } from '../../utils/fecha'
import EvolucionPage from './EvolucionPage'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RIESGO_STYLE = {
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)', label: 'BAJO'     },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)', label: 'MODERADO' },
  alto:     { color: '#8B3A3A', bg: 'rgba(139,58,58,0.08)',   border: 'rgba(139,58,58,0.2)',   label: 'ALTO'     },
}

const TABS = ['Información', 'Sesiones', 'Análisis', 'Evolución']

export default function PacienteDetallePage() {
  const navigate     = useNavigate()
  const { slug, id } = useParams()
  const { clinica }  = useClinic()
  const { user }     = useAuth()

  const [tab,      setTab]      = useState(0)
  const [paciente, setPaciente] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [analisis, setAnalisis] = useState([])
  const [cargando, setCargando] = useState(true)
  const [nuevaSesionAbierta, setNuevaSesionAbierta] = useState(false)
  const [msgDrawer,   setMsgDrawer]   = useState(false)
  const [msgTexto,    setMsgTexto]    = useState('')
  const [enviandoMsg, setEnviandoMsg] = useState(false)
  const [msgEnviado,  setMsgEnviado]  = useState(false)

  async function handleEnviarMensaje() {
    const texto = msgTexto.trim()
    if (!texto || enviandoMsg) return
    setEnviandoMsg(true)
    try {
      if (supabase && clinica?.id && !clinica._isMock && paciente?.id) {
        const { error } = await supabase.from('mensajes').insert({
          clinica_id:      clinica.id,
          remitente_id:    user.id,
          destinatario_id: paciente.id,
          contenido:       texto,
          tipo:            'texto',
        })
        if (error) throw error
      }
      setMsgTexto('')
      setMsgEnviado(true)
      setTimeout(() => { setMsgEnviado(false); setMsgDrawer(false) }, 1200)
    } catch (err) {
      alert('Error al enviar: ' + err.message)
    } finally {
      setEnviandoMsg(false)
    }
  }

  useEffect(() => {
    // ── BUG FIX A: reset state immediately when id changes ───────────
    // Without this, navigating p1 → p2 keeps p1 data while p2 loads
    setPaciente(null)
    setSesiones([])
    setAnalisis([])
    setTab(0)

    if (!id) { setCargando(false); return }

    if (supabase) {
      // ── Supabase mode: fetch real data by UUID ─────────────────────
      setCargando(true)
      Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase.from('sesiones').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
        supabase.from('analisis_dermoscopicos').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
      ]).then(([{ data: p, error: pe }, { data: s }, { data: a }]) => {
        if (pe) {
          // ── BUG FIX B: Supabase failed (RLS / not found) → try static ──
          console.warn('[PacienteDetalle] Supabase error, falling back to static:', pe.message)
          const staticP = PACIENTES.find(sp => sp.id === id) ?? null
          setPaciente(staticP)
          setSesiones(SESIONES_DB[id] ?? [])
          setAnalisis(ANALISIS_DB[id] ?? [])
        } else {
          // ── BUG FIX C: normalize Supabase session field names ─────────
          // DB uses tipo_tratamiento / notas_clinicas; UI reads tratamiento / nota
          const normSesiones = (s ?? []).map(row => ({
            ...row,
            tratamiento: row.tipo_tratamiento ?? row.tratamiento,
            nota:        row.notas_clinicas   ?? row.nota,
            medico:      row.medico           ?? 'Dra. García',
            fecha:       row.fecha
              ? new Date(row.fecha).toLocaleDateString('es-ES')
              : row.fecha,
          }))
          const normAnalisis = (a ?? []).map(row => ({
            ...row,
            nivel:         row.nivel_riesgo    ?? row.nivel,
            puntuacion:    row.puntuacion_total ?? row.puntuacion,
            criterios_pos: row.criterios_pos   ?? 0,
            fecha:         row.fecha
              ? new Date(row.fecha).toLocaleDateString('es-ES')
              : row.fecha,
          }))
          setPaciente(p)
          setSesiones(normSesiones)
          setAnalisis(normAnalisis)
        }
        setCargando(false)
      })
    } else {
      // ── Mock mode: look up in static data ─────────────────────────
      setPaciente(PACIENTES.find(p => p.id === id) ?? null)
      setSesiones(SESIONES_DB[id] ?? [])
      setAnalisis(ANALISIS_DB[id] ?? [])
      setCargando(false)
    }
  }, [id])

  if (cargando && !paciente) {
    return (
      <StaffLayout>
        <div style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: 0 }}>Cargando…</p>
        </div>
      </StaffLayout>
    )
  }

  if (!paciente) {
    return (
      <StaffLayout>
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', textAlign: 'center' }}>
          <i className="ti ti-alert-circle" style={{ fontSize: '32px', color: 'rgba(22,19,19,0.15)', display: 'block', marginBottom: '12px' }} />
          <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: '0 0 4px' }}>Paciente no encontrado</p>
          <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', margin: '0 0 16px' }}>ID: {id}</p>
          <button
            onClick={() => navigate(`/clinica/${slug}/pacientes`)}
            style={{ background: 'none', border: 'none', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Volver a la lista
          </button>
        </div>
      </StaffLayout>
    )
  }

  const alergiasDestacadas = paciente.alergias &&
    !paciente.alergias.toLowerCase().includes('ninguna')
  const iniciales = `${paciente.nombre?.[0] ?? ''}${paciente.apellido?.[0] ?? ''}`

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>

          {/* Izquierda */}
          <div>
            <button
              onClick={() => navigate(-1)}
              style={{ display: 'block', background: 'none', border: 'none', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', cursor: 'pointer', marginBottom: '12px', padding: 0 }}
            >
              ← Pacientes
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(22,19,19,0.06)', border: '1px solid rgba(22,19,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>{iniciales}</span>
              </div>
              <div>
                <h1 style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', marginBottom: 0 }}>
                  {paciente.edad ? `${paciente.edad} años · ` : ''}{paciente.medico ?? 'Dra. García'}
                </p>
              </div>
            </div>
          </div>

          {/* Derecha — KPIs + Mensaje */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {[
              { label: 'VISITAS',   value: paciente.total_visitas ?? 0 },
              { label: 'ANÁLISIS',  value: analisis.length },
              { label: 'TIPO PIEL', value: paciente.tipo_piel ?? '—' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '12px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: FRAUNCES, fontSize: '24px', fontWeight: 300, color: '#161313', margin: 0 }}>{kpi.value}</p>
                <p style={{ fontFamily: DM_MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)', marginTop: '4px', marginBottom: 0 }}>{kpi.label}</p>
              </div>
            ))}
            <button
              onClick={() => setMsgDrawer(true)}
              style={{ alignSelf: 'center', background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '10px 18px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="ti ti-message" style={{ fontSize: '14px' }} />
              Mensaje
            </button>
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(22,19,19,0.08)', marginBottom: '28px' }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={{
                padding: '10px 20px',
                fontFamily: DM_SANS,
                fontSize: '13px',
                fontWeight: tab === i ? 400 : 300,
                color: tab === i ? '#161313' : 'rgba(22,19,19,0.35)',
                background: 'none',
                border: 'none',
                borderBottom: tab === i ? '2px solid #161313' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB 0: INFORMACIÓN ─────────────────────────────────────────── */}
        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Alerta alergias */}
            {alergiasDestacadas && (
              <div style={{ gridColumn: '1 / -1', background: 'rgba(139,58,58,0.04)', border: '1px solid rgba(139,58,58,0.15)', borderLeft: '3px solid rgba(139,58,58,0.4)', borderRadius: '2px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: '#8B3A3A', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontFamily: DM_MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8B3A3A', margin: '0 0 3px' }}>Alerta de alergias</p>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#8B3A3A', margin: 0 }}>{paciente.alergias}</p>
                </div>
              </div>
            )}

            {/* Marketing warning */}
            {!paciente.marketing_aceptado && (
              <div style={{ gridColumn: '1 / -1', background: 'rgba(22,19,19,0.03)', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ti ti-bell-off" style={{ fontSize: '13px', color: 'rgba(22,19,19,0.3)', flexShrink: 0 }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.45)', margin: 0 }}>
                  Esta paciente <strong style={{ fontWeight: 400 }}>no ha dado consentimiento de marketing</strong>. No enviar comunicaciones comerciales.
                </p>
              </div>
            )}

            {/* Datos de contacto */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '24px' }}>
              <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 16px' }}>Datos de contacto</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <i className="ti ti-mail" style={{ fontSize: '14px', color: 'rgba(22,19,19,0.3)' }} />
                <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313' }}>{paciente.email}</span>
              </div>
              {paciente.telefono && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="ti ti-phone" style={{ fontSize: '14px', color: 'rgba(22,19,19,0.3)' }} />
                  <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313' }}>{paciente.telefono}</span>
                </div>
              )}
            </div>

            {/* Ficha clínica */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '24px' }}>
              <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 16px' }}>Ficha clínica</p>
              {[
                { label: 'Tipo de piel',     value: paciente.tipo_piel          ?? '—' },
                { label: 'Alergias',         value: paciente.alergias           ?? '—', highlight: alergiasDestacadas },
                { label: 'Medicamentos',     value: paciente.medicamentos       ?? '—' },
                { label: 'Motivo',           value: paciente.motivo_consulta    ?? '—' },
                { label: 'Cómo nos conoció', value: paciente.como_nos_conocio   ?? '—' },
                { label: 'Paciente desde',   value: formatFecha(paciente.creado_en) },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid rgba(22,19,19,0.05)', marginBottom: '10px', gap: '12px' }}>
                  <span style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: highlight ? '#8B3A3A' : '#161313', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
              {/* Badge riesgo */}
              {(() => {
                const rs = RIESGO_STYLE[paciente.riesgo] ?? RIESGO_STYLE.bajo
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)' }}>Riesgo</span>
                    <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color }}>
                      {rs.label}
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Tratamientos previos */}
            {paciente.tratamientos_previos?.length > 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '24px' }}>
                <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 12px' }}>Tratamientos previos</p>
                <div>
                  {paciente.tratamientos_previos.map(t => (
                    <span
                      key={t}
                      style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '2px', background: 'rgba(22,19,19,0.04)', border: '1px solid rgba(22,19,19,0.08)', color: 'rgba(22,19,19,0.5)', display: 'inline-block', marginRight: '6px', marginBottom: '6px' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 1: SESIONES ────────────────────────────────────────────── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: 0 }}>Historial de sesiones</p>
              <button
                onClick={() => setNuevaSesionAbierta(true)}
                style={{ background: 'none', border: '1px solid rgba(22,19,19,0.15)', borderRadius: '2px', padding: '8px 16px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#161313', cursor: 'pointer' }}
              >
                Nueva sesión
              </button>
            </div>
            {sesiones.length === 0 && (
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', textAlign: 'center', padding: '48px 0', margin: 0 }}>Sin sesiones registradas</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sesiones.map(s => (
                <div key={s.id} style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>{s.tratamiento}</p>
                    <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.35)', flexShrink: 0 }}>{s.fecha}</span>
                  </div>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.45)', margin: '0 0 4px' }}>{s.medico}</p>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.6)', lineHeight: 1.5, margin: 0 }}>{s.nota}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: ANÁLISIS ────────────────────────────────────────────── */}
        {tab === 2 && (
          <FeatureGate feature="dermoscopia_ia">
            <div>
              {analisis.length === 0 && (
                <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', textAlign: 'center', padding: '48px 0', margin: 0 }}>Sin análisis registrados</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analisis.map(a => {
                  const rs = RIESGO_STYLE[a.nivel] ?? RIESGO_STYLE.bajo
                  return (
                    <div key={a.id} style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.35)' }}>{a.fecha}</span>
                        <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color }}>
                          {rs.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                          <p style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', margin: 0, lineHeight: 1 }}>{a.puntuacion}</p>
                          <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', margin: '2px 0 0' }}>/ 9 pts</p>
                        </div>
                        <div style={{ flex: 1, height: '3px', background: 'rgba(22,19,19,0.08)', borderRadius: '2px' }}>
                          <div style={{ width: `${(a.puntuacion / 9) * 100}%`, height: '100%', background: rs.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>{a.criterios_pos}</p>
                          <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', margin: '2px 0 0' }}>criterios +</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => navigate(`/clinica/${slug}/dermoscopia`)}
                  style={{ width: '100%', background: 'none', border: '1px dashed rgba(22,19,19,0.15)', borderRadius: '2px', padding: '12px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', cursor: 'pointer', letterSpacing: '0.06em' }}
                >
                  + Nuevo análisis dermoscópico
                </button>
              </div>
            </div>
          </FeatureGate>
        )}

        {/* ── TAB 3: EVOLUCIÓN ───────────────────────────────────────────── */}
        {tab === 3 && (
          <EvolucionPage
            pacienteIdProp={id}
            readOnly={false}
          />
        )}

      </div>

      {/* ── DRAWER: MENSAJE ────────────────────────────────────────────────── */}
      {msgDrawer && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,19,0.4)', zIndex: 40 }}
            onClick={() => setMsgDrawer(false)}
          />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', background: '#FFFFFF', zIndex: 50, padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: FRAUNCES, fontSize: '18px', fontWeight: 300, color: '#161313', margin: 0 }}>
                Mensaje a {paciente.nombre}
              </h3>
              <button
                onClick={() => setMsgDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', lineHeight: 1, color: 'rgba(22,19,19,0.4)', cursor: 'pointer', padding: 0 }}
              >
                ×
              </button>
            </div>

            {msgEnviado ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <i className="ti ti-circle-check" style={{ fontSize: '32px', color: '#929C92' }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: '#161313', margin: 0 }}>Mensaje enviado</p>
              </div>
            ) : (
              <>
                <textarea
                  value={msgTexto}
                  onChange={e => setMsgTexto(e.target.value)}
                  placeholder={`Escribe un mensaje para ${paciente.nombre}…`}
                  style={{ flex: 1, border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', padding: '14px', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313', resize: 'none', outline: 'none', marginBottom: '12px' }}
                />
                <button
                  onClick={handleEnviarMensaje}
                  disabled={!msgTexto.trim() || enviandoMsg}
                  style={{ background: '#161313', color: '#F7F5F2', border: 'none', width: '100%', padding: '12px', fontFamily: FRAUNCES, fontSize: '14px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: !msgTexto.trim() || enviandoMsg ? 'not-allowed' : 'pointer', opacity: !msgTexto.trim() || enviandoMsg ? 0.4 : 1, borderRadius: '2px' }}
                >
                  {enviandoMsg ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {nuevaSesionAbierta && (
        <NuevaSesionDrawer
          pacienteId={id}
          onClose={() => setNuevaSesionAbierta(false)}
          onGuardado={(nueva) => {
            setSesiones(prev => [nueva, ...prev])
            setTab(1)
          }}
        />
      )}
    </StaffLayout>
  )
}
