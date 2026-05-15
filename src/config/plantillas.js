// ── Plantillas de WhatsApp · español de España ────────────────────────────
// Variables entre corchetes se sustituyen antes del envío.
// marketing_aceptado debe ser true para enviar REACTIVACION.

export const PLANTILLAS_WHATSAPP = {
  bienvenida: {
    id: 'bienvenida',
    nombre: 'Bienvenida',
    solo_marketing: false,
    mensaje:
      'Hola [nombre] 👋 Bienvenido/a a [clinica].\n' +
      'Tu ficha ya está creada en nuestra app.\n' +
      'Estamos aquí para acompañarte en tu proceso.\n' +
      'Cualquier duda, escríbenos aquí. ✨',
  },

  recordatorio: {
    id: 'recordatorio',
    nombre: 'Recordatorio de cita',
    solo_marketing: false,
    mensaje:
      'Hola [nombre], te recordamos tu cita el [fecha] a las [hora] con [medico] en [clinica].\n' +
      '¿Confirmas tu asistencia? Responde Sí o No.',
  },

  confirmacion: {
    id: 'confirmacion',
    nombre: 'Confirmación recibida',
    solo_marketing: false,
    mensaje:
      'Perfecto, [nombre]. Tu cita del [fecha] a las [hora] está confirmada.\n' +
      'Te esperamos en [direccion]. Recuerda llegar 5 minutos antes.',
  },

  cancelacion: {
    id: 'cancelacion',
    nombre: 'Cita cancelada',
    solo_marketing: false,
    mensaje:
      'Hola [nombre], tu cita del [fecha] ha sido cancelada.\n' +
      'Puedes reservar una nueva fecha desde la app o llamándonos.',
  },

  reactivacion: {
    id: 'reactivacion',
    nombre: 'Reactivación de paciente',
    solo_marketing: true,     // solo enviar si marketing_aceptado === true
    mensaje:
      'Hola [nombre] 🌟 Llevamos un tiempo sin saber de ti. ¿Cómo estás llevando el tratamiento?\n' +
      'Si necesitas una revisión o tienes alguna duda, estamos a tu disposición 🙌',
  },
}

// ── Interpola las variables en una plantilla ──────────────────────────────
export function renderPlantilla(id, vars = {}) {
  const plantilla = PLANTILLAS_WHATSAPP[id]
  if (!plantilla) return ''
  return plantilla.mensaje.replace(/\[(\w+)\]/g, (_, key) => vars[key] ?? `[${key}]`)
}
