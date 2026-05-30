import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase }  from '../../lib/supabase'
import ClinicLayout  from './ClinicLayout'
import EscribirClinicaDrawer   from '../../components/EscribirClinicaDrawer'
import SolicitarCitaDrawer     from '../../components/SolicitarCitaDrawer'

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

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

  const [paciente,      setPaciente]      = useState(null)
  const [proximaCita,   setProximaCita]   = useState(null)
  const [cargando,      setCargando]      = useState(true)
  const [escribirOpen,  setEscribirOpen]  = useState(false)
  const [solicitarOpen, setSolicitarOpen] = useState(false)

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
      if (!user?.id || !isValidUUID(user.id)) { setCargando(false); return }

      if (!supabase) {
        try {
          const raw = localStorage.getItem('glowai_paciente_mock')
          if (raw && !cancelled) setPaciente(JSON.parse(raw))
        } catch { /* ignore */ }
        if (!cancelled) setCargando(false)
        return
      }

      const [pacRes, citaRes] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('citas').select('*').eq('paciente_id', user.id)
          .gt('fecha', new Date().toISOString()).order('fecha', { ascending: true }).limit(1),
      ])

      if (cancelled) return
      if (pacRes.error)  console.warn('[mi-perfil] paciente:', pacRes.error.message)
      if (citaRes.error) console.warn('[mi-perfil] citas:',    citaRes.error.message)

      setPaciente(pacRes.data)
      setProximaCita((citaRes.data || [])[0] ?? null)
      setCargando(false)
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const nombre = paciente
    ? `${paciente.nombre ?? ''} ${paciente.apellido ?? ''}`.trim()
    : user?.nombre || 'Mi perfil'

  const foto = paciente?.foto_perfil ?? paciente?.foto ?? user?.foto

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

      {/* ── Contenido (fondo crema) ──────────────────────────── */}
      <div style={{
        background:    'var(--vl-page)',
        padding:       '20px 16px 88px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
      }}>

        {/* Próxima cita — única sección de datos en Inicio */}
        <SeccionMiCita
          slug={slug}
          cita={proximaCita}
          onSolicitar={() => setSolicitarOpen(true)}
        />

        {/* Accesos rápidos — navegan a sus tabs propias */}
        <AccesosRapidos slug={slug} navigate={navigate} onEscribir={() => setEscribirOpen(true)} />

      </div>

      {escribirOpen  && <EscribirClinicaDrawer onClose={() => setEscribirOpen(false)} />}
      {solicitarOpen && <SolicitarCitaDrawer   onClose={() => setSolicitarOpen(false)} onGuardado={() => { setSolicitarOpen(false); window.location.reload() }} />}
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
function SeccionMiCita({ slug, cita, onSolicitar }) {
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
          onClick={onSolicitar}
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
//  ACCESOS RÁPIDOS — grid de 4 cards que navegan a sus tabs propias
// ═══════════════════════════════════════════════════════════════════
const ACCESOS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    label:    'Evolución',
    sublabel: 'Fotos antes y después',
    tab:      'evolucion',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    label:    'Rutina',
    sublabel: 'Protocolo y productos',
    tab:      'rutina',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label:    'Chat',
    sublabel: 'Habla con tu médico',
    tab:      'chat',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label:    'Mis datos',
    sublabel: 'Perfil y preferencias',
    tab:      'datos',
  },
]

function AccesosRapidos({ slug, navigate, onEscribir }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p className="vl-section-label" style={{ marginBottom: '4px' }}>Accesos rápidos</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {ACCESOS.map(({ icon, label, sublabel, tab }) => (
          <button
            key={tab}
            onClick={() => navigate(`/clinica/${slug}/mi-perfil/${tab}`)}
            style={{
              background:   '#FFFFFF',
              border:       '1px solid var(--vl-page-border)',
              borderRadius: '2px',
              padding:      '16px',
              display:      'flex',
              flexDirection:'column',
              alignItems:   'flex-start',
              gap:          '10px',
              cursor:       'pointer',
              textAlign:    'left',
              transition:   'var(--vl-transition)',
            }}
          >
            <div style={{ color: 'var(--vl-sage-mid)' }}>{icon}</div>
            <div>
              <p style={{
                margin: '0 0 2px', fontFamily: 'var(--vl-font-body)',
                fontSize: '13px', fontWeight: 400, color: 'var(--vl-carbon)',
              }}>
                {label}
              </p>
              <p style={{
                margin: 0, fontFamily: 'var(--vl-font-body)',
                fontSize: '10px', fontWeight: 300, color: 'var(--vl-sage-mid)',
                letterSpacing: '0.02em',
              }}>
                {sublabel}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Escribir a la clínica */}
      <button
        onClick={onEscribir}
        style={{
          width:        '100%',
          background:   '#FFFFFF',
          border:       '1px solid var(--vl-page-border)',
          borderRadius: '2px',
          padding:      '16px',
          display:      'flex',
          alignItems:   'center',
          gap:          '14px',
          cursor:       'pointer',
          textAlign:    'left',
          transition:   'var(--vl-transition)',
        }}
      >
        <div style={{
          width:36, height:36, borderRadius:'2px',
          border:'1px solid var(--vl-page-border)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="var(--vl-sage-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            margin:0, fontFamily:'var(--vl-font-body)',
            fontSize:'13px', fontWeight:400, color:'var(--vl-carbon)',
          }}>
            Escribir a tu clínica
          </p>
          <p style={{
            margin:'2px 0 0', fontFamily:'var(--vl-font-body)',
            fontSize:'11px', fontWeight:300, color:'var(--vl-sage-mid)',
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
