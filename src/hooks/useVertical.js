import { useClinic } from '../contexts/ClinicContext'
import { getVertical } from '../config/verticals'

/**
 * Devuelve el mapa de etiquetas para el vertical de la clínica actual.
 *
 * Lee clinica.tipo_negocio del contexto. Si el campo no existe todavía
 * en la DB (la columna se añadirá en una migración futura), cae
 * automáticamente al vertical 'medicina_estetica'.
 *
 * Uso:
 *   const v = useVertical()
 *   <span>{v.pacientes}</span>   // "Pacientes" | "Clientes" | "Mascotas"…
 *   <span>{v.medico}</span>      // "Médico" | "Psicólogo" | "Dentista"…
 */
export function useVertical() {
  const { clinica } = useClinic()
  return getVertical(clinica?.tipo_negocio)
}
