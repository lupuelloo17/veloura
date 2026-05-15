export const PLANES = {
  esencial: {
    nombre: 'Plan Esencial',
    precio_cop: 990000,
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
    precio_cop: 1990000,
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
    precio_cop: 3490000,
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

export function formatCOP(amount) {
  if (amount === Infinity) return 'Ilimitado'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}
