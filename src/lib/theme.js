/**
 * theme.js
 * Inyecta el color primario de la clínica en las variables CSS de Veloura.
 * Se llama desde ClinicContext cuando carga la clínica.
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}

function lighten(hex, amount) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function darken(hex, amount) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)))
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)))
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)))
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function applyClinicTheme(colorPrimario) {
  const color = colorPrimario || '#C9A46A'
  const rgb   = hexToRgb(color)
  if (!rgb) return

  const root = document.documentElement

  root.style.setProperty('--vl-brand',              color)
  root.style.setProperty('--vl-brand-light',        lighten(color, 0.35))
  root.style.setProperty('--vl-brand-pale',         lighten(color, 0.72))
  root.style.setProperty('--vl-brand-dark',         darken(color, 0.20))
  root.style.setProperty('--vl-brand-alpha',        `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`)
  root.style.setProperty('--vl-brand-alpha-border', `rgba(${rgb.r},${rgb.g},${rgb.b},0.22)`)
  root.style.setProperty('--vl-shadow-brand',       `0 4px 16px rgba(${rgb.r},${rgb.g},${rgb.b},0.20)`)
}

export function resetTheme() {
  applyClinicTheme('#C9A46A')
}
