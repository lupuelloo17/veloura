// ══════════════════════════════════════════════════════════════════════════
//  SolicitarCitaDrawer.jsx  —  Motor de reservas online (3 pasos)
//
//  Paso 1 → Tratamiento   clic en card → avanza automáticamente al Paso 2
//  Paso 2 → Médico        clic en card → avanza automáticamente al Paso 3
//  Paso 3 → Fecha + hora  selecciona día → selecciona slot → "Confirmar"
//
//  UX: no hay botón "Continuar" en pasos 1 y 2 — el clic en la selección
//  es suficiente. Esto elimina el problema de "botón invisible".
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { useAuth }   from '../contexts/AuthContext'
import { useClinic } from '../contexts/ClinicContext'
import { supabase }  from '../lib/supabase'
import { TRATAMIENTOS as FALLBACK_TRATS } from '../contexts/CitasContext'

// ── Helpers ──────────────────────────────────────────────────────────────
const isUUID = s =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? '')

/** JS Date.getDay() (0=dom) → dia_semana en horarios_empleados (0=lun…6=dom) */
function jsDayToHorario(jsDay) { return jsDay === 0 ? 6 : jsDay - 1 }

/** 'HH:MM' o 'HH:MM:SS' → minutos desde medianoche */
function timeToMin(t) {
  const [h, m] = (t ?? '00:00').split(':').map(Number)
  return h * 60 + m
}

/** minutos → 'HH:MM' */
function minToTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

/** Date → string 'YYYY-MM-DD' en hora local */
function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Genera slots libres a partir del horario y las citas ya ocupadas */
function calcularSlots(horario, citasOcupadas, duracion) {
  const inicio = timeToMin(horario.hora_inicio)
  const fin    = timeToMin(horario.hora_fin)
  const paso   = Math.max(15, duracion)
  const slots  = []
  for (let t = inicio; t + duracion <= fin; t += paso) {
    const tFin    = t + duracion
    const ocupado = citasOcupadas.some(c => {
      const ci = timeToMin(c.hora)
      const cf = ci + (c.duracion_minutos ?? 30)
      return t < cf && tFin > ci
    })
    if (!ocupado) slots.push(minToTime(t))
  }
  return slots
}

/** Devuelve los próximos días que tienen día_semana en diasConHorario */
function proximosDiasDisponibles(diasConHorario, max = 21) {
  const result = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  for (let i = 1; result.length < max && i <= 90; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    if (diasConHorario.has(jsDayToHorario(d.getDay()))) result.push(d)
  }
  return result
}

const DIAS_LABEL  = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const MESES_LABEL = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

