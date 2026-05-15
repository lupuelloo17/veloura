export const PLANES = {
  esencial: {
    nombre: 'Plan Esencial',
    precio: 149,
    moneda: 'EUR',
    periodo: 'mes',
    descripcion: 'Para clínicas que empiezan',
    max_pacientes: 100,
    max_medicos: 1,
    max_sedes: 1,
    features: {
      citas: true,
      historial_fotos: true,
      protocolos: true,
      dashboard_basico: true,
      dermoscopia_ia: false,
      cosmeceuticos: false,
      supervision_remota: false,
      alertas_abandono: false,
      multisede: false,
    },
  },
  premium: {
    nombre: 'Plan Premium',
    precio: 249,
    moneda: 'EUR',
    periodo: 'mes',
    descripcion: 'El más elegido por clínicas en crecimiento',
    max_pacientes: 300,
    max_medicos: 4,
    max_sedes: 1,
    features: {
      citas: true,
      historial_fotos: true,
      protocolos: true,
      dashboard_basico: true,
      dermoscopia_ia: true,
      cosmeceuticos: true,
      supervision_remota: true,
      alertas_abandono: true,
      multisede: false,
    },
  },
  elite: {
    nombre: 'Plan Élite',
    precio: 399,
    moneda: 'EUR',
    periodo: 'mes',
    descripcion: 'Para grupos de clínicas y franquicias',
    max_pacientes: Infinity,
    max_medicos: Infinity,
    max_sedes: Infinity,
    features: {
      citas: true,
      historial_fotos: true,
      protocolos: true,
      dashboard_basico: true,
      dermoscopia_ia: true,
      cosmeceuticos: true,
      supervision_remota: true,
      alertas_abandono: true,
      multisede: true,
    },
  },
}

export const FEATURE_LABELS = {
  citas:               'Gestión de citas',
  historial_fotos:     'Historial fotográfico',
  protocolos:          'Protocolos de tratamiento',
  dashboard_basico:    'Dashboard clínico',
  dermoscopia_ia:      'Dermoscopia asistida por IA',
  cosmeceuticos:       'Recomendaciones cosmecéuticas',
  supervision_remota:  'Supervisión remota',
  alertas_abandono:    'Alertas de abandono de tratamiento',
  multisede:           'Gestión multi-sede',
}

// Formato: 149 € · 1.990 € · "Ilimitado"
export function formatEUR(amount) {
  if (amount === Infinity || amount == null) return 'Ilimitado'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
