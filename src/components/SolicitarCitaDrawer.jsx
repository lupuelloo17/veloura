// ══════════════════════════════════════════════════════════════════════════
//  SolicitarCitaDrawer.jsx
//  Motor de reservas online — wizard de 3 pasos para el portal del paciente
//
//  Paso 1 → Tratamiento   (catálogo de tratamientos de la clínica)
//  Paso 2 → Médico        (usuarios con rol='medico' de la clínica)
//  Paso 3 → Fecha y hora  (horarios_empleados × citas ocupadas → slots libres)
//  ─────────────────────────────────────────────────────────────────────────
//  Al confirmar:
//    INSERT en citas (medico_usuario_id, paciente_id, tratamiento, fecha…)
//    → callback onGuardado(cita) → refresca "Próxima Cita" en el Inicio
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { useAuth }   from '../contexts/AuthContext'
import { useClinic } from '../contexts/ClinicContext'
import { supabase }  from '../lib/supabase'
import { TRATAMIENTOS as FALLBACK_TRATS } from '../contexts/CitasContext'

// ── Helpers ──────────────────────────────────────────────────────────────
const isUUID = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? '')

/** JS Date.getDay() (0=dom) → dia_semana en horarios_empleados (0=lun) */
function jsDayToHorario(jsDay) { return jsDay === 0 ? 6 : jsDay - 1 }

/** 'HH:MM:SS' → minutos desde medianoche */
function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m }

/** minutos → 'HH:MM' */
function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

/** Date → 'YYYY-MM-DD' local */
function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Generar slots libres dado el horario del médico y las citas ocupadas */
function calcularSlots(horario, citasOcupadas, duracion) {
  const inicio = timeToMin(horario.hora_inicio)
  const fin    = timeToMin(horario.hora_fin)
  const paso   = Math.max(15, duracion)
  const slots  = []
  for (let t = inicio; t + duracion <= fin; t += paso) {
    const tFin   = t + duracion
    const ocupado = citasOcupadas.some(c => {
      const cIni = timeToMin(c.hora)
      const cFin = cIni + (c.duracion_minutos ?? 30)
      return t < cFin && tFin > cIni
    })
    if (!ocupado) slots.push(minToTime(t))
  }
  return slots
}

/** Próximos maxDias días en que diasConHorario tiene ese dia_semana */
function proximosDiasConHorario(diasConHorario, maxDias = 21) {
  const result = []
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  for (let i = 1; result.length < maxDias && i <= 90; i++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + i)
    if (diasConHorario.has(jsDayToHorario(d.getDay()))) result.push(d)
  }
  return result
}

const DIAS_LABEL  = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const MESES_LABEL = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const FB = "'DM Sans', system-ui, sans-serif"
const FD = "'Fraunces', Georgia, serif"
const FM = "'DM Mono', monospace"

