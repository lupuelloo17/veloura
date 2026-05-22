import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase }  from '../../lib/supabase'
import ClinicLayout  from './ClinicLayout'
import EscribirClinicaDrawer from '../../components/EscribirClinicaDrawer'

const TIPOS_PIEL = ['Seca', 'Grasa', 'Mixta', 'Normal', 'Sensible']

function dateOnly(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
function dateTime(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) +
    ' · ' + dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function MiPerfilPage() {
  const navigate  = useNavigate()
  const { slug }  = useParams()
  const { hash }  = useLocation()
  const { user, logout } = useAuth()
  const { clinica } = useClinic()

  const [paciente,    setPaciente]    = useState(null)
  const [proximaCita, setProximaCita] = useState(null)
  const [sesiones,    setSesiones]    = useState([])
  const [analisis,    setAnalisis]    = useState([])
  const [protocolo,   setProtocolo]   = useState(null)
  const [cargando,    setCargando]    = useState(true)
  const [escribirOpen, setEscribirOpen] = useState(false)

  useEffect(() => {
    if (hash === '#datos') {
      setTimeout(() => {
        document.getElementById('seccion-datos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [hash])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id) { setCargando(false); return }

      if (!supabase) {
        try {
          const raw = localStorage.getItem('glowai_paciente_mock')
          if (raw && !cancelled) setPaciente(JSON.parse(raw))
        } catch { /* ignore */ }
        if (!cancelled) setCargando(false)
        return
      }

      const [pacRes, citaRes, sesRes, anaRes, protRes] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('citas').select('*').eq('paciente_id', user.id)
          .gt('fecha', new Date().toISOString()).order('fecha', { ascending: true }).limit(1),
        supabase.from('sesiones').select('*').eq('paciente_id', user.id)
          .order('fecha', { ascending: false }),
        supabase.from('analisis_dermoscopicos').select('*').eq('paciente_id', user.id)
          .order('fecha', { ascending: false }),
        supabase.from('protocolos').select('*').eq('paciente_id', user.id)
          .eq('activo', true).order('creado_en', { ascending: false }).limit(1),
      ])

      if (cancelled) return
      if (pacRes.error)  console.warn('[mi-perfil] paciente:', pacRes.error.message)
      if (citaRes.error) console.warn('[mi-perfil] citas:',    citaRes.error.message)
      if (sesRes.error)  console.warn('[mi-perfil] sesiones:', sesRes.error.message)
      if (anaRes.error)  console.warn('[mi-perfil] analisis:', anaRes.error.message)
      if (protRes.error) console.warn('[mi-perfil] protocolos:', protRes.error.message)

      setPaciente(pacRes.data)
      setProximaCita((citaRes.data || [])[0] ?? null)
      setSesiones(sesRes.data || [])
      setAnalisis(anaRes.data || [])
      setProtocolo((protRes.data || [])[0] ?? null)
      setCargando(false)
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const nombre = paciente
    ? `${paciente.nombre ?? ''} ${paciente.apellido ?? ''}`.trim()
    : user?.nombre || 'Mi perfil'

  const foto = paciente?.foto_perfil ?? paciente?.foto ?? user?.foto

  const fotosEvolucion = useMemo(() => {
    const items = []
    for (const s of sesiones) {
      const fechaTxt = dateOnly(s.fecha)
      ;(s.fotos_antes ?? []).forEach(url => items.push({ url, tipo: 'antes', fecha: fechaTxt, sesion: s.tratamiento || s.tipo_tratamiento }))
      ;(s.fotos_despues ?? []).forEach(url => items.push({ url, tipo: 'después', fecha: fechaTxt, sesion: s.tratamiento || s.tipo_tratamiento }))
    }
    return items
  }, [sesiones])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  // ── Loading ──────────────────────────────────────────────────
  if (cargando) {
    return (
      <ClinicLayout>
        <div style={{ background: 'var(--vl-carbon)', padding: '32px 24px 28px' }}>
          <div className="vl-skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }} />
          <div className="vl-skeleton" style={{ width: '140px', height: '20px', borderRadius: '2px', margin: '0 auto 8px' }} />
          <div className="vl-skeleton" style={{ width: '100px', height: '12px', borderRadius: '2px', margin: '0 auto' }} />
        </div>
        <div style={{ background: 'var(--vl-page)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="vl-skeleton" style={{ height: '100px', borderRadius: '2px' }} />
          ))}
        </div>
      </ClinicLayout>
    )
  }

  return (
    <ClinicLayout>

      {/* ── Hero oscuro ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--vl-carbon)',
        padding:    '32px 24px 28px',
        position:   'relative',
        overflow:   'hidden',
        textAlign:  'center',
      }}>
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.06)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          width: '120px', height: '120px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.04)',
          pointerEvents: 'none',
        }} />

        {/* Botón logout */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            position:       'absolute',
            top:            '20px',
            right:          '20px',
            width:          '32px',
            height:         '32px',
            borderRadius:   '50%',
            border:         '1px solid rgba(201,211,202,0.15)',
            background:     'rgba(255,255,255,0.04)',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         2,
          }}
        >
          {/* Icono logout */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="rgba(201,211,202,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <AvatarEditable foto={foto} nombre={nombre} paciente={paciente} setPaciente={setPaciente} />
        </div>

        {/* Nombre */}
        <h1 style={{
          margin:        '0 0 6px',
          fontFamily:    'var(--vl-font-display)',
          fontSize:      '28px',
          fontWeight:    400,
          letterSpacing: '-0.02em',
          color:         'var(--vl-page)',
          lineHeight:    1.1,
        }}>
          {nombre}
        </h1>

        {paciente?.creado_en && (
          <p style={{
            margin:        '0 0 14px',
            fontFamily:    'var(--vl-font-body)',
            fontSize:      '10px',
            fontWeight:    300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.28)',
          }}>
            Miembro desde {dateOnly(paciente.creado_en)}
          </p>
        )}

        {clinica?.plan && (
          <span className="vl-badge-dark">
            Plan {clinica.plan.charAt(0).toUpperCase() + clinica.plan.slice(1)}
          </span>
        )}
      </div>

      {/* ── Secciones (fondo crema) ─────────────────────────── */}
      <div style={{
        background:    'var(--vl-page)',
        padding:       '20px 16px 80px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
      }}>

        <SeccionMiCita   slug={slug} cita={proximaCita} />
        <SeccionEvolucion fotosEvolucion={fotosEvolucion} />
        <SeccionAnalisis  slug={slug} analisis={analisis} navigate={navigate} />
        <SeccionProtocolo protocolo={protocolo} setProtocolo={setProtocolo} />

        {/* Escribir a la clínica */}
        <button
          onClick={() => setEscribirOpen(true)}
          style={{
            width:         '100%',
            background:    '#FFFFFF',
            border:        '1px solid var(--vl-page-border)',
            borderRadius:  '2px',
            padding:       '16px',
            display:       'flex',
            alignItems:    'center',
            gap:           '14px',
            cursor:        'pointer',
            textAlign:     'left',
            transition:    'var(--vl-transition)',
          }}
        >
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   '2px',
            border:         '1px solid var(--vl-page-border)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="var(--vl-sage-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontFamily: 'var(--vl-font-body)',
              fontSize: '13px', fontWeight: 400, color: 'var(--vl-carbon)',
            }}>
              Escribir a tu clínica
            </p>
            <p style={{
              margin: '2px 0 0', fontFamily: 'var(--vl-font-body)',
              fontSize: '11px', fontWeight: 300, color: 'var(--vl-sage-mid)',
            }}>
              Mensaje directo por email
            </p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="var(--vl-page-border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

      </div>

      {escribirOpen && <EscribirClinicaDrawer onClose={() => setEscribirOpen(false)} />}
    </ClinicLayout>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  AVATAR EDITABLE
// ═══════════════════════════════════════════════════════════════════
function AvatarEditable({ foto, nombre, paciente, setPaciente }) {
  const fileRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!supabase || !paciente?.id) return
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5 MB'); return }

    setSubiendo(true)
    try {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${paciente.id}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatares')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('avatares').getPublicUrl(path)
      const fotoUrl = pub.publicUrl
      await supabase.from('pacientes').update({ foto_perfil: fotoUrl }).eq('id', paciente.id)
      setPaciente(p => ({ ...p, foto_perfil: fotoUrl }))
    } catch (err) {
      alert('Error subiendo foto: ' + err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {foto ? (
        <img
          src={foto}
          alt={nombre}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(201,211,202,0.2)',
          }}
        />
      ) : (
        <div
          className="vl-avatar-dark"
          style={{ width: 80, height: 80, fontSize: 28 }}
        >
          {(nombre?.[0] ?? 'M').toUpperCase()}
        </div>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={subiendo}
        title="Cambiar foto"
        style={{
          position:       'absolute',
          bottom:         0,
          right:          0,
          width:          26,
          height:         26,
          borderRadius:   '50%',
          border:         '2px solid var(--vl-carbon)',
          background:     'var(--vl-sage)',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="var(--vl-carbon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {subiendo && (
        <p style={{
          position:    'absolute',
          bottom:      '-20px',
          left:        '50%',
          transform:   'translateX(-50%)',
          fontSize:    '9px',
          fontWeight:  300,
          color:       'rgba(255,255,255,0.4)',
          whiteSpace:  'nowrap',
          letterSpacing: '0.06em',
        }}>
          Subiendo…
        </p>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  SECCIÓN: Mi próxima cita
// ═══════════════════════════════════════════════════════════════════
function SeccionMiCita({ slug, cita }) {
  if (!cita) {
    return (
      <VlCard>
        <p className="vl-section-label" style={{ marginBottom: '12px' }}>Próxima cita</p>
        <p style={{
          margin: '0 0 16px', fontFamily: 'var(--vl-font-body)',
          fontSize: '13px', fontWeight: 300, color: 'var(--vl-sage-mid)', lineHeight: 1.6,
        }}>
          Aún no tienes ninguna cita programada. Solicita una a tu clínica.
        </p>
        <button
          className="vl-btn-primary"
          style={{ width: '100%' }}
          onClick={() => alert('Para solicitar una cita, contacta con tu clínica.\n(Pronto disponible desde aquí)')}
        >
          Solicitar cita
        </button>
      </VlCard>
    )
  }

  const fecha = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
  const ahora = new Date()
  const horasRestantes = (fecha - ahora) / (1000 * 60 * 60)
  const puedeCancelar  = horasRestantes >= 24

  function handleAgregarCalendario() {
    const dtStart = fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const dtEnd   = new Date(fecha.getTime() + (cita.duracion_minutos || 30) * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:cita-${cita.id}@glowai\nDTSTAMP:${dtStart}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${cita.tratamiento || 'Cita estética'}\nDESCRIPTION:Con ${cita.medico_nombre || 'tu médico'}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `cita-${cita.id}.ics`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function handleCancelar() {
    if (!supabase) return alert('Modo demo: no se puede cancelar.')
    if (!confirm('¿Cancelar esta cita? Tu clínica recibirá la notificación.')) return
    const { error } = await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id)
    if (error) return alert('Error: ' + error.message)
    location.reload()
  }

  return (
    <VlCard>
      <p className="vl-section-label" style={{ marginBottom: '14px' }}>Próxima cita</p>

      <div style={{
        borderLeft:  '2px solid var(--vl-sage-mid)',
        paddingLeft: '14px',
        marginBottom: '16px',
      }}>
        <p style={{
          margin: '0 0 4px', fontFamily: 'var(--vl-font-body)',
          fontSize: '14px', fontWeight: 400, color: 'var(--vl-carbon)',
        }}>
          {cita.tratamiento}
        </p>
        <p style={{
          margin: '0 0 2px', fontFamily: 'var(--vl-font-body)',
          fontSize: '12px', fontWeight: 300, color: 'var(--vl-sage-mid)',
          letterSpacing: '0.02em',
        }}>
          {dateTime(fecha)}
        </p>
        <p style={{
          margin: 0, fontFamily: 'var(--vl-font-body)',
          fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)',
          letterSpacing: '0.04em',
        }}>
          Con {cita.medico_nombre || 'tu médico'} · {cita.duracion_minutos} min
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button onClick={handleAgregarCalendario} className="vl-btn-secondary">
          + Calendario
        </button>
        <button
          onClick={handleCancelar}
          disabled={!puedeCancelar}
          style={{
            padding:       '10px 0',
            border:        `1px solid ${puedeCancelar ? 'var(--vl-taupe)' : 'var(--vl-page-border)'}`,
            borderRadius:  '2px',
            background:    'transparent',
            fontFamily:    'var(--vl-font-body)',
            fontSize:      '11px',
            fontWeight:    300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         puedeCancelar ? 'var(--vl-taupe)' : 'rgba(22,19,19,0.25)',
            cursor:        puedeCancelar ? 'pointer' : 'not-allowed',
            transition:    'var(--vl-transition)',
          }}
          title={puedeCancelar ? 'Cancelar' : 'No se puede cancelar con menos de 24h'}
        >
          Cancelar
        </button>
      </div>
    </VlCard>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  SECCIÓN: Mi evolución
// ═══════════════════════════════════════════════════════════════════
function SeccionEvolucion({ fotosEvolucion }) {
  return (
    <VlCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p className="vl-section-label" style={{ margin: 0 }}>Mi evolución</p>
        <button
          className="vl-btn-secondary"
          style={{ padding: '6px 12px', fontSize: '10px' }}
          onClick={() => alert('Próximamente: subir foto desde la cámara.')}
        >
          + Foto
        </button>
      </div>

      {fotosEvolucion.length === 0 ? (
        <p style={{
          margin: 0, fontFamily: 'var(--vl-font-body)',
          fontSize: '13px', fontWeight: 300, color: 'var(--vl-sage-mid)', lineHeight: 1.6,
        }}>
          Cuando comiences un tratamiento, tu médico subirá fotos de antes y después para que veas tu progreso.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {fotosEvolucion.slice(0, 9).map((f, i) => (
            <div key={i} style={{
              position: 'relative', aspectRatio: '1', borderRadius: '2px',
              overflow: 'hidden', background: 'var(--vl-page-dark)',
            }}>
              <img src={f.url} alt={f.tipo}
                   style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                   loading="lazy" />
              <span style={{
                position: 'absolute', top: '4px', left: '4px',
                background: 'rgba(22,19,19,0.65)', color: 'var(--vl-sage)',
                fontSize: '8px', fontWeight: 300, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '2px 6px',
              }}>
                {f.tipo}
              </span>
              <span style={{
                position: 'absolute', bottom: '4px', right: '4px',
                background: 'rgba(22,19,19,0.55)', color: 'rgba(247,245,242,0.7)',
                fontSize: '8px', fontWeight: 300, padding: '1px 4px',
              }}>
                {f.fecha}
              </span>
            </div>
          ))}
        </div>
      )}
    </VlCard>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  SECCIÓN: Mis análisis
// ═══════════════════════════════════════════════════════════════════
const RIESGO_STYLE = {
  bajo:     { color: 'var(--vl-sage-mid)',  label: 'Bajo' },
  moderado: { color: '#D4A94A',             label: 'Moderado' },
  alto:     { color: 'var(--vl-taupe)',     label: 'Alto' },
}

function SeccionAnalisis({ slug, analisis, navigate }) {
  return (
    <VlCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p className="vl-section-label" style={{ margin: 0 }}>Mis análisis</p>
        <button
          className="vl-btn-secondary"
          style={{ padding: '6px 12px', fontSize: '10px' }}
          onClick={() => navigate(`/clinica/${slug}/analisis`)}
        >
          + Nuevo
        </button>
      </div>

      {analisis.length === 0 ? (
        <p style={{
          margin: 0, fontFamily: 'var(--vl-font-body)',
          fontSize: '13px', fontWeight: 300, color: 'var(--vl-sage-mid)', lineHeight: 1.6,
        }}>
          Cuando completes un análisis, aparecerá aquí con tu puntuación y nivel de riesgo.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {analisis.slice(0, 5).map((a, idx) => {
            const nivel = (a.nivel_riesgo ?? a.nivel ?? 'bajo').toLowerCase()
            const rs    = RIESGO_STYLE[nivel] ?? RIESGO_STYLE.bajo
            const punt  = a.puntuacion_total ?? a.puntuacion ?? 0
            return (
              <button
                key={a.id}
                onClick={() => alert(`Ver informe completo del análisis ${a.id}\n(Próximamente)`)}
                style={{
                  width:         '100%',
                  background:    'transparent',
                  border:        'none',
                  borderTop:     idx > 0 ? '1px solid var(--vl-page-border)' : 'none',
                  padding:       '12px 0',
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '12px',
                  cursor:        'pointer',
                  textAlign:     'left',
                }}
              >
                {a.imagen_url ? (
                  <img src={a.imagen_url} alt=""
                       style={{ width: 40, height: 40, borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: '2px',
                    border: '1px solid var(--vl-page-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="var(--vl-sage-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 2px', fontFamily: 'var(--vl-font-body)',
                    fontSize: '12px', fontWeight: 400, color: 'var(--vl-carbon)',
                  }}>
                    {dateOnly(a.fecha)}
                  </p>
                  <p style={{
                    margin: 0, fontFamily: 'var(--vl-font-body)',
                    fontSize: '11px', fontWeight: 300, color: 'var(--vl-sage-mid)',
                  }}>
                    Puntuación <strong style={{ color: 'var(--vl-carbon)' }}>{punt}/9</strong>
                  </p>
                </div>
                <span style={{
                  fontFamily:    'var(--vl-font-body)',
                  fontSize:      '10px',
                  fontWeight:    300,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color:         rs.color,
                  flexShrink:    0,
                }}>
                  {rs.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </VlCard>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  SECCIÓN: Mi protocolo activo
// ═══════════════════════════════════════════════════════════════════
function SeccionProtocolo({ protocolo, setProtocolo }) {
  if (!protocolo) {
    return (
      <VlCard>
        <p className="vl-section-label" style={{ marginBottom: '12px' }}>Mi protocolo</p>
        <p style={{
          margin: 0, fontFamily: 'var(--vl-font-body)',
          fontSize: '13px', fontWeight: 300, color: 'var(--vl-sage-mid)', lineHeight: 1.6,
        }}>
          Tu médico aún no te ha asignado un protocolo. Cuando lo haga, verás aquí los pasos a seguir y los productos recomendados.
        </p>
      </VlCard>
    )
  }

  const pasos    = Array.isArray(protocolo.pasos)    ? protocolo.pasos    : []
  const productos = Array.isArray(protocolo.productos) ? protocolo.productos : []
  const completados = pasos.filter(p => p.completado).length
  const progreso    = pasos.length > 0 ? Math.round((completados / pasos.length) * 100) : 0

  async function togglePaso(idx) {
    const nuevos = pasos.map((p, i) =>
      i === idx
        ? { ...p, completado: !p.completado, fecha_completado: !p.completado ? new Date().toISOString() : null }
        : p
    )
    setProtocolo({ ...protocolo, pasos: nuevos })
    if (supabase) {
      await supabase.from('protocolos').update({ pasos: nuevos, actualizado_en: new Date().toISOString() }).eq('id', protocolo.id)
    }
  }

  return (
    <VlCard>
      <p className="vl-section-label" style={{ marginBottom: '4px' }}>
        {protocolo.nombre || 'Mi protocolo'}
      </p>
      {protocolo.descripcion && (
        <p style={{
          margin: '0 0 14px', fontFamily: 'var(--vl-font-body)',
          fontSize: '13px', fontWeight: 300, color: 'var(--vl-sage-mid)', lineHeight: 1.6,
        }}>
          {protocolo.descripcion}
        </p>
      )}

      {/* Barra de progreso */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{
            fontFamily: 'var(--vl-font-body)', fontSize: '10px', fontWeight: 300,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--vl-sage-mid)',
          }}>
            Progreso semanal
          </span>
          <span style={{
            fontFamily: 'var(--vl-font-body)', fontSize: '10px', fontWeight: 400,
            color: 'var(--vl-carbon)',
          }}>
            {completados}/{pasos.length}
          </span>
        </div>
        <div className="vl-progress-bar-dark">
          <div className="vl-progress-fill-dark" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: productos.length > 0 ? '16px' : '0' }}>
        {pasos.map((p, i) => (
          <button
            key={p.id ?? i}
            onClick={() => togglePaso(i)}
            style={{
              width:       '100%',
              background:  'transparent',
              border:      'none',
              padding:     '8px 0',
              display:     'flex',
              alignItems:  'flex-start',
              gap:         '12px',
              cursor:      'pointer',
              textAlign:   'left',
              borderBottom: i < pasos.length - 1 ? '1px solid var(--vl-page-border)' : 'none',
            }}
          >
            {/* Checkbox editorial */}
            <div style={{
              flexShrink:     0,
              marginTop:      '2px',
              width:          '14px',
              height:         '14px',
              borderRadius:   '2px',
              border:         `1px solid ${p.completado ? 'var(--vl-carbon)' : 'var(--vl-page-border)'}`,
              background:     p.completado ? 'var(--vl-carbon)' : 'transparent',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     'var(--vl-transition)',
            }}>
              {p.completado && (
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"
                     stroke="var(--vl-sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontFamily: 'var(--vl-font-body)',
                fontSize: '13px', fontWeight: 300, lineHeight: 1.5,
                color: p.completado ? 'var(--vl-sage-mid)' : 'var(--vl-carbon)',
                textDecoration: p.completado ? 'line-through' : 'none',
              }}>
                {p.texto}
              </p>
              {p.frecuencia && (
                <p style={{
                  margin: '2px 0 0', fontFamily: 'var(--vl-font-body)',
                  fontSize: '10px', fontWeight: 300, color: 'rgba(22,19,19,0.35)',
                  letterSpacing: '0.06em',
                }}>
                  {p.frecuencia}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Productos recomendados */}
      {productos.length > 0 && (
        <div>
          <p className="vl-section-label" style={{ marginBottom: '10px' }}>Productos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productos.map((prod, i) => (
              <div key={i} style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                padding:      '12px',
                border:       '1px solid var(--vl-page-border)',
                borderRadius: '2px',
                background:   '#FFFFFF',
              }}>
                {prod.foto_url ? (
                  <img src={prod.foto_url} alt={prod.nombre}
                       style={{ width: 44, height: 44, borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: '2px',
                    border: '1px solid var(--vl-page-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="var(--vl-page-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {prod.marca && (
                    <p style={{
                      margin: '0 0 2px', fontFamily: 'var(--vl-font-body)',
                      fontSize: '9px', fontWeight: 300, letterSpacing: '0.15em',
                      textTransform: 'uppercase', color: 'var(--vl-sage-mid)',
                    }}>
                      {prod.marca}
                    </p>
                  )}
                  <p style={{
                    margin: 0, fontFamily: 'var(--vl-font-body)',
                    fontSize: '12px', fontWeight: 400, color: 'var(--vl-carbon)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {prod.nombre}
                  </p>
                  {prod.descripcion && (
                    <p style={{
                      margin: '2px 0 0', fontFamily: 'var(--vl-font-body)',
                      fontSize: '11px', fontWeight: 300, color: 'var(--vl-sage-mid)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {prod.descripcion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </VlCard>
  )
}


// ═══════════════════════════════════════════════════════════════════
//  COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════
function VlCard({ children, id }) {
  return (
    <div id={id} style={{
      background:   '#FFFFFF',
      border:       '1px solid var(--vl-page-border)',
      borderRadius: '2px',
      padding:      '20px',
    }}>
      {children}
    </div>
  )
}
