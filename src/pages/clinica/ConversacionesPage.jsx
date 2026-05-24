import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
import { useClinic } from '../../contexts/ClinicContext'
import { supabase } from '../../lib/supabase'
import StaffLayout from './StaffLayout'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

// ── Mock data ────────────────────────────────────────────────────────────────
const NOW = Date.now()
const MOCK_CONVERSACIONES = [
  {
    paciente_id: 'p1', nombre: 'Sofía', apellido: 'Restrepo',
    foto_perfil: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face',
    ultimo_msg: '¡Muchas gracias Dra! Los resultados son increíbles 😊',
    ultimo_msg_at: new Date(NOW - 1800000).toISOString(),
    no_leidos: 2, remitente_es_paciente: true,
  },
  {
    paciente_id: 'p2', nombre: 'Lucía', apellido: 'Fernández',
    foto_perfil: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face',
    ultimo_msg: 'Cita confirmada para el martes',
    ultimo_msg_at: new Date(NOW - 3 * 86400000).toISOString(),
    no_leidos: 0, remitente_es_paciente: false,
  },
  {
    paciente_id: 'p3', nombre: 'Carmen', apellido: 'López',
    foto_perfil: null,
    ultimo_msg: '¿Cuándo puedo hacer el análisis de nuevo?',
    ultimo_msg_at: new Date(NOW - 7 * 86400000).toISOString(),
    no_leidos: 1, remitente_es_paciente: true,
  },
]
const MOCK_MENSAJES_P1 = [
  { id: '1', remitente_id: 'medico', destinatario_id: 'p1', contenido: 'Hola Sofía, ¿cómo te encuentras después del tratamiento?', tipo: 'texto', leido: true, creado_en: new Date(NOW - 2 * 86400000).toISOString() },
  { id: '2', remitente_id: 'p1',    destinatario_id: 'p1', contenido: 'Muy bien! Me encanta el resultado', tipo: 'texto', leido: true, creado_en: new Date(NOW - 2 * 86400000 + 600000).toISOString() },
  { id: '3', remitente_id: 'medico', destinatario_id: 'p1', contenido: null, tipo: 'recordatorio', leido: true, creado_en: new Date(NOW - 86400000).toISOString(),
    metadata: { tipo_cita: 'Revisión Botox', fecha: 'jue 15 jun · 11:00', medico: 'Dra. García' } },
  { id: '4', remitente_id: 'p1',    destinatario_id: 'p1', contenido: '¡Muchas gracias Dra! Los resultados son increíbles 😊', tipo: 'texto', leido: false, creado_en: new Date(NOW - 1800000).toISOString() },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtRelativo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000)         return 'Ahora'
  if (diff < 3600000)       return `${Math.floor(diff / 60000)} min`
  if (diff < 86400000)      return fmtHora(iso)
  if (diff < 7 * 86400000)  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short' })
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function fmtDia(iso) {
  const d    = new Date(iso)
  const diff = new Date().setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)
  if (diff <= 0)        return 'Hoy'
  if (diff <= 86400000) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
