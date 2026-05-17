
// ── Helpers de formato ────────────────────────────────────────────────────
export function fTime(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function fDate(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function fDateShort(date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ── Persistencia de descartados (por sesión) ──────────────────────────────
const DISMISSED_KEY = 'glowai_rem_dismissed'

function getDismissed() {
  try { return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}

export function dismissReminder(id) {
  const list = getDismissed()
  if (!list.includes(id)) {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
  }
}

// ── Lógica principal ───────────────────────────────────────────────────────
export function checkRecordatorios(citas) {
  const now      = new Date()
  const dismissed = getDismissed()
  const result   = []

  for (const cita of citas) {
    if (['cancelada', 'completada', 'no_asistio'].includes(cita.estado)) continue

    const fecha   = cita.fecha instanceof Date ? cita.fecha : new Date(cita.fecha)
    const diffMs  = fecha.getTime() - now.getTime()
    const diffH   = diffMs / 3_600_000

    if (diffMs < 0) continue  // cita ya pasó

    const nombre = cita.paciente_nombre.split(' ')[0]

    // ── Recordatorio 2 horas (azul o rojo) ───────────────────────────
    const id2h = `2h_${cita.id}`
    if (diffH <= 2.5 && !cita.recordatorio_2h_enviado && !dismissed.includes(id2h)) {
      result.push({
        id: id2h,
        tipo: '2h',
        urgencia: diffH <= 1 ? 'danger' : 'info',
        cita,
        para_medico: false,
        mensaje: `Tu cita de ${cita.tratamiento} es hoy a las ${fTime(fecha)}. Te esperamos en Clínica Lumière. ¡Recuerda llegar 5 minutos antes!`,
        acciones: [],
      })
    }

    // ── Recordatorio 24 horas (azul) ─────────────────────────────────
    const id24 = `24h_${cita.id}`
    if (diffH >= 20 && diffH <= 28 && !cita.recordatorio_24h_enviado && !dismissed.includes(id24)) {
      result.push({
        id: id24,
        tipo: '24h',
        urgencia: 'info',
        cita,
        para_medico: false,
        mensaje: `Hola ${nombre}, te recordamos tu cita mañana ${fDate(fecha)} a las ${fTime(fecha)} con ${cita.medico_nombre} en Clínica Lumière. ¿Confirmas tu asistencia?`,
        acciones: cita.estado === 'pendiente' ? ['confirmar', 'cancelar'] : [],
      })
    }

    // ── Alerta al médico: paciente sin confirmar (amarillo) ───────────
    const idNc = `noconf_${cita.id}`
    if (
      diffH > 2 && diffH <= 28 &&
      cita.estado === 'pendiente' &&
      !dismissed.includes(idNc)
    ) {
      result.push({
        id: idNc,
        tipo: 'sin_confirmar',
        urgencia: 'warning',
        cita,
        para_medico: true,
        mensaje: `${cita.paciente_nombre} no ha confirmado su cita para las ${fTime(fecha)}. ¿Quieres llamarle?`,
        acciones: ['marcar_recordado'],
      })
    }
  }

  return result
}
