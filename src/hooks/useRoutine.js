import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRoutine(userEmail, clinicaId) {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchRoutines = useCallback(async () => {
    if (!userEmail || !clinicaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Obtener paciente por email y clinica_id
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('email', userEmail)
        .eq('clinica_id', clinicaId)
        .single()

      if (pacienteError) throw pacienteError
      if (!pacienteData) {
        setRutinas([])
        setLoading(false)
        return
      }

      const pacienteId = pacienteData.id

      // 2. Cargar rutinas activas del paciente
      const { data: rutinasData, error: rutinasError } = await supabase
        .from('rutinas_paciente')
        .select('id, nombre, descripcion, periodo, asignado_en, medico_id')
        .eq('paciente_id', pacienteId)
        .eq('clinica_id', clinicaId)
        .eq('activo', true)
        .order('asignado_en', { ascending: false })

      if (rutinasError) throw rutinasError

      if (!rutinasData || rutinasData.length === 0) {
        setRutinas([])
        setLoading(false)
        return
      }

      const rutinaIds = rutinasData.map(r => r.id)
      const medicoIds = [...new Set(rutinasData.map(r => r.medico_id).filter(Boolean))]

      // 3. Cargar pasos de todas las rutinas
      const { data: pasosData, error: pasosError } = await supabase
        .from('pasos_rutina')
        .select('id, rutina_id, orden, momento, nombre_producto, instrucciones, advertencias, frecuencia_dias')
        .in('rutina_id', rutinaIds)
        .order('orden', { ascending: true })

      if (pasosError) throw pasosError

      // 4. Cargar médicos via email (medico_id apunta a usuarios.id, no a medicos.id)
      let medicosMap = {}
      if (medicoIds.length > 0) {
        const { data: usuariosMedicos } = await supabase
          .from('usuarios')
          .select('id, email')
          .in('id', medicoIds)

        const emails = (usuariosMedicos || []).map(u => u.email).filter(Boolean)
        if (emails.length) {
          const { data: medicosData } = await supabase
            .from('medicos')
            .select('id, nombre, foto, especialidad, email')
            .in('email', emails)

          if (medicosData) {
            ;(usuariosMedicos || []).forEach(u => {
              const medico = medicosData.find(m => m.email === u.email)
              if (medico) medicosMap[u.id] = medico
            })
          }
        }
      }

      // 5. Combinar rutinas con pasos y médico
      const rutinasCompletas = rutinasData.map(rutina => {
        const pasos = (pasosData || []).filter(p => p.rutina_id === rutina.id)
        const medico = medicosMap[rutina.medico_id] || null
        const pasos_manana = pasos.filter(p => p.momento === 'mañana' || p.momento === 'ambos')
        const pasos_noche  = pasos.filter(p => p.momento === 'noche'  || p.momento === 'ambos')

        return { ...rutina, pasos, medico, pasos_manana, pasos_noche }
      })

      setRutinas(rutinasCompletas)
    } catch (err) {
      setError(err.message || 'Error al cargar la rutina')
    } finally {
      setLoading(false)
    }
  }, [userEmail, clinicaId])

  useEffect(() => {
    fetchRoutines()
  }, [fetchRoutines])

  return { rutinas, loading, error, refetch: fetchRoutines }
}
