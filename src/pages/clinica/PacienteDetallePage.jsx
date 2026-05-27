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

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RIESGO_STYLE = {
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)', label: 'BAJO'     },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)', label: 'MODERADO' },
  alto:     { color: '#8B3A3A', bg: 'rgba(139,58,58,0.08)',   border: 'rgba(139,58,58,0.2)',   label: 'ALTO'     },
}

const TABS = ['Información', 'Sesiones', 'Análisis', 'Evolución', 'Rutina']

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

  const [rutinasPaciente,  setRutinasPaciente]  = useState([])
  const [cargandoRutinas,  setCargandoRutinas]  = useState(false)
  const [creandoRutina,    setCreandoRutina]    = useState(false)
  const [guardandoRutina,  setGuardandoRutina]  = useState(false)
  const [rutinaForm,       setRutinaForm]       = useState({ nombre: '', descripcion: '', periodo: 'ambos' })
  const [pasos,            setPasos]            = useState([
    { nombre_producto: '', instrucciones: '', advertencias: '', momento: 'mañana', frecuencia_dias: 1, orden: 1 },
  ])

  useEffect(() => {
    if (!paciente?.id) return
    setCargandoRutinas(true)
    supabase
      .from('rutinas_paciente')
      .select('id, nombre, descripcion, periodo, activo, asignado_en, medico_id')
      .eq('paciente_id', paciente.id)
      .eq('activo', true)
      .order('asignado_en', { ascending: false })
      .then(({ data }) => {
        setRutinasPaciente(data || [])
        setCargandoRutinas(false)
      })
  }, [paciente])

  async function handleGuardarRutina() {
    if (!rutinaForm.nombre.trim() || !paciente?.id || !user?.id) return
    if (!clinica?.id || !isValidUUID(clinica.id)) {
      console.error('clinica.id no disponible')
      setGuardandoRutina(false)
      return
    }
    setGuardandoRutina(true)
    try {
      const medicoId = await supabase
        .from('medicos')
        .select('id')
        .eq('email', user.email)
        .single()
        .then(r => r.data?.id)

      const { data: rutina, error: rErr } = await supabase
        .from('rutinas_paciente')
        .insert({
          paciente_id: paciente.id,
          clinica_id:  clinica.id,
          medico_id:   medicoId || null,
          nombre:      rutinaForm.nombre.trim(),
          descripcion: rutinaForm.descripcion.trim(),
          periodo:     rutinaForm.periodo,
          activo:      true,
        })
        .select('id, nombre, descripcion, periodo, activo, asignado_en, medico_id')
        .single()
      if (rErr) throw rErr

      const pasosInsert = pasos
        .filter(p => p.nombre_producto.trim())
        .map((p, i) => ({
          rutina_id:        rutina.id,
          orden:            i + 1,
          momento:          p.momento,
          nombre_producto:  p.nombre_producto.trim(),
          instrucciones:    p.instrucciones.trim(),
          advertencias:     p.advertencias.trim() || null,
          frecuencia_dias:  p.frecuencia_dias,
        }))

      if (pasosInsert.length > 0) {
        await supabase.from('pasos_rutina').insert(pasosInsert)
      }

      setRutinasPaciente(prev => [rutina, ...prev])
      setCreandoRutina(false)
      setRutinaForm({ nombre: '', descripcion: '', periodo: 'ambos' })
      setPasos([{ nombre_producto: '', instrucciones: '', advertencias: '', momento: 'mañana', frecuencia_dias: 1, orden: 1 }])
    } catch (err) {
      console.error(err)
    } finally {
      setGuardandoRutina(false)
    }
  }

  async function handleEnviarMensaje() {
    const texto = msgTexto.trim()
    if (!texto || enviandoMsg) return
    setEnviandoMsg(true)
    try {
      if (supabase && isValidUUID(clinica?.id) && paciente?.id) {
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
                    <div key={a.id} style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderLeft: `3px solid ${rs.color}`, borderRadius: '2px', padding: '16px 20px' }}>

                      {/* Fila superior: fecha + confianza IA + badge riesgo */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.35)' }}>{a.fecha}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {a.confianza && (
                            <span style={{ fontFamily: DM_MONO, fontSize: '8px', letterSpacing: '0.08em', color: 'rgba(22,19,19,0.28)', textTransform: 'uppercase' }}>
                              IA · {a.confianza}
                            </span>
                          )}
                          <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color }}>
                            {rs.label}
                          </span>
                        </div>
                      </div>

                      {/* Fila media: miniatura + puntuación + criterios */}
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

                        {/* Miniatura dermoscópica */}
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '2px', flexShrink: 0,
                          background: 'rgba(22,19,19,0.04)',
                          border: '1px solid rgba(22,19,19,0.07)',
                          overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {a.imagen_url ? (
                            <img src={a.imagen_url} alt="Dermoscopia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className="ti ti-microscope" style={{ fontSize: '18px', color: 'rgba(22,19,19,0.15)' }} />
                          )}
                        </div>

                        {/* Puntuación + barra + criterios */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div>
                              <p style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', margin: 0, lineHeight: 1 }}>{a.puntuacion}</p>
                              <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', margin: '2px 0 0' }}>/ 9 pts</p>
                            </div>
                            <div style={{ flex: 1, height: '3px', background: 'rgba(22,19,19,0.08)', borderRadius: '2px' }}>
                              <div style={{ width: `${Math.min((a.puntuacion / 9) * 100, 100)}%`, height: '100%', background: rs.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>{a.criterios_pos}</p>
                              <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', margin: '2px 0 0' }}>criterios +</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Diagnóstico IA */}
                      {a.diagnostico_preliminar && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(22,19,19,0.05)' }}>
                          <p style={{ fontFamily: DM_MONO, fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.25)', margin: '0 0 4px' }}>
                            Diagnóstico IA
                          </p>
                          <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.55)', lineHeight: 1.55, margin: 0 }}>
                            {a.diagnostico_preliminar}
                          </p>
                        </div>
                      )}

                      {/* Alerta urgente */}
                      {a.requiere_atencion_urgente && (
                        <div style={{ marginTop: '10px', padding: '7px 12px', background: 'rgba(139,58,58,0.06)', border: '1px solid rgba(139,58,58,0.15)', borderRadius: '2px' }}>
                          <p style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B3A3A', margin: 0 }}>
                            ⚠ Requiere atención urgente
                          </p>
                        </div>
                      )}
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

        {/* ── TAB 4: RUTINA ──────────────────────────────────────────────── */}
        {tab === 4 && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '18px', fontWeight: 400, color: '#161313' }}>
                Rutinas asignadas
              </span>
              <button
                onClick={() => setCreandoRutina(true)}
                style={{ background: '#161313', color: '#C9D3CA', border: 'none', borderRadius: '2px', padding: '9px 16px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="ti ti-plus" style={{ fontSize: '13px' }} /> Nueva rutina
              </button>
            </div>

            {/* Lista */}
            {cargandoRutinas ? (
              <div style={{ height: '60px', background: 'rgba(22,19,19,0.04)', borderRadius: '2px', marginBottom: '8px' }} />
            ) : rutinasPaciente.length === 0 && !creandoRutina ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <i className="ti ti-notebook" style={{ fontSize: '28px', color: 'rgba(22,19,19,0.15)', display: 'block', marginBottom: '8px' }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: 0 }}>
                  Sin rutinas asignadas
                </p>
              </div>
            ) : (
              rutinasPaciente.map(r => (
                <div key={r.id} style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '16px 20px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: 0 }}>{r.nombre}</p>
                    <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0' }}>
                      {r.periodo} · {r.asignado_en ? new Date(r.asignado_en).toLocaleDateString('es-ES') : '—'}
                    </p>
                  </div>
                  <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: 'rgba(146,156,146,0.1)', color: '#929C92', border: '1px solid rgba(146,156,146,0.2)' }}>
                    ACTIVA
                  </span>
                </div>
              ))
            )}

            {/* Formulario nueva rutina */}
            {creandoRutina && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', padding: '24px', marginTop: '16px' }}>
                <p style={{ fontFamily: FRAUNCES, fontSize: '18px', fontWeight: 400, color: '#161313', margin: '0 0 20px' }}>Nueva rutina</p>

                <label style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', display: 'block', marginBottom: '6px' }}>Nombre de la rutina *</label>
                <input
                  value={rutinaForm.nombre}
                  onChange={e => setRutinaForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Rutina anti-manchas, Protocolo post-tratamiento…"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(22,19,19,0.03)', border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', color: '#161313', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                />

                <label style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea
                  value={rutinaForm.descripcion}
                  onChange={e => setRutinaForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción del protocolo…"
                  rows={2}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(22,19,19,0.03)', border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', color: '#161313', outline: 'none', boxSizing: 'border-box', marginBottom: '16px', resize: 'vertical' }}
                />

                <label style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', display: 'block', marginBottom: '8px' }}>Período</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {['mañana', 'noche', 'ambos'].map(p => (
                    <button
                      key={p}
                      onClick={() => setRutinaForm(f => ({ ...f, periodo: p }))}
                      style={{ padding: '8px 14px', borderRadius: '2px', border: '1px solid', cursor: 'pointer', fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', background: rutinaForm.periodo === p ? '#161313' : 'transparent', color: rutinaForm.periodo === p ? '#C9D3CA' : 'rgba(22,19,19,0.4)', borderColor: rutinaForm.periodo === p ? '#161313' : 'rgba(22,19,19,0.15)' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <p style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 12px' }}>Pasos del protocolo</p>
                {pasos.map((paso, i) => (
                  <div key={i} style={{ border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '16px', marginBottom: '10px', background: 'rgba(22,19,19,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.35)', letterSpacing: '0.1em' }}>PASO {i + 1}</span>
                      {pasos.length > 1 && (
                        <button
                          onClick={() => setPasos(ps => ps.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,19,19,0.3)', fontSize: '14px' }}
                        >✕</button>
                      )}
                    </div>
                    <input
                      value={paso.nombre_producto}
                      onChange={e => setPasos(ps => ps.map((p, j) => j === i ? { ...p, nombre_producto: e.target.value } : p))}
                      placeholder="Nombre del producto *"
                      style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', color: '#161313', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                    />
                    <textarea
                      value={paso.instrucciones}
                      onChange={e => setPasos(ps => ps.map((p, j) => j === i ? { ...p, instrucciones: e.target.value } : p))}
                      placeholder="Instrucciones de uso…"
                      rows={2}
                      style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', color: '#161313', outline: 'none', boxSizing: 'border-box', marginBottom: '8px', resize: 'none' }}
                    />
                    <select
                      value={paso.momento}
                      onChange={e => setPasos(ps => ps.map((p, j) => j === i ? { ...p, momento: e.target.value } : p))}
                      style={{ padding: '7px 10px', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.06em', color: 'rgba(22,19,19,0.6)', background: '#FFFFFF', outline: 'none', textTransform: 'uppercase' }}
                    >
                      <option value="mañana">MAÑANA</option>
                      <option value="noche">NOCHE</option>
                      <option value="ambos">AMBOS</option>
                    </select>
                  </div>
                ))}

                <button
                  onClick={() => setPasos(ps => [...ps, { nombre_producto: '', instrucciones: '', advertencias: '', momento: 'mañana', frecuencia_dias: 1, orden: ps.length + 1 }])}
                  style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed rgba(22,19,19,0.15)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', color: 'rgba(22,19,19,0.4)', cursor: 'pointer', letterSpacing: '0.06em', marginBottom: '20px' }}
                >
                  + Añadir paso
                </button>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setCreandoRutina(false)}
                    style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.4)', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarRutina}
                    disabled={guardandoRutina || !rutinaForm.nombre.trim()}
                    style={{ padding: '10px 20px', background: '#161313', border: 'none', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9D3CA', cursor: 'pointer', opacity: guardandoRutina || !rutinaForm.nombre.trim() ? 0.5 : 1 }}
                  >
                    {guardandoRutina ? 'Guardando…' : 'Guardar rutina'}
                  </button>
                </div>
              </div>
            )}
          </div>
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