// ══════════════════════════════════════════════════════════════════════════
//  Componente principal
// ══════════════════════════════════════════════════════════════════════════
export default function SolicitarCitaDrawer({ onClose, onGuardado }) {
  const { user }    = useAuth()
  const { clinica } = useClinic()

  const [paso,    setPaso]    = useState(1)
  const [exito,   setExito]   = useState(false)

  const [tratamientos,     setTratamientos]     = useState([])
  const [medicos,          setMedicos]          = useState([])
  const [diasConHorario,   setDiasConHorario]   = useState(new Set())
  const [slots,            setSlots]            = useState([])

  const [tratamiento, setTratamiento] = useState(null)
  const [medico,      setMedico]      = useState(null)
  const [diaSelec,    setDiaSelec]    = useState(null)
  const [slotSelec,   setSlotSelec]   = useState(null)
  const [notas,       setNotas]       = useState('')

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [enviando, setEnviando] = useState(false)

  // ── Paso 1: tratamientos ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const fallback = FALLBACK_TRATS
        .filter(t => t.label !== 'Otro')
        .map((t,i) => ({ id:`mock-${i}`, nombre:t.label, duracion_minutos:t.duracion??30, precio:t.precio }))
      if (!supabase || !isUUID(clinica?.id)) {
        if (!cancelled) { setTratamientos(fallback); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('tratamientos').select('id,nombre,descripcion,duracion_minutos,precio')
        .eq('clinica_id', clinica.id).eq('activo', true).order('nombre')
      if (!cancelled) { setTratamientos(data?.length ? data : fallback); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [clinica?.id])

  // ── Paso 2: médicos ──────────────────────────────────────────────────
  useEffect(() => {
    if (paso !== 2) return
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!supabase || !isUUID(clinica?.id)) {
        if (!cancelled) {
          setMedicos([
            { id:'mock-m1', nombre:'Dra. María García', especialidad:'Medicina Estética', foto:null },
            { id:'mock-m2', nombre:'Dr. Carlos Ruiz',   especialidad:'Dermatología',      foto:null },
          ])
          setLoading(false)
        }
        return
      }
      const { data } = await supabase
        .from('usuarios').select('id,nombre,especialidad,foto')
        .eq('clinica_id', clinica.id).eq('rol','medico').eq('activo',true).order('nombre')
      if (!cancelled) { setMedicos(data ?? []); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [paso, clinica?.id])

  // ── Paso 3: horarios del médico ──────────────────────────────────────
  useEffect(() => {
    if (paso !== 3 || !medico) return
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!supabase || !isUUID(medico.id)) {
        if (!cancelled) { setDiasConHorario(new Set([0,1,2,3,4])); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('horarios_empleados').select('dia_semana')
        .eq('empleado_id', medico.id).eq('activo', true)
      if (!cancelled) {
        setDiasConHorario(new Set((data ?? []).map(h => h.dia_semana)))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [paso, medico])

  // ── Calcular slots al cambiar día ────────────────────────────────────
  const calcularSlotsDelDia = useCallback(async (dia) => {
    setSlots([]); setSlotSelec(null)
    if (!dia || !medico) return
    const horarioDia = jsDayToHorario(dia.getDay())
    if (!supabase || !isUUID(medico.id)) {
      setSlots(calcularSlots({ hora_inicio:'09:00', hora_fin:'18:00' }, [], tratamiento?.duracion_minutos ?? 30))
      return
    }
    const { data: hor } = await supabase
      .from('horarios_empleados').select('hora_inicio,hora_fin')
      .eq('empleado_id', medico.id).eq('dia_semana', horarioDia).eq('activo',true).maybeSingle()
    if (!hor) { setSlots([]); return }
    const diaStr  = toLocalDate(dia)
    const sigDia  = new Date(dia); sigDia.setDate(sigDia.getDate() + 1)
    const sigStr  = toLocalDate(sigDia)
    const { data: citas } = await supabase
      .from('citas').select('fecha,duracion_minutos')
      .eq('medico_usuario_id', medico.id)
      .gte('fecha', `${diaStr}T00:00:00`).lt('fecha', `${sigStr}T00:00:00`)
      .not('estado','in','("cancelada","no_asistio")')
    const ocupadas = (citas ?? []).map(c => {
      const f = new Date(c.fecha)
      return { hora:`${String(f.getHours()).padStart(2,'0')}:${String(f.getMinutes()).padStart(2,'0')}`, duracion_minutos:c.duracion_minutos??30 }
    })
    setSlots(calcularSlots(hor, ocupadas, tratamiento?.duracion_minutos ?? 30))
  }, [medico, tratamiento])

  useEffect(() => { if (diaSelec) calcularSlotsDelDia(diaSelec) }, [diaSelec, calcularSlotsDelDia])

  // ── Confirmar cita ───────────────────────────────────────────────────
  async function handleConfirmar() {
    if (!tratamiento || !medico || !diaSelec || !slotSelec) return
    setEnviando(true); setError(null)
    try {
      const [h, m] = slotSelec.split(':').map(Number)
      const fechaISO = new Date(diaSelec.getFullYear(), diaSelec.getMonth(), diaSelec.getDate(), h, m).toISOString()
      if (!supabase || !isUUID(clinica?.id) || !isUUID(user?.id)) {
        await new Promise(r => setTimeout(r, 600))
        setExito(true)
        setTimeout(() => onGuardado({ tratamiento:tratamiento.nombre, fecha:fechaISO, duracion_minutos:tratamiento.duracion_minutos, estado:'pendiente' }), 1800)
        return
      }
      const { data: cita, error: err } = await supabase
        .from('citas').insert({
          paciente_id:       user.id,
          clinica_id:        clinica.id,
          medico_usuario_id: medico.id,
          tratamiento:       tratamiento.nombre,
          precio:            tratamiento.precio ?? null,
          fecha:             fechaISO,
          duracion_minutos:  tratamiento.duracion_minutos ?? 30,
          estado:            'pendiente',
          notas_previas:     notas.trim() || null,
        }).select().single()
      if (err) throw err
      setExito(true)
      setTimeout(() => onGuardado(cita), 1800)
    } catch (err) {
      setError(err.message || 'Error al confirmar la cita')
    } finally { setEnviando(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────
  const diasDisponibles = proximosDiasConHorario(diasConHorario)
  const puedeAvanzar1  = !!tratamiento
  const puedeAvanzar2  = !!medico
  const puedeConfirmar = !!diaSelec && !!slotSelec

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:40,
        background:'rgba(22,19,19,0.5)', backdropFilter:'blur(2px)',
        animation:'vlFadeIn 0.2s ease',
      }} />

      {/* Sheet */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:'448px', zIndex:50,
        background:'#FFFFFF', borderRadius:'16px 16px 0 0',
        maxHeight:'92vh', display:'flex', flexDirection:'column',
        animation:'vlSlideUp 0.28s cubic-bezier(0.34,1.3,0.64,1)',
        boxShadow:'0 -8px 40px rgba(22,19,19,0.14)',
      }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(22,19,19,0.1)' }} />
        </div>

        {/* Header */}
        <div style={{ padding:'12px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
                {exito ? 'Solicitud enviada' : `Paso ${paso} de 3`}
              </p>
              <h2 style={{ margin:0, fontFamily:FD, fontSize:'22px', fontWeight:400, color:'#161313', letterSpacing:'-0.01em' }}>
                {exito ? '¡Cita solicitada!' : paso===1 ? 'Tratamiento' : paso===2 ? 'Elige médico' : 'Fecha y hora'}
              </h2>
            </div>
            {!exito && (
              <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(22,19,19,0.1)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(22,19,19,0.4)" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Barra de progreso por pasos */}
          {!exito && (
            <div style={{ display:'flex', gap:4, marginBottom:16 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  flex: n===paso ? 2 : 1, height:3, borderRadius:2,
                  background: n<=paso ? '#161313' : 'rgba(22,19,19,0.1)',
                  transition:'all 0.3s ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 4px', WebkitOverflowScrolling:'touch' }}>

          {/* ══ ÉXITO ══ */}
          {exito && (
            <div style={{ textAlign:'center', padding:'28px 0 40px' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(146,156,146,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#929C92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p style={{ margin:'0 0 6px', fontFamily:FD, fontSize:'20px', fontWeight:400, color:'#161313' }}>Solicitud enviada</p>
              <p style={{ margin:'0 auto', fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', lineHeight:1.6, maxWidth:240 }}>
                La clínica confirmará tu cita en breve. Recibirás una notificación.
              </p>
              <div style={{ marginTop:22, padding:'14px 16px', border:'1px solid rgba(22,19,19,0.08)', borderRadius:2, textAlign:'left' }}>
                <SRow label="Tratamiento" value={tratamiento?.nombre} />
                <SRow label="Médico"      value={medico?.nombre} />
                <SRow label="Día"         value={diaSelec?.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})} />
                <SRow label="Hora"        value={slotSelec} last />
              </div>
            </div>
          )}

          {/* ══ PASO 1: Tratamiento ══ */}
          {!exito && paso===1 && (
            loading ? <Spin /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, paddingBottom:8 }}>
                {tratamientos.map(t => {
                  const sel = tratamiento?.id===t.id
                  return (
                    <button key={t.id} onClick={() => setTratamiento(t)} style={{
                      width:'100%', textAlign:'left', border:'none', cursor:'pointer',
                      padding:'14px 16px', borderRadius:2, transition:'all 0.14s',
                      background: sel ? '#161313' : '#FFFFFF',
                      outline: sel ? 'none' : '1px solid rgba(22,19,19,0.1)',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:'0 0 3px', fontFamily:FB, fontSize:'13px', fontWeight:400, color:sel?'#C9D3CA':'#161313' }}>{t.nombre}</p>
                          {t.descripcion && <p style={{ margin:'0 0 5px', fontFamily:FB, fontSize:'11px', fontWeight:300, lineHeight:1.5, color:sel?'rgba(201,211,202,0.55)':'rgba(22,19,19,0.38)' }}>{t.descripcion}</p>}
                          <div style={{ display:'flex', gap:12 }}>
                            {t.duracion_minutos && <span style={{ fontFamily:FM, fontSize:'9px', letterSpacing:'0.08em', color:sel?'rgba(201,211,202,0.45)':'rgba(22,19,19,0.28)' }}>{t.duracion_minutos} min</span>}
                            {t.precio!=null      && <span style={{ fontFamily:FM, fontSize:'9px', letterSpacing:'0.08em', color:sel?'rgba(201,211,202,0.45)':'rgba(22,19,19,0.28)' }}>{t.precio} €</span>}
                          </div>
                        </div>
                        {sel && <Check />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          )}

          {/* ══ PASO 2: Médico ══ */}
          {!exito && paso===2 && (
            loading ? <Spin /> : medicos.length===0 ? (
              <p style={{ fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', textAlign:'center', padding:'32px 0' }}>
                No hay médicos disponibles.
              </p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, paddingBottom:8 }}>
                {medicos.map(m => {
                  const sel = medico?.id===m.id
                  const ini = (m.nombre?.[0]??'M').toUpperCase()
                  return (
                    <button key={m.id} onClick={() => setMedico(m)} style={{
                      width:'100%', textAlign:'left', border:'none', cursor:'pointer',
                      padding:'12px 16px', borderRadius:2, transition:'all 0.14s',
                      display:'flex', alignItems:'center', gap:14,
                      background: sel ? '#161313' : '#FFFFFF',
                      outline: sel ? 'none' : '1px solid rgba(22,19,19,0.1)',
                    }}>
                      {m.foto
                        ? <img src={m.foto} alt={m.nombre} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                        : <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, background:sel?'rgba(201,211,202,0.12)':'rgba(22,19,19,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FD, fontSize:'18px', fontWeight:400, color:sel?'rgba(201,211,202,0.6)':'rgba(22,19,19,0.3)' }}>{ini}</div>
                      }
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 3px', fontFamily:FB, fontSize:'13px', fontWeight:400, color:sel?'#C9D3CA':'#161313' }}>{m.nombre}</p>
                        {m.especialidad && <p style={{ margin:0, fontFamily:FM, fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:sel?'rgba(201,211,202,0.42)':'rgba(22,19,19,0.28)' }}>{m.especialidad}</p>}
                      </div>
                      {sel && <Check />}
                    </button>
                  )
                })}
              </div>
            )
          )}

          {/* ══ PASO 3: Fecha y hora ══ */}
          {!exito && paso===3 && (
            loading ? <Spin /> : (
              <div style={{ paddingBottom:8 }}>

                {/* Label */}
                <SLabel>Selecciona un día</SLabel>

                {diasDisponibles.length===0 ? (
                  <p style={{ fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.4)', padding:'12px 0 20px' }}>
                    Este médico no tiene horarios configurados.
                  </p>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:20 }}>
                    {diasDisponibles.map((d,i) => {
                      const sel = diaSelec && toLocalDate(d)===toLocalDate(diaSelec)
                      const ds  = jsDayToHorario(d.getDay())
                      return (
                        <button key={i} onClick={() => setDiaSelec(d)} style={{
                          padding:'10px 4px', borderRadius:2, border:'none', cursor:'pointer',
                          background:sel?'#161313':'#FFFFFF',
                          outline:sel?'none':'1px solid rgba(22,19,19,0.1)',
                          textAlign:'center', transition:'all 0.12s',
                        }}>
                          <p style={{ margin:'0 0 2px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.1em', textTransform:'uppercase', color:sel?'rgba(201,211,202,0.45)':'rgba(22,19,19,0.3)' }}>{DIAS_LABEL[ds]}</p>
                          <p style={{ margin:'0 0 1px', fontFamily:FB, fontSize:'16px', fontWeight:400, color:sel?'#F7F5F2':'#161313' }}>{d.getDate()}</p>
                          <p style={{ margin:0, fontFamily:FM, fontSize:'8px', letterSpacing:'0.06em', color:sel?'rgba(201,211,202,0.38)':'rgba(22,19,19,0.22)' }}>{MESES_LABEL[d.getMonth()]}</p>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Slots */}
                {diaSelec && (
                  <>
                    <SLabel>Horas disponibles</SLabel>
                    {slots.length===0 ? (
                      <div style={{ padding:'18px', border:'1px solid rgba(22,19,19,0.08)', borderRadius:2, textAlign:'center', marginBottom:16 }}>
                        <p style={{ margin:0, fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.35)' }}>Sin disponibilidad este día</p>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:16 }}>
                        {slots.map(s => {
                          const sel = slotSelec===s
                          return (
                            <button key={s} onClick={() => setSlotSelec(s)} style={{
                              padding:'10px 4px', borderRadius:2, border:'none', cursor:'pointer',
                              background:sel?'#161313':'#FFFFFF',
                              outline:sel?'none':'1px solid rgba(22,19,19,0.1)',
                              fontFamily:FB, fontSize:'13px', fontWeight:400,
                              color:sel?'#F7F5F2':'#161313', transition:'all 0.12s',
                            }}>
                              {s}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Notas */}
                {slotSelec && (
                  <div style={{ marginBottom:8 }}>
                    <SLabel>Notas <span style={{ textTransform:'none', letterSpacing:0, opacity:0.5 }}>(opcional)</span></SLabel>
                    <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={2}
                      placeholder="Alergias, preferencias, dudas…"
                      style={{ width:'100%', boxSizing:'border-box', fontFamily:FB, fontSize:'13px', fontWeight:300, color:'#161313', border:'1px solid rgba(22,19,19,0.1)', borderRadius:2, padding:'10px 12px', background:'#FFFFFF', resize:'none', outline:'none' }}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding:'10px 20px', background:'rgba(180,60,40,0.06)', borderTop:'1px solid rgba(180,60,40,0.12)' }}>
            <p style={{ margin:0, fontFamily:FB, fontSize:'12px', fontWeight:300, color:'#A03020' }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        {!exito && (
          <div style={{ padding:'12px 20px env(safe-area-inset-bottom,16px)', borderTop:'1px solid rgba(22,19,19,0.06)', display:'flex', gap:8, flexShrink:0, background:'#FFFFFF' }}>
            {paso>1 && (
              <button onClick={() => { setPaso(p=>p-1); setError(null) }} style={{
                flex:1, padding:'13px', borderRadius:2, border:'1px solid rgba(22,19,19,0.12)',
                background:'transparent', fontFamily:FB, fontSize:'11px', fontWeight:400,
                letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(22,19,19,0.45)', cursor:'pointer',
              }}>
                Atrás
              </button>
            )}
            {paso<3 ? (
              <button
                onClick={() => { setError(null); setPaso(p=>p+1) }}
                disabled={(paso===1&&!puedeAvanzar1)||(paso===2&&!puedeAvanzar2)}
                style={{
                  flex:2, padding:'13px', borderRadius:2, border:'none', cursor:'pointer',
                  fontFamily:FB, fontSize:'11px', fontWeight:400,
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  background:'#161313', color:'#C9D3CA',
                  opacity:((paso===1&&!puedeAvanzar1)||(paso===2&&!puedeAvanzar2))?0.32:1,
                  transition:'opacity 0.15s',
                }}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleConfirmar}
                disabled={!puedeConfirmar||enviando}
                style={{
                  flex:2, padding:'13px', borderRadius:2, border:'none', cursor:'pointer',
                  fontFamily:FB, fontSize:'11px', fontWeight:400,
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  background:'#161313', color:'#C9D3CA',
                  opacity:(!puedeConfirmar||enviando)?0.32:1,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'opacity 0.15s',
                }}
              >
                {enviando && <span style={{ width:12,height:12,borderRadius:'50%',border:'1.5px solid currentColor',borderTopColor:'transparent',animation:'vlSpin 0.7s linear infinite',display:'inline-block' }} />}
                {enviando ? 'Confirmando…' : 'Confirmar cita'}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes vlFadeIn  { from{opacity:0}       to{opacity:1} }
        @keyframes vlSlideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes vlSpin    { to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}

// ── Micro-componentes ────────────────────────────────────────────────────
function Spin() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'32px 0' }}>
      <div style={{ width:20,height:20,borderRadius:'50%',border:'2px solid rgba(22,19,19,0.08)',borderTopColor:'rgba(22,19,19,0.32)',animation:'vlSpin 0.7s linear infinite' }} />
    </div>
  )
}
function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9D3CA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}
function SLabel({ children }) {
  return (
    <p style={{ margin:'0 0 10px', fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
      {children}
    </p>
  )
}
function SRow({ label, value, last }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0', borderBottom:last?'none':'1px solid rgba(22,19,19,0.06)' }}>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>{label}</span>
      <span style={{ fontFamily:"'DM Sans',system-ui", fontSize:'12px', fontWeight:400, color:'#161313', textAlign:'right', maxWidth:'60%' }}>{value??'—'}</span>
    </div>
  )
}
