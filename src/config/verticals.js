// ─────────────────────────────────────────────────────────────────────────────
//  Veloura — Sistema de verticales modulares
//
//  Cada vertical define la terminología que se muestra en toda la UI.
//  Para añadir un nuevo tipo de negocio: copia un bloque, cambia el id
//  y ajusta las etiquetas. No toques el código de los componentes.
//
//  Campo DB (futuro): clinicas.tipo_negocio text DEFAULT 'medicina_estetica'
//  Mientras no exista en DB, useVertical() siempre devuelve medicina_estetica.
// ─────────────────────────────────────────────────────────────────────────────

export const VERTICALS = {

  medicina_estetica: {
    id:           'medicina_estetica',
    nombre:       'Medicina Estética',
    // ── Roles ────────────────────────────────────────────────────
    admin:        'Admin',
    medico:       'Médico',
    medicos:      'Médicos',
    recepcion:    'Recepción',
    // ── Entidades principales ─────────────────────────────────────
    paciente:     'Paciente',
    pacientes:    'Pacientes',
    tratamiento:  'Tratamiento',
    tratamientos: 'Tratamientos',
    sesion:       'Sesión',
    sesiones:     'Sesiones',
    cita:         'Cita',
    citas:        'Citas',
    // ── Navegación ────────────────────────────────────────────────
    navPacientes: 'Pacientes',
    navAnalisis:  'Análisis',
    navEquipo:    'Equipo',
    navAgenda:    'Agenda',
  },

  psicologia: {
    id:           'psicologia',
    nombre:       'Psicología y Terapia',
    admin:        'Admin',
    medico:       'Psicólogo',
    medicos:      'Psicólogos',
    recepcion:    'Secretaría',
    paciente:     'Consultante',
    pacientes:    'Consultantes',
    tratamiento:  'Programa',
    tratamientos: 'Programas',
    sesion:       'Sesión',
    sesiones:     'Sesiones',
    cita:         'Cita',
    citas:        'Citas',
    navPacientes: 'Consultantes',
    navAnalisis:  'Seguimiento',
    navEquipo:    'Equipo',
    navAgenda:    'Agenda',
  },

  nutricion: {
    id:           'nutricion',
    nombre:       'Nutrición y Dietética',
    admin:        'Admin',
    medico:       'Nutricionista',
    medicos:      'Nutricionistas',
    recepcion:    'Recepción',
    paciente:     'Cliente',
    pacientes:    'Clientes',
    tratamiento:  'Plan',
    tratamientos: 'Planes',
    sesion:       'Consulta',
    sesiones:     'Consultas',
    cita:         'Cita',
    citas:        'Citas',
    navPacientes: 'Clientes',
    navAnalisis:  'Seguimiento',
    navEquipo:    'Equipo',
    navAgenda:    'Agenda',
  },

  odontologia: {
    id:           'odontologia',
    nombre:       'Odontología',
    admin:        'Admin',
    medico:       'Dentista',
    medicos:      'Dentistas',
    recepcion:    'Recepción',
    paciente:     'Paciente',
    pacientes:    'Pacientes',
    tratamiento:  'Tratamiento',
    tratamientos: 'Tratamientos',
    sesion:       'Consulta',
    sesiones:     'Consultas',
    cita:         'Cita',
    citas:        'Citas',
    navPacientes: 'Pacientes',
    navAnalisis:  'Radiografías',
    navEquipo:    'Equipo',
    navAgenda:    'Agenda',
  },

  veterinaria: {
    id:           'veterinaria',
    nombre:       'Veterinaria',
    admin:        'Admin',
    medico:       'Veterinario',
    medicos:      'Veterinarios',
    recepcion:    'Recepción',
    paciente:     'Mascota',
    pacientes:    'Mascotas',
    tratamiento:  'Tratamiento',
    tratamientos: 'Tratamientos',
    sesion:       'Consulta',
    sesiones:     'Consultas',
    cita:         'Cita',
    citas:        'Citas',
    navPacientes: 'Mascotas',
    navAnalisis:  'Diagnósticos',
    navEquipo:    'Equipo',
    navAgenda:    'Agenda',
  },

}

/** Vertical por defecto mientras no exista clinicas.tipo_negocio en DB */
export const DEFAULT_VERTICAL = 'medicina_estetica'

/**
 * Devuelve el mapa de etiquetas para un tipo_negocio dado.
 * Si el tipo no existe o es undefined, usa el vertical por defecto.
 */
export function getVertical(tipo_negocio) {
  return VERTICALS[tipo_negocio] ?? VERTICALS[DEFAULT_VERTICAL]
}