function groupByDay(msgs) {
  const result = []; let lastDia = null
  for (const m of msgs) {
    const dia = fmtDia(m.creado_en)
    if (dia !== lastDia) { result.push({ _div: true, label: dia, key: `d-${m.creado_en}` }); lastDia = dia }
    result.push(m)
  }
  return result
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ConversacionesPage() {
  const { slug }    = useParams()
  const { user }    = useAuth()
  const { clinica } = useClinic()

  const [conversaciones,  setConversaciones]  = useState([])
  const [seleccionado,    setSeleccionado]    = useState(null)
  const [mensajes,        setMensajes]        = useState([])
  const [busqueda,        setBusqueda]        = useState('')
  const [texto,           setTexto]           = useState('')
  const [enviando,        setEnviando]        = useState(false)
  const [cargandoLista,   setCargandoLista]   = useState(true)
  const [cargandoChat,    setCargandoChat]    = useState(false)
  const [escribiendo,     setEscribiendo]     = useState(false)

  const bottomRef   = useRef(null)
  const channelRef  = useRef(null)
  const typingTimer = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { cargarLista() }, [user?.clinica_id])

  useEffect(() => {
    if (seleccionado) cargarChat(seleccionado.paciente_id)
    return () => {
      channelRef.current?.unsubscribe()
      clearTimeout(typingTimer.current)
    }
  }, [seleccionado?.paciente_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [mensajes.length])

  // ── Cargar lista de conversaciones ────────────────────────────────────────
  async function cargarLista() {
    if (!supabase) {
      setConversaciones(MOCK_CONVERSACIONES)
      setCargandoLista(false)
      return
    }
    const isMedico = user?.rol === 'medico'
    let query = supabase
      .from('mensajes')
      .select('destinatario_id, contenido, creado_en, remitente_id, leido, pacientes(nombre,apellido,foto_perfil)')
      .order('creado_en', { ascending: false })
    if (isMedico) {
      query = query.or(`remitente_id.eq.${user.id},destinatario_usuario_id.eq.${user.id}`)
    } else {
      query = query.eq('clinica_id', user.clinica_id)
    }
    const { data: msgs } = await query
    if (!msgs) { setCargandoLista(false); return }
    const porPaciente = {}
    for (const m of msgs) {
      const pid = m.destinatario_id
      if (!porPaciente[pid]) {
        porPaciente[pid] = {
          paciente_id: pid,
          nombre:   m.pacientes?.nombre   ?? 'Paciente',
          apellido: m.pacientes?.apellido ?? '',
          foto_perfil: m.pacientes?.foto_perfil ?? null,
          ultimo_msg:    m.contenido,
          ultimo_msg_at: m.creado_en,
          remitente_es_paciente: m.remitente_id === pid,
          no_leidos: 0,
        }
      }
      if (m.remitente_id === pid && !m.leido) porPaciente[pid].no_leidos++
    }
    setConversaciones(Object.values(porPaciente))
    setCargandoLista(false)
  }

  // ── Cargar chat de un paciente ────────────────────────────────────────────
  async function cargarChat(pacienteId) {
    channelRef.current?.unsubscribe()
    setCargandoChat(true)
    setMensajes([])
    if (!supabase) {
      setMensajes(pacienteId === 'p1' ? MOCK_MENSAJES_P1 : [])
      setCargandoChat(false)
      return
    }
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('clinica_id', user.clinica_id)
      .eq('destinatario_id', pacienteId)
      .order('creado_en', { ascending: true })
    setMensajes(data ?? [])
    setCargandoChat(false)
    const noLeidos = (data ?? []).filter(m => !m.leido && m.remitente_id !== user.id)
    if (noLeidos.length > 0) {
      await supabase
        .from('mensajes')
        .update({ leido: true, fecha_lectura: new Date().toISOString() })
        .in('id', noLeidos.map(m => m.id))
      setConversaciones(prev =>
        prev.map(c => c.paciente_id === pacienteId ? { ...c, no_leidos: 0 } : c)
      )
    }
    const ch = supabase
      .channel(`chat-staff-${pacienteId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `destinatario_id=eq.${pacienteId}`,
      }, (payload) => {
        if (payload.new.remitente_id === user?.id) return
        setMensajes(prev => [...prev, payload.new])
        setConversaciones(prev =>
          prev.map(c =>
            c.paciente_id === pacienteId
              ? { ...c, ultimo_msg: payload.new.contenido, ultimo_msg_at: payload.new.creado_en }
              : c
          )
        )
      })
      .on('broadcast', { event: 'typing' }, () => {
        setEscribiendo(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setEscribiendo(false), 3000)
      })
      .subscribe()
    channelRef.current = ch
  }

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  async function handleEnviar() {
    const msg = texto.trim()
    if (!msg || enviando || !seleccionado) return
    setTexto('')
    setEnviando(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      if (!supabase || !isValidUUID(clinica?.id)) {
        const nuevo = {
          id: `local-${Date.now()}`,
          remitente_id: user.id, destinatario_id: seleccionado.paciente_id,
          contenido: msg, tipo: 'texto', leido: false,
          creado_en: new Date().toISOString(),
        }
        setMensajes(prev => [...prev, nuevo])
        setConversaciones(prev =>
          prev.map(c =>
            c.paciente_id === seleccionado.paciente_id
              ? { ...c, ultimo_msg: msg, ultimo_msg_at: nuevo.creado_en, remitente_es_paciente: false }
              : c
          )
        )
        return
      }
      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          clinica_id:      user.clinica_id,
          remitente_id:    user.id,
          destinatario_id: seleccionado.paciente_id,
          contenido:       msg,
          tipo:            'texto',
        })
        .select()
        .single()
      if (error) throw error
      setMensajes(prev => [...prev, data])
      setConversaciones(prev =>
        prev.map(c =>
          c.paciente_id === seleccionado.paciente_id
            ? { ...c, ultimo_msg: msg, ultimo_msg_at: data.creado_en, remitente_es_paciente: false }
            : c
        )
      )
      channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
    } catch (err) {
      alert('Error: ' + err.message)
      setTexto(msg)
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
  }
  function handleTextareaChange(e) {
    setTexto(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
  }

  const conversacionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return conversaciones
    const q = busqueda.toLowerCase()
    return conversaciones.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q)
    )
  }, [conversaciones, busqueda])

  const mensajesConDia = useMemo(() => groupByDay(mensajes), [mensajes])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <StaffLayout>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* ── PANEL IZQUIERDO — Lista ──────────────────────────────────── */}
        <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid rgba(22,19,19,0.08)', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>

          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(22,19,19,0.06)' }}>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: '18px', fontWeight: 400, color: '#161313', margin: '0 0 12px' }}>
              Mensajes
            </h1>
            {/* Búsqueda */}
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'rgba(22,19,19,0.25)' }} />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar paciente…"
                style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'rgba(22,19,19,0.03)', border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cargandoLista ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(22,19,19,0.08)', borderTopColor: '#929C92', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <i className="ti ti-message" style={{ fontSize: '28px', color: 'rgba(22,19,19,0.12)', display: 'block', marginBottom: '8px' }} />
                <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: 0 }}>
                  {busqueda ? 'Sin resultados' : 'Sin conversaciones todavía'}
                </p>
              </div>
            ) : (
              conversacionesFiltradas.map(conv => {
                const isActive = seleccionado?.paciente_id === conv.paciente_id
                const iniciales = `${conv.nombre?.[0] ?? ''}${conv.apellido?.[0] ?? ''}`
                return (
                  <div
                    key={conv.paciente_id}
                    onClick={() => setSeleccionado(conv)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(22,19,19,0.04)',
                      borderLeft: isActive ? '2px solid #929C92' : '2px solid transparent',
                      background: isActive ? 'rgba(22,19,19,0.03)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(22,19,19,0.08)' }}>
                      {conv.foto_perfil ? (
                        <img src={conv.foto_perfil} alt={conv.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'rgba(22,19,19,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: FRAUNCES, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>{iniciales}</span>
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                        <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.nombre} {conv.apellido}
                        </span>
                        <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', flexShrink: 0, marginLeft: '8px' }}>
                          {fmtRelativo(conv.ultimo_msg_at)}
                        </span>
                      </div>
                      <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: conv.no_leidos > 0 ? 'rgba(22,19,19,0.65)' : 'rgba(22,19,19,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {conv.ultimo_msg ?? '📎 Foto'}
                      </p>
                      {conv.no_leidos > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#161313', marginTop: '4px' }}>
                          <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: '#C9D3CA' }}>
                            {conv.no_leidos > 9 ? '9+' : conv.no_leidos}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO — Chat ─────────────────────────────────────── */}
        {!seleccionado ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
            <i className="ti ti-message" style={{ fontSize: '32px', color: 'rgba(22,19,19,0.12)', display: 'block', marginBottom: '12px' }} />
            <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
              Selecciona una conversación
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F7F5F2', overflow: 'hidden' }}>

            {/* Header chat */}
            <div style={{ background: '#FFFFFF', padding: '16px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              {/* Avatar */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(22,19,19,0.08)' }}>
                {seleccionado.foto_perfil ? (
                  <img src={seleccionado.foto_perfil} alt={seleccionado.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'rgba(22,19,19,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: FRAUNCES, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>
                      {seleccionado.nombre?.[0]}{seleccionado.apellido?.[0] ?? ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0, lineHeight: 1.3 }}>
                  {seleccionado.nombre} {seleccionado.apellido}
                </p>
                <p style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: escribiendo ? '#929C92' : 'rgba(22,19,19,0.35)', margin: '1px 0 0', height: '16px' }}>
                  {escribiendo ? 'escribiendo…' : 'Paciente'}
                </p>
              </div>

              {/* Acciones rápidas */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ti-calendar', 'ti-microscope', 'ti-pill'].map(icon => (
                  <button
                    key={icon}
                    style={{ width: '32px', height: '32px', borderRadius: '2px', border: '1px solid rgba(22,19,19,0.1)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <i className={`ti ${icon}`} style={{ fontSize: '15px', color: 'rgba(22,19,19,0.4)' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Área de mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
              {cargandoChat ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(22,19,19,0.08)', borderTopColor: '#929C92', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                <>
                  {mensajesConDia.map(item =>
                    item._div ? (
                      <div key={item.key} style={{ textAlign: 'center', margin: '16px 0' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)' }}>
                          {item.label}
                        </span>
                      </div>
                    ) : (
                      <BurbujaStaff
                        key={item.id}
                        msg={item}
                        esMio={item.remitente_id === user?.id}
                        pacienteId={seleccionado?.paciente_id}
                      />
                    )
                  )}

                  {/* Typing dots */}
                  {escribiendo && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '12px' }}>
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(22,19,19,0.25)', display: 'inline-block', animation: `bounce 1s ease-in-out ${i * 150}ms infinite` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} style={{ height: '4px' }} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ background: '#FFFFFF', borderTop: '1px solid rgba(22,19,19,0.06)', padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexShrink: 0 }}>
              <textarea
                ref={textareaRef}
                value={texto}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje…"
                rows={1}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(22,19,19,0.03)', border: '1px solid rgba(22,19,19,0.08)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313', resize: 'none', outline: 'none', maxHeight: '120px', lineHeight: 1.5 }}
              />
              <button
                onClick={handleEnviar}
                disabled={!texto.trim() || enviando}
                style={{ width: '36px', height: '36px', borderRadius: '2px', background: '#161313', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !texto.trim() || enviando ? 'not-allowed' : 'pointer', opacity: !texto.trim() || enviando ? 0.4 : 1, flexShrink: 0 }}
              >
                <i className="ti ti-send" style={{ fontSize: '14px', color: '#C9D3CA' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  )
}

// ── BurbujaStaff ─────────────────────────────────────────────────────────────
function BurbujaStaff({ msg, esMio, pacienteId }) {
  const hora = fmtHora(msg.creado_en)

  // Tarjeta recordatorio de cita
  if (msg.tipo === 'recordatorio' && msg.metadata) {
    return (
      <div style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
        <div style={{ maxWidth: '68%', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <i className="ti ti-calendar" style={{ fontSize: '13px', color: '#929C92' }} />
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0 }}>Cita confirmada</p>
            </div>
            {msg.metadata.tipo_cita && <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#161313', margin: '0 0 2px' }}>{msg.metadata.tipo_cita}</p>}
            {msg.metadata.fecha     && <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.4)', margin: 0 }}>{msg.metadata.fecha}</p>}
          </div>
          <div style={{ borderTop: '1px solid rgba(22,19,19,0.06)', padding: '6px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)' }}>{hora}</span>
          </div>
        </div>
      </div>
    )
  }

  // Tarjeta resultado análisis
  if (msg.tipo === 'resultado_analisis' && msg.metadata) {
    const RIESGO_C = {
      bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)' },
      moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)' },
      alto:     { color: '#8B3A3A', bg: 'rgba(139,58,58,0.08)',   border: 'rgba(139,58,58,0.2)'   },
    }
    const rc = RIESGO_C[msg.metadata.nivel_riesgo ?? 'bajo'] ?? RIESGO_C.bajo
    return (
      <div style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
        <div style={{ maxWidth: '68%', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <i className="ti ti-microscope" style={{ fontSize: '13px', color: '#929C92' }} />
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0 }}>Análisis listo</p>
            </div>
            <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.6)', margin: '0 0 6px' }}>
              Puntuación: <strong style={{ fontWeight: 400, color: '#161313' }}>{msg.metadata.puntuacion}/9</strong>
            </p>
            <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '2px', border: `1px solid ${rc.border}`, background: rc.bg, color: rc.color }}>
              RIESGO {(msg.metadata.nivel_riesgo ?? 'bajo').toUpperCase()}
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(22,19,19,0.06)', padding: '6px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)' }}>{hora}</span>
          </div>
        </div>
      </div>
    )
  }

  // Burbuja texto normal
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '4px', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '68%',
        padding: '10px 14px',
        borderRadius: '2px',
        background: esMio ? '#161313' : '#FFFFFF',
        border: esMio ? 'none' : '1px solid rgba(22,19,19,0.07)',
        color: esMio ? '#F7F5F2' : '#161313',
      }}>
        <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
          {msg.contenido}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
          <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: esMio ? 'rgba(247,245,242,0.35)' : 'rgba(22,19,19,0.3)' }}>
            {hora}
          </span>
          {esMio && (
            msg.leido
              ? <i className="ti ti-checks" style={{ fontSize: '11px', color: '#929C92' }} />
              : <i className="ti ti-check"  style={{ fontSize: '11px', color: 'rgba(247,245,242,0.3)' }} />
          )}
        </div>
      </div>
    </div>
  )
}
