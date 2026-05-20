import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useChat(userEmail, clinicaId) {
  const [mensajes,   setMensajes]   = useState([])
  const [medico,     setMedico]     = useState(null)
  const [pacienteId, setPacienteId] = useState(null)
  const [medicoId,   setMedicoId]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [error,      setError]      = useState(null)

  const canalRef = useRef(null)

  // ── cargar mensajes ──────────────────────────────────────────
  async function cargarMensajes(pId, mId) {
    const { data, error: err } = await supabase
      .from('mensajes')
      .select('id, remitente_id, destinatario_id, contenido, tipo, leido, fecha_lectura, creado_en')
      .eq('clinica_id', clinicaId)
      .or(
        `and(remitente_id.eq.${pId},destinatario_id.eq.${mId}),` +
        `and(remitente_id.eq.${mId},destinatario_id.eq.${pId})`
      )
      .order('creado_en', { ascending: true })
      .limit(100)

    if (err) { setError(err.message); return }
    setMensajes(data ?? [])
  }

  // ── suscripción Realtime ─────────────────────────────────────
  function suscribir(pId, mId) {
    const canal = supabase
      .channel(`chat-${clinicaId}-${pId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'mensajes',
          filter: `clinica_id=eq.${clinicaId}`,
        },
        (payload) => {
          const msg = payload.new
          const pertenece =
            (msg.remitente_id === pId && msg.destinatario_id === mId) ||
            (msg.remitente_id === mId && msg.destinatario_id === pId)
          if (!pertenece) return
          setMensajes((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            // reemplaza optimista si existe
            const sinOptimista = prev.filter((m) => !m._optimista)
            return [...sinOptimista, msg]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'mensajes',
          filter: `clinica_id=eq.${clinicaId}`,
        },
        (payload) => {
          const msg = payload.new
          setMensajes((prev) =>
            prev.map((m) => (m.id === msg.id ? msg : m))
          )
        }
      )
      .subscribe()

    canalRef.current = canal
  }

  // ── efecto de montaje ────────────────────────────────────────
  useEffect(() => {
    if (!userEmail || !clinicaId) return

    let cancelled = false

    async function init() {
      setLoading(true)
      setError(null)

      // 1. Obtener paciente
      const { data: pacienteData, error: errP } = await supabase
        .from('pacientes')
        .select('id, medico_id')
        .eq('email', userEmail)
        .eq('clinica_id', clinicaId)
        .single()

      if (errP || !pacienteData) {
        if (!cancelled) { setError(errP?.message ?? 'Paciente no encontrado'); setLoading(false) }
        return
      }

      const pId = pacienteData.id
      const mId = pacienteData.medico_id

      // 2. Obtener médico
      const { data: medicoData, error: errM } = await supabase
        .from('medicos')
        .select('id, nombre, foto, especialidad')
        .eq('id', mId)
        .single()

      if (!cancelled) {
        setPacienteId(pId)
        setMedicoId(mId)
        setMedico(medicoData ?? null)
        if (errM) setError(errM.message)
      }

      // 3. Cargar mensajes y suscribir
      await cargarMensajes(pId, mId)
      if (!cancelled) {
        suscribir(pId, mId)
        setLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
      if (canalRef.current) supabase.removeChannel(canalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, clinicaId])

  // ── enviar mensaje ───────────────────────────────────────────
  async function enviarMensaje(contenido) {
    if (!contenido || !pacienteId || !medicoId) return
    setSending(true)
    setError(null)

    const tempId = `opt-${Date.now()}`
    const optimista = {
      id:              tempId,
      remitente_id:    pacienteId,
      destinatario_id: medicoId,
      contenido,
      tipo:            'texto',
      leido:           false,
      fecha_lectura:   null,
      creado_en:       new Date().toISOString(),
      _optimista:      true,
    }

    setMensajes((prev) => [...prev, optimista])

    const { data, error: errI } = await supabase
      .from('mensajes')
      .insert({
        clinica_id:      clinicaId,
        remitente_id:    pacienteId,
        destinatario_id: medicoId,
        contenido,
        tipo:            'texto',
        leido:           false,
      })
      .select()
      .single()

    if (errI) {
      setMensajes((prev) => prev.filter((m) => m.id !== tempId))
      setError(errI.message)
    } else {
      setMensajes((prev) =>
        prev.map((m) => (m.id === tempId ? data : m))
      )
    }

    setSending(false)
  }

  // ── marcar leídos ────────────────────────────────────────────
  async function marcarLeidos() {
    if (!pacienteId || !medicoId) return
    await supabase
      .from('mensajes')
      .update({ leido: true, fecha_lectura: new Date().toISOString() })
      .eq('remitente_id', medicoId)
      .eq('destinatario_id', pacienteId)
      .eq('leido', false)
  }

  const sinLeer = mensajes.filter(
    (m) => m.remitente_id === medicoId && !m.leido
  ).length

  return {
    mensajes,
    medico,
    pacienteId,
    medicoId,
    loading,
    sending,
    error,
    sinLeer,
    enviarMensaje,
    refetch: () => pacienteId && medicoId && cargarMensajes(pacienteId, medicoId),
  }
}
