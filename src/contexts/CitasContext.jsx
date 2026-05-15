import { createContext, useContext, useState } from 'react'

// ── Catálogo de tratamientos · precios en EUR ──────────────────────────────
export const TRATAMIENTOS = [
  { label: 'Consulta inicial',          duracion: 60,  precio: 80  },
  { label: 'Toxina botulínica',         duracion: 30,  precio: 250 },
  { label: 'Ácido hialurónico labios',  duracion: 45,  precio: 350 },
  { label: 'Peeling químico',           duracion: 60,  precio: 120 },
  { label: 'Radiofrecuencia facial',    duracion: 60,  precio: 180 },
  { label: 'Mesoterapia facial',        duracion: 45,  precio: 150 },
  { label: 'Tratamiento antimanchas',   duracion: 60,  precio: 200 },
  { label: 'Revisión y seguimiento',    duracion: 30,  precio: 50  },
  { label: 'Otro',                      duracion: null, precio: null },
]

// ── Estilos por estado ─────────────────────────────────────────────────────
export const ESTADO_STYLE = {
  pendiente:  { bg: '#fef9c3', text: '#a16207', border: '#fde68a', label: 'Pendiente'  },
  confirmada: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: 'Confirmada' },
  completada: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', label: 'Completada' },
  cancelada:  { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', label: 'Cancelada'  },
  no_asistio: { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb', label: 'No asistió' },
}

// ── Lista de pacientes para el selector ───────────────────────────────────
export const MOCK_PACIENTES_LISTA = [
  { id: 'p1', nombre: 'Ana Martínez',    email: 'ana.martinez@email.es',   telefono: '+34 612 345 678', ultima_visita: '12/11/2025', foto: null, rgpd_aceptado: true, marketing_aceptado: true  },
  { id: 'p2', nombre: 'Carmen López',    email: 'carmen.lopez@email.es',   telefono: '+34 698 765 432', ultima_visita: '05/12/2025', foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', rgpd_aceptado: true, marketing_aceptado: false },
  { id: 'p3', nombre: 'María Fernández', email: 'maria.fdez@email.es',     telefono: '+34 655 123 456', ultima_visita: '18/01/2026', foto: null, rgpd_aceptado: true, marketing_aceptado: true  },
  { id: 'p4', nombre: 'Laura Sánchez',   email: 'laura.sanchez@email.es',  telefono: '+34 677 234 567', ultima_visita: '02/02/2026', foto: null, rgpd_aceptado: true, marketing_aceptado: false },
  { id: 'p5', nombre: 'Isabel Torres',   email: 'isabel.torres@email.es',  telefono: '+34 634 456 789', ultima_visita: '14/03/2026', foto: null, rgpd_aceptado: true, marketing_aceptado: true  },
  { id: 'p6', nombre: 'Patricia Ruiz',   email: 'patricia.ruiz@email.es',  telefono: '+34 612 789 012', ultima_visita: '28/03/2026', foto: null, rgpd_aceptado: true, marketing_aceptado: true  },
]

// ── Helper ─────────────────────────────────────────────────────────────────
function d(dateStr, h, m = 0) {
  return new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
}

// ── 8 citas de prueba · semana laboral 2026-05-11 (lu) → 2026-05-15 (vi) ──
const INITIAL_CITAS = [

  // ── Lunes 11 mayo ──────────────────────────────────────────────────────
  {
    id: 'c1', clinica_id: 'mock-lumiere',
    paciente_id: 'p6', paciente_nombre: 'Patricia Ruiz',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Consulta inicial', precio: 80,
    fecha: d('2026-05-11', 9),
    duracion_minutos: 60, estado: 'completada',
    notas_previas: 'Primera visita. Manchas solares en frente y mejillas. Se recomienda serie de peelings químicos.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: true,
    creado_en: d('2026-05-06', 10),
  },
  {
    id: 'c2', clinica_id: 'mock-lumiere',
    paciente_id: 'p5', paciente_nombre: 'Isabel Torres',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Toxina botulínica', precio: 250,
    fecha: d('2026-05-11', 11, 30),
    duracion_minutos: 30, estado: 'completada',
    notas_previas: 'Zona de entrecejo y frente. Dosis habitual 20 u. Resultado natural.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: true,
    creado_en: d('2026-05-06', 11),
  },

  // ── Martes 12 mayo ─────────────────────────────────────────────────────
  {
    id: 'c3', clinica_id: 'mock-lumiere',
    paciente_id: 'p3', paciente_nombre: 'María Fernández',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Peeling químico', precio: 120,
    fecha: d('2026-05-12', 10),
    duracion_minutos: 60, estado: 'completada',
    notas_previas: 'Peeling con TCA al 20 %. Piel con hiperpigmentación leve en zona T.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: true,
    creado_en: d('2026-05-07', 9),
  },

  // ── Miércoles 13 mayo ──────────────────────────────────────────────────
  {
    id: 'c4', clinica_id: 'mock-lumiere',
    paciente_id: 'p4', paciente_nombre: 'Laura Sánchez',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Tratamiento antimanchas', precio: 200,
    fecha: d('2026-05-13', 9),
    duracion_minutos: 60, estado: 'no_asistio',
    notas_previas: 'No se presentó a la cita. Llamar para reagendar.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: true,
    creado_en: d('2026-05-08', 10),
  },
  {
    id: 'c5', clinica_id: 'mock-lumiere',
    paciente_id: 'p1', paciente_nombre: 'Ana Martínez',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Radiofrecuencia facial', precio: 180,
    fecha: d('2026-05-13', 14),
    duracion_minutos: 60, estado: 'confirmada',
    notas_previas: 'Sesión 2 de 4. Piel sensible — potencia al 70 %.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: false,
    creado_en: d('2026-05-08', 14),
  },

  // ── Jueves 14 mayo ─────────────────────────────────────────────────────
  {
    id: 'c6', clinica_id: 'mock-lumiere',
    paciente_id: 'p2', paciente_nombre: 'Carmen López',
    paciente_foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Mesoterapia facial', precio: 150,
    fecha: d('2026-05-14', 11),
    duracion_minutos: 45, estado: 'confirmada',
    notas_previas: 'Cóctel vitamínico C + ácido hialurónico. Zona periocular y pómulos.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: false,
    creado_en: d('2026-05-09', 9),
  },

  // ── Viernes 15 mayo (hoy) ──────────────────────────────────────────────
  {
    id: 'c7', clinica_id: 'mock-lumiere',
    paciente_id: 'p1', paciente_nombre: 'Ana Martínez',
    paciente_foto: null,
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Revisión y seguimiento', precio: 50,
    fecha: d('2026-05-15', 10),
    duracion_minutos: 30, estado: 'pendiente',
    notas_previas: 'Control post radiofrecuencia. Valorar evolución y planificar sesión 3.',
    recordatorio_24h_enviado: true, recordatorio_2h_enviado: false,
    creado_en: d('2026-05-10', 10),
  },
  {
    id: 'c8', clinica_id: 'mock-lumiere',
    paciente_id: 'p2', paciente_nombre: 'Carmen López',
    paciente_foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    medico_id: 'mock-garcia', medico_nombre: 'Dra. María García',
    tratamiento: 'Ácido hialurónico labios', precio: 350,
    fecha: d('2026-05-15', 16),
    duracion_minutos: 45, estado: 'pendiente',
    notas_previas: 'Relleno de labios. 1 ml de Juvéderm Volift. Estilo natural.',
    recordatorio_24h_enviado: false, recordatorio_2h_enviado: false,
    creado_en: d('2026-05-10', 11),
  },
]

// ── Context ────────────────────────────────────────────────────────────────
const CitasContext = createContext(null)

export function CitasProvider({ children }) {
  const [citas, setCitas] = useState(INITIAL_CITAS)

  function crearCita(data) {
    const cita = {
      id: 'c' + Date.now(),
      clinica_id: 'mock-lumiere',
      medico_id: 'mock-garcia',
      medico_nombre: 'Dra. García',
      recordatorio_24h_enviado: false,
      recordatorio_2h_enviado: false,
      creado_en: new Date(),
      ...data,
    }
    setCitas(prev => [...prev, cita])
    return cita
  }

  function actualizarCita(id, cambios) {
    setCitas(prev => prev.map(c => c.id === id ? { ...c, ...cambios } : c))
  }

  return (
    <CitasContext.Provider value={{ citas, crearCita, actualizarCita }}>
      {children}
    </CitasContext.Provider>
  )
}

export function useCitas() {
  const ctx = useContext(CitasContext)
  if (!ctx) throw new Error('useCitas must be inside <CitasProvider>')
  return ctx
}
