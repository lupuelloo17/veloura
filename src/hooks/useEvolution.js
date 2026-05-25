import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export function useEvolution(pacienteId, clinicaId) {
  const [fotosPorSesion, setFotosPorSesion] = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchFotos = useCallback(async () => {
    if (!pacienteId || !clinicaId || !isValidUUID(pacienteId) || !isValidUUID(clinicaId)) { setLoading(false); return }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('evoluciones')
        .select('id, fase, zona_corporal, notas, sesion_numero, foto_url, creado_en')
        .eq('paciente_id', pacienteId)
        .eq('clinica_id',  clinicaId)
        .order('creado_en', { ascending: false })

      if (fetchErr) throw fetchErr

      // Agrupa por sesion_numero
      const agrupado = {}
      for (const foto of data ?? []) {
        const key = foto.sesion_numero ?? 1
        if (!agrupado[key]) agrupado[key] = []
        agrupado[key].push(foto)
      }

      setFotosPorSesion(agrupado)
    } catch (err) {
      setError(err.message || 'Error al cargar las fotos')
    } finally {
      setLoading(false)
    }
  }, [pacienteId, clinicaId])

  useEffect(() => { fetchFotos() }, [fetchFotos])

  async function subirFoto({ archivo, fase, zona_corporal, notas, sesion_numero }) {
    if (!supabase || !pacienteId || !clinicaId || !isValidUUID(pacienteId) || !isValidUUID(clinicaId)) throw new Error('Sin conexión')

    const ext  = archivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${pacienteId}/${sesion_numero}-${fase}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('evoluciones')
      .upload(path, archivo, { upsert: false, contentType: archivo.type })
    if (upErr) throw upErr

    const { data: pub } = supabase.storage.from('evoluciones').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('evoluciones').insert({
      paciente_id:    pacienteId,
      clinica_id:     clinicaId,
      foto_url:       pub.publicUrl,
      fase,
      zona_corporal,
      notas,
      sesion_numero,
    })
    if (dbErr) throw dbErr

    await fetchFotos()
  }

  return { fotosPorSesion, loading, error, subirFoto, refetch: fetchFotos }
}