// ══════════════════════════════════════════════════════════════════════════
//  Componente
// ══════════════════════════════════════════════════════════════════════════
export default function SolicitarCitaDrawer({ onClose, onGuardado }) {
  const { user }    = useAuth()
  const { clinica } = useClinic()

  // Wizard
  const [paso,  setPaso]  = useState(1)   // 1 | 2 | 3
  const [exito, setExito] = useState(false)

  // Datos
  const [tratamientos,   setTratamientos]   = useState([])
  const [medicos,        setMedicos]        = useState([])
  const [diasConHorario, setDiasConHorario] = useState(new Set())
  const [slots,          setSlots]          = useState([])

  // Selecciones
  const [tratamiento, setTratamiento] = useState(null)
  const [medico,      setMedico]      = useState(null)
  const [diaSelec,    setDiaSelec]    = useState(null)
  const [slotSelec,   setSlotSelec]   = useState(null)
  const [notas,       setNotas]       = useState('')

  // UI
  const [loadingTrats,  setLoadingTrats]  = useState(true)
  const [loadingMeds,   setLoadingMeds]   = useState(false)
  const [loadingHors,   setLoadingHors]   = useState(false)
  const [loadingSlots,  setLoadingSlots]  = useState(false)
  const [enviando,      setEnviando]      = useState(false)
  const [error,         setError]         = useState(null)

  // ── Cargar tratamientos (Paso 1) ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fallback = (FALLBACK_TRATS ?? [])
      .filter(t => t.label !== 'Otro')
      .map((t, i) => ({
        id:               `mock-t${i}`,
        nombre:           t.label,
        descripcion:      t.descripcion ?? null,
        duracion_minutos: t.duracion ?? t.duracion_minutos ?? 30,
        precio:           t.precio ?? null,
      }))

    async function load() {
      setLoadingTrats(true)

      if (!supabase || !isUUID(clinica?.id)) {
        console.log('[SolicitarCita] Usando tratamientos mock (sin Supabase o clinica no UUID)')
        if (!cancelled) { setTratamientos(fallback); setLoadingTrats(false) }
        return
      }

      try {
        const { data, error: err } = await supabase
          .from('tratamientos')
          .select('id, nombre, descripcion, duracion_minutos, precio')
          .eq('clinica_id', clinica.id)
          .eq('activo', true)
          .order('nombre')

        if (err) throw err
        console.log('[SolicitarCita] Tratamientos cargados:', data?.length ?? 0)
        if (!cancelled) {
          setTratamientos(data?.length ? data : fallback)
          setLoadingTrats(false)
        }
      } catch (e) {
        console.error('[SolicitarCita] Error cargando tratamientos:', e.message)
        if (!cancelled) { setTratamientos(fallback); setLoadingTrats(false) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [clinica?.id])

  // ── Seleccionar tratamiento y avanzar al Paso 2 ──────────────────────
  function elegirTratamiento(t) {
    console.log('[SolicitarCita] Tratamiento seleccionado:', t.nombre)
    setTratamiento(t)
    setMedico(null)
    setDiaSelec(null)
    setSlotSelec(null)
    setSlots([])
    cargarMedicos()
    setPaso(2)
  }

  // ── Cargar médicos (llamada al avanzar a Paso 2) ─────────────────────
  async function cargarMedicos() {
    setLoadingMeds(true)
    setError(null)

    const fallback = [
      { id: 'mock-m1', nombre: 'Dra. María García', especialidad: 'Medicina Estética', foto: null },
      { id: 'mock-m2', nombre: 'Dr. Carlos Ruiz',   especialidad: 'Dermatología',      foto: null },
    ]

    if (!supabase || !isUUID(clinica?.id)) {
      console.log('[SolicitarCita] Usando médicos mock')
      setMedicos(fallback)
      setLoadingMeds(false)
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('usuarios')
        .select('id, nombre, especialidad, foto')
        .eq('clinica_id', clinica.id)
        .eq('rol', 'medico')
        .eq('activo', true)
        .order('nombre')

      if (err) throw err
      console.log('[SolicitarCita] Médicos cargados:', data?.length ?? 0)
      setMedicos(data?.length ? data : fallback)
    } catch (e) {
      console.error('[SolicitarCita] Error cargando médicos:', e.message)
      setError('No se pudieron cargar los médicos. Mostrando opciones por defecto.')
      setMedicos(fallback)
    } finally {
      setLoadingMeds(false)
    }
  }

  // ── Seleccionar médico y avanzar al Paso 3 ───────────────────────────
  function elegirMedico(m) {
    console.log('[SolicitarCita] Médico seleccionado:', m.nombre)
    setMedico(m)
    setDiaSelec(null)
    setSlotSelec(null)
    setSlots([])
    cargarHorarios(m)
    setPaso(3)
  }

  // ── Cargar días disponibles del médico (Paso 3) ──────────────────────
  async function cargarHorarios(m) {
    setLoadingHors(true)

    if (!supabase || !isUUID(m.id)) {
      console.log('[SolicitarCita] Horarios mock: lunes a viernes')
      setDiasConHorario(new Set([0,1,2,3,4]))
      setLoadingHors(false)
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('horarios_empleados')
        .select('dia_semana')
        .eq('empleado_id', m.id)
        .eq('activo', true)

      if (err) throw err
      const dias = new Set((data ?? []).map(h => h.dia_semana))
      console.log('[SolicitarCita] Días con horario:', [...dias])
      setDiasConHorario(dias)
    } catch (e) {
      console.error('[SolicitarCita] Error cargando horarios:', e.message)
      setDiasConHorario(new Set([0,1,2,3,4])) // fallback lunes-viernes
    } finally {
      setLoadingHors(false)
    }
  }

  // ── Calcular slots al seleccionar un día ─────────────────────────────
  const elegirDia = useCallback(async (dia) => {
    setDiaSelec(dia)
    setSlotSelec(null)
    setSlots([])
    if (!medico) return

    setLoadingSlots(true)
    const horarioDia = jsDayToHorario(dia.getDay())
    const dur        = tratamiento?.duracion_minutos ?? 30

    if (!supabase || !isUUID(medico.id)) {
      const mockSlots = calcularSlots({ hora_inicio:'09:00', hora_fin:'18:00' }, [], dur)
      console.log('[SolicitarCita] Slots mock:', mockSlots.length)
      setSlots(mockSlots)
      setLoadingSlots(false)
      return
    }

    try {
      // 1. Horario del médico ese día
      const { data: hor, error: e1 } = await supabase
        .from('horarios_empleados')
        .select('hora_inicio, hora_fin')
        .eq('empleado_id', medico.id)
        .eq('dia_semana', horarioDia)
        .eq('activo', true)
        .maybeSingle()

      if (e1) throw e1
      if (!hor) { console.log('[SolicitarCita] Médico sin horario ese día'); setSlots([]); setLoadingSlots(false); return }

      // 2. Citas ya ocupadas ese día
      const diaStr  = toLocalDate(dia)
      const sigStr  = toLocalDate(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1))

      const { data: citas, error: e2 } = await supabase
        .from('citas')
        .select('fecha, duracion_minutos')
        .eq('medico_usuario_id', medico.id)
        .gte('fecha', `${diaStr}T00:00:00`)
        .lt('fecha',  `${sigStr}T00:00:00`)
        .not('estado', 'in', '("cancelada","no_asistio")')

      if (e2) console.warn('[SolicitarCita] Error cargando citas ocupadas:', e2.message)

      const ocupadas = (citas ?? []).map(c => {
        const f = new Date(c.fecha)
        return {
          hora:             `${String(f.getHours()).padStart(2,'0')}:${String(f.getMinutes()).padStart(2,'0')}`,
          duracion_minutos: c.duracion_minutos ?? 30,
        }
      })

      const libres = calcularSlots(hor, ocupadas, dur)
      console.log('[SolicitarCita] Slots disponibles:', libres.length, 'ocupadas:', ocupadas.length)
      setSlots(libres)

    } catch (e) {
      console.error('[SolicitarCita] Error calculando slots:', e.message)
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [medico, tratamiento])

  // ── Confirmar cita ───────────────────────────────────────────────────
  async function handleConfirmar() {
    if (!tratamiento || !medico || !diaSelec || !slotSelec) return
    setEnviando(true)
    setError(null)

    const [h, m] = slotSelec.split(':').map(Number)
    const fechaISO = new Date(
      diaSelec.getFullYear(), diaSelec.getMonth(), diaSelec.getDate(), h, m
    ).toISOString()

    try {
      if (!supabase || !isUUID(clinica?.id) || !isUUID(user?.id)) {
        console.log('[SolicitarCita] Demo: simulando INSERT')
        await new Promise(r => setTimeout(r, 700))
        setExito(true)
        setTimeout(() => onGuardado({
          tratamiento: tratamiento.nombre, fecha: fechaISO,
          duracion_minutos: tratamiento.duracion_minutos, estado: 'pendiente',
        }), 1800)
        return
      }

      const { data: cita, error: err } = await supabase
        .from('citas')
        .insert({
          paciente_id:       user.id,
          clinica_id:        clinica.id,
          medico_usuario_id: medico.id,
          tratamiento:       tratamiento.nombre,
          precio:            tratamiento.precio ?? null,
          fecha:             fechaISO,
          duracion_minutos:  tratamiento.duracion_minutos ?? 30,
          estado:            'pendiente',
          notas_previas:     notas.trim() || null,
        })
        .select()
        .single()

      if (err) throw err

      console.log('[SolicitarCita] Cita creada:', cita.id)
      setExito(true)
      setTimeout(() => onGuardado(cita), 1800)

    } catch (e) {
      console.error('[SolicitarCita] Error confirmando cita:', e.message)
      setError(e.message || 'Error al confirmar la cita')
    } finally {
      setEnviando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  const diasDisponibles = proximosDiasDisponibles(diasConHorario)

  const PASOS_LABEL = ['Tratamiento', 'Médico', 'Fecha y hora']

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:40,
          background:'rgba(22,19,19,0.52)',
          backdropFilter:'blur(2px)',
          animation:'vlFade 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position:'fixed', bottom:0, left:'50%',
        transform:'translateX(-50%)',
        width:'100%', maxWidth:'448px', zIndex:50,
        background:'#FFFFFF',
        borderRadius:'16px 16px 0 0',
        maxHeight:'92vh', display:'flex', flexDirection:'column',
        animation:'vlUp 0.28s cubic-bezier(0.34,1.3,0.64,1)',
        boxShadow:'0 -8px 40px rgba(22,19,19,0.14)',
      }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(22,19,19,0.1)' }}/>
        </div>

        {/* Header */}
        <div style={{ padding:'10px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ margin:'0 0 3px', fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
                {exito ? 'Reserva confirmada' : `Paso ${paso} de 3 · ${PASOS_LABEL[paso-1]}`}
              </p>
              <h2 style={{ margin:0, fontFamily:"'Fraunces',Georgia,serif", fontSize:'22px', fontWeight:400, color:'#161313', letterSpacing:'-0.01em' }}>
                {exito ? '¡Cita solicitada!' : paso===1 ? 'Elige el tratamiento' : paso===2 ? 'Elige al médico' : 'Selecciona día y hora'}
              </h2>
            </div>
            {!exito && (
              <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(22,19,19,0.1)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                ✕
              </button>
            )}
          </div>

          {/* Barra de pasos */}
          {!exito && (
            <div style={{ display:'flex', gap:4, marginBottom:14 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  height:3, borderRadius:2,
                  flex: n===paso ? 3 : 1,
                  background: n<=paso ? '#161313' : 'rgba(22,19,19,0.1)',
                  transition:'all 0.35s ease',
                }}/>
              ))}
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 8px', WebkitOverflowScrolling:'touch' }}>

          {/* ── ÉXITO ── */}
          {exito && (
            <div style={{ textAlign:'center', padding:'28px 0 40px' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(146,156,146,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#929C92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p style={{ margin:'0 0 6px', fontFamily:"'Fraunces',Georgia,serif", fontSize:'20px', fontWeight:400, color:'#161313' }}>
                Solicitud enviada
              </p>
              <p style={{ margin:'0 auto 20px', fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', lineHeight:1.6, maxWidth:240 }}>
                La clínica confirmará tu cita en breve.
              </p>
              <div style={{ padding:'14px 16px', border:'1px solid rgba(22,19,19,0.08)', borderRadius:2, textAlign:'left' }}>
                {[
                  ['Tratamiento', tratamiento?.nombre],
                  ['Médico',      medico?.nombre],
                  ['Día',         diaSelec?.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})],
                  ['Hora',        slotSelec],
                ].map(([label, value], i, arr) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0', borderBottom: i<arr.length-1 ? '1px solid rgba(22,19,19,0.06)' : 'none' }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>{label}</span>
                    <span style={{ fontFamily:"'DM Sans',system-ui", fontSize:'12px', color:'#161313', textAlign:'right', maxWidth:'60%' }}>{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 1: Tratamiento ── */}
          {!exito && paso===1 && (
            loadingTrats ? <LoadSpinner /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <p style={{ margin:'0 0 10px', fontFamily:"'DM Sans',system-ui", fontSize:'12px', fontWeight:300, color:'rgba(22,19,19,0.4)', lineHeight:1.5 }}>
                  Selecciona el servicio que deseas y pasarás automáticamente al siguiente paso.
                </p>
                {tratamientos.map(t => (
                  <button
                    key={t.id}
                    onClick={() => elegirTratamiento(t)}
                    style={{
                      width:'100%', textAlign:'left', cursor:'pointer',
                      padding:'14px 16px', borderRadius:2,
                      background: '#FFFFFF',
                      border: '1px solid rgba(22,19,19,0.12)',
                      transition:'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(22,19,19,0.03)'; e.currentTarget.style.borderColor='rgba(22,19,19,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='#FFFFFF'; e.currentTarget.style.borderColor='rgba(22,19,19,0.12)' }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 3px', fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:400, color:'#161313' }}>
                          {t.nombre}
                        </p>
                        {t.descripcion && (
                          <p style={{ margin:'0 0 5px', fontFamily:"'DM Sans',system-ui", fontSize:'11px', fontWeight:300, lineHeight:1.5, color:'rgba(22,19,19,0.4)' }}>
                            {t.descripcion}
                          </p>
                        )}
                        <div style={{ display:'flex', gap:12 }}>
                          {t.duracion_minutos && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.06em', color:'rgba(22,19,19,0.3)' }}>{t.duracion_minutos} min</span>}
                          {t.precio != null   && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.06em', color:'rgba(22,19,19,0.3)' }}>{t.precio} €</span>}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(22,19,19,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {/* ── PASO 2: Médico ── */}
          {!exito && paso===2 && (
            loadingMeds ? <LoadSpinner msg="Cargando médicos…" /> : medicos.length===0 ? (
              <p style={{ fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', textAlign:'center', padding:'32px 0' }}>
                No hay médicos disponibles en este momento.
              </p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <p style={{ margin:'0 0 10px', fontFamily:"'DM Sans',system-ui", fontSize:'12px', fontWeight:300, color:'rgba(22,19,19,0.4)', lineHeight:1.5 }}>
                  Tratamiento: <strong style={{ color:'#161313', fontWeight:400 }}>{tratamiento?.nombre}</strong>
                </p>
                {medicos.map(m => {
                  const ini = (m.nombre?.[0] ?? 'M').toUpperCase()
                  return (
                    <button
                      key={m.id}
                      onClick={() => elegirMedico(m)}
                      style={{
                        width:'100%', textAlign:'left', cursor:'pointer',
                        padding:'12px 16px', borderRadius:2,
                        display:'flex', alignItems:'center', gap:14,
                        background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.12)',
                        transition:'background 0.12s, border-color 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(22,19,19,0.03)'; e.currentTarget.style.borderColor='rgba(22,19,19,0.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background='#FFFFFF'; e.currentTarget.style.borderColor='rgba(22,19,19,0.12)' }}
                    >
                      {m.foto
                        ? <img src={m.foto} alt={m.nombre} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                        : <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, background:'rgba(22,19,19,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',Georgia,serif", fontSize:'18px', fontWeight:400, color:'rgba(22,19,19,0.3)' }}>{ini}</div>
                      }
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 3px', fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:400, color:'#161313' }}>{m.nombre}</p>
                        {m.especialidad && <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>{m.especialidad}</p>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(22,19,19,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  )
                })}
              </div>
            )
          )}

          {/* ── PASO 3: Fecha y hora ── */}
          {!exito && paso===3 && (
            loadingHors ? <LoadSpinner msg="Cargando horarios…" /> : (
              <div>
                {/* Resumen selección */}
                <div style={{ padding:'10px 14px', background:'rgba(22,19,19,0.03)', borderRadius:2, marginBottom:16, display:'flex', gap:16 }}>
                  <MiniInfo label="Tratamiento" value={tratamiento?.nombre} />
                  <MiniInfo label="Médico"      value={medico?.nombre?.replace(/^(Dr\.|Dra\.) /,'')} />
                </div>

                {/* Grid de días */}
                <p style={{ margin:'0 0 10px', fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                  Selecciona un día
                </p>

                {diasDisponibles.length===0 ? (
                  <p style={{ fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', padding:'12px 0 20px' }}>
                    Este médico no tiene días configurados. Contacta con la clínica.
                  </p>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:20 }}>
                    {diasDisponibles.map((d, i) => {
                      const sel = diaSelec && toLocalDate(d)===toLocalDate(diaSelec)
                      const ds  = jsDayToHorario(d.getDay())
                      return (
                        <button
                          key={i}
                          onClick={() => elegirDia(d)}
                          style={{
                            padding:'10px 4px', borderRadius:2, border:'none', cursor:'pointer',
                            background: sel ? '#161313' : '#FFFFFF',
                            outline:    sel ? 'none'    : '1px solid rgba(22,19,19,0.1)',
                            textAlign:'center', transition:'all 0.12s',
                          }}
                        >
                          <p style={{ margin:'0 0 2px', fontFamily:"'DM Mono',monospace", fontSize:'8px', letterSpacing:'0.1em', textTransform:'uppercase', color:sel?'rgba(201,211,202,0.5)':'rgba(22,19,19,0.28)' }}>{DIAS_LABEL[ds]}</p>
                          <p style={{ margin:'0 0 1px', fontFamily:"'DM Sans',system-ui", fontSize:'16px', fontWeight:400, color:sel?'#F7F5F2':'#161313' }}>{d.getDate()}</p>
                          <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:'8px', letterSpacing:'0.05em', color:sel?'rgba(201,211,202,0.38)':'rgba(22,19,19,0.22)' }}>{MESES_LABEL[d.getMonth()]}</p>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Slots */}
                {diaSelec && (
                  <>
                    <p style={{ margin:'0 0 10px', fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                      Horas disponibles
                    </p>

                    {loadingSlots ? <LoadSpinner msg="Calculando disponibilidad…" /> :
                     slots.length===0 ? (
                      <div style={{ padding:'18px', border:'1px solid rgba(22,19,19,0.08)', borderRadius:2, textAlign:'center', marginBottom:16 }}>
                        <p style={{ margin:0, fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.35)' }}>
                          Sin disponibilidad este día
                        </p>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:16 }}>
                        {slots.map(s => {
                          const sel = slotSelec===s
                          return (
                            <button
                              key={s}
                              onClick={() => setSlotSelec(s)}
                              style={{
                                padding:'10px 4px', borderRadius:2, border:'none', cursor:'pointer',
                                background: sel ? '#161313' : '#FFFFFF',
                                outline:    sel ? 'none'    : '1px solid rgba(22,19,19,0.1)',
                                fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:400,
                                color: sel ? '#F7F5F2' : '#161313',
                                transition:'all 0.1s',
                              }}
                            >
                              {s}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Notas — solo cuando hay slot seleccionado */}
                {slotSelec && (
                  <div style={{ marginBottom:8 }}>
                    <p style={{ margin:'0 0 8px', fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                      Notas <span style={{ textTransform:'none', letterSpacing:0, opacity:0.5 }}>(opcional)</span>
                    </p>
                    <textarea
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      rows={2}
                      placeholder="Alergias, preferencias, dudas…"
                      style={{
                        width:'100%', boxSizing:'border-box',
                        fontFamily:"'DM Sans',system-ui", fontSize:'13px', fontWeight:300, color:'#161313',
                        border:'1px solid rgba(22,19,19,0.1)', borderRadius:2,
                        padding:'10px 12px', background:'#FFFFFF', resize:'none', outline:'none',
                      }}
                    />
                  </div>
                )}

                {/* ── Botón Confirmar STICKY ─────────────────────────────────────────
                    Siempre visible en Paso 3. Sticky bottom dentro del scroll, con
                    fondo blanco y sombra para separarse del contenido al hacer scroll.
                    disabled (gris) hasta que se seleccione un slot; enabled (negro) después.
                ─────────────────────────────────────────────────────────────────── */}
                <div style={{
                  position: 'sticky',
                  bottom: 0,
                  background: 'linear-gradient(to bottom, transparent 0%, #FFFFFF 30%)',
                  paddingTop: 16,
                  paddingBottom: 8,
                  marginTop: 8,
                }}>
                  {error && (
                    <div style={{ padding:'10px 0 10px', marginBottom:4 }}>
                      <p style={{ margin:0, fontFamily:"'DM Sans',system-ui", fontSize:'12px', fontWeight:300, color:'#A03020' }}>{error}</p>
                    </div>
                  )}
                  <button
                    onClick={handleConfirmar}
                    disabled={!slotSelec || enviando}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 2,
                      border: 'none',
                      fontFamily: "'DM Sans',system-ui",
                      fontSize: '12px',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: slotSelec && !enviando ? 'pointer' : 'not-allowed',
                      // Estado habilitado: negro premium / deshabilitado: gris claro con texto legible
                      background: slotSelec && !enviando
                        ? '#161313'
                        : 'rgba(22,19,19,0.08)',
                      color: slotSelec && !enviando
                        ? '#C9D3CA'
                        : 'rgba(22,19,19,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {enviando && (
                      <span style={{
                        width: 12, height: 12, borderRadius: '50%',
                        border: '1.5px solid currentColor',
                        borderTopColor: 'transparent',
                        animation: 'vlSpin 0.7s linear infinite',
                        display: 'inline-block',
                      }}/>
                    )}
                    {enviando
                      ? 'Confirmando…'
                      : slotSelec
                        ? `Confirmar — ${slotSelec}`
                        : 'Selecciona una hora'}
                  </button>
                </div>

              </div>
            )
          )}
        </div>

        {/* Error pasos 1 y 2 (paso 3 tiene su error inline en el sticky) */}
        {error && paso < 3 && (
          <div style={{ padding:'10px 20px', background:'rgba(180,60,40,0.06)', borderTop:'1px solid rgba(180,60,40,0.1)' }}>
            <p style={{ margin:0, fontFamily:"'DM Sans',system-ui", fontSize:'12px', fontWeight:300, color:'#A03020' }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        {!exito && (
          <div style={{ padding:'12px 20px env(safe-area-inset-bottom,16px)', borderTop:'1px solid rgba(22,19,19,0.06)', display:'flex', gap:8, flexShrink:0, background:'#FFFFFF' }}>

            {/* Atrás — visible siempre en paso 2 y 3 */}
            {paso > 1 && (
              <button
                onClick={() => { setPaso(p => p-1); setError(null) }}
                style={{
                  flex:1, padding:'13px', borderRadius:2,
                  border:'1px solid rgba(22,19,19,0.12)', background:'transparent',
                  fontFamily:"'DM Sans',system-ui", fontSize:'11px', fontWeight:400,
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  color:'rgba(22,19,19,0.45)', cursor:'pointer',
                }}
              >
                ← Atrás
              </button>
            )}

            {/* En paso 3 el botón Confirmar vive sticky dentro del scroll.
                Este flex spacer mantiene el footer balanceado junto al botón Atrás. */}
            {paso===3 && <div style={{ flex:2 }} />}

            {/* En pasos 1 y 2, indicar al usuario qué hacer */}
            {paso < 3 && (
              <div style={{ flex:2, padding:'13px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(22,19,19,0.25)' }}>
                  Toca una opción para continuar
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes vlFade { from{opacity:0} to{opacity:1} }
        @keyframes vlUp   { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes vlSpin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}

// ── Micro-componentes ────────────────────────────────────────────────────
function LoadSpinner({ msg = 'Cargando…' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'28px 0' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(22,19,19,0.08)', borderTopColor:'rgba(22,19,19,0.3)', animation:'vlSpin 0.7s linear infinite' }}/>
      <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>{msg}</p>
    </div>
  )
}

function MiniInfo({ label, value }) {
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ margin:'0 0 2px', fontFamily:"'DM Mono',monospace", fontSize:'8px', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>{label}</p>
      <p style={{ margin:0, fontFamily:"'DM Sans',system-ui", fontSize:'11px', fontWeight:400, color:'#161313', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value ?? '—'}</p>
    </div>
  )
}
