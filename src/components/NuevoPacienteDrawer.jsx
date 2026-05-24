import { useState } from 'react'
import { useClinic } from '../contexts/ClinicContext'
import { supabase } from '../lib/supabase'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const TIPOS_PIEL = ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible']

const PHONE_RE = /^\+34\s?[6-9]\d{2}\s?\d{3}\s?\d{3}$/

function validate(fields) {
  const errors = {}
  if (!fields.nombre.trim())           errors.nombre = 'El nombre es obligatorio'
  if (!fields.email.trim())            errors.email  = 'El email es obligatorio'
  else if (!fields.email.includes('@') || !fields.email.includes('.'))
                                       errors.email  = 'Introduce un email válido'
  return errors
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#F7F5F2',
  border: '1px solid rgba(22,19,19,0.08)',
  borderRadius: '2px',
  fontFamily: DM_SANS,
  fontSize: '13px',
  fontWeight: 300,
  color: '#161313',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: '16px',
}

const inputErrorStyle = {
  ...inputStyle,
  border: '1px solid rgba(139,58,58,0.4)',
  background: 'rgba(139,58,58,0.03)',
}

export default function NuevoPacienteDrawer({ onClose, onGuardado }) {
  const { clinica } = useClinic()

  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [telefono, setTelefono] = useState('+34 ')
  const [fechaNac, setFechaNac] = useState('')
  const [tipoPiel, setTipoPiel] = useState('')
  const [alergias, setAlergias] = useState('')
  const [motivo,   setMotivo]   = useState('')

  const [errors,    setErrors]   = useState({})
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    const errs = validate({ nombre, email })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setGuardando(true)

    // Split "Nombre Apellido Apellido2" → nombre + apellido
    const partes       = nombre.trim().split(/\s+/)
    const primerNombre = partes[0]
    const apellido     = partes.slice(1).join(' ') || '—'

    const nuevoPaciente = {
      nombre:             primerNombre,
      apellido,
      email:              email.trim(),
      telefono,
      fecha_nacimiento:   fechaNac || null,
      tipo_piel:          tipoPiel || null,
      alergias:           alergias.trim() || null,
      motivo_consulta:    motivo.trim()   || null,
      clinica_id:         clinica?.id ?? 'mock-lumiere',
      riesgo:             'bajo',
      total_visitas:      0,
      rgpd_aceptado:      false,
      marketing_aceptado: false,
    }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('pacientes')
          .insert(nuevoPaciente)
          .select()
          .single()
        if (error) throw error
        onGuardado(data)
      } else {
        // Mock: generate a local id and return
        onGuardado({ ...nuevoPaciente, id: 'p' + Date.now() })
      }
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,19,0.4)', zIndex: 40 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '480px', background: '#FFFFFF', zIndex: 50, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(22,19,19,0.06)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: '#161313', margin: 0 }}>Nuevo paciente</h2>
            <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', marginTop: '2px', marginBottom: 0 }}>Rellena los datos del paciente</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '22px', lineHeight: 1, color: 'rgba(22,19,19,0.3)', cursor: 'pointer', padding: 0, marginTop: '2px' }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

          {/* Error de envío */}
          {errors.submit && (
            <div style={{ background: 'rgba(139,58,58,0.05)', border: '1px solid rgba(139,58,58,0.2)', borderLeft: '3px solid rgba(139,58,58,0.4)', borderRadius: '2px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '13px', color: '#8B3A3A', flexShrink: 0 }} />
              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#8B3A3A', margin: 0 }}>{errors.submit}</p>
            </div>
          )}

          {/* Nombre completo */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Nombre completo *
          </label>
          <input
            value={nombre}
            onChange={e => { setNombre(e.target.value); setErrors(prev => ({ ...prev, nombre: null })) }}
            placeholder="Ana Martínez García"
            autoComplete="name"
            style={errors.nombre ? inputErrorStyle : inputStyle}
          />
          {errors.nombre && (
            <span style={{ fontFamily: DM_SANS, fontSize: '10px', color: '#8B3A3A', display: 'block', marginTop: '-10px', marginBottom: '8px' }}>{errors.nombre}</span>
          )}

          {/* Email */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })) }}
            placeholder="ana@email.es"
            autoComplete="email"
            style={errors.email ? inputErrorStyle : inputStyle}
          />
          {errors.email && (
            <span style={{ fontFamily: DM_SANS, fontSize: '10px', color: '#8B3A3A', display: 'block', marginTop: '-10px', marginBottom: '8px' }}>{errors.email}</span>
          )}

          {/* Teléfono */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Teléfono
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="+34 612 345 678"
            autoComplete="tel"
            style={inputStyle}
          />

          {/* Fecha de nacimiento */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={fechaNac}
            onChange={e => setFechaNac(e.target.value)}
            style={inputStyle}
          />

          {/* Tipo de piel */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Tipo de piel
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {TIPOS_PIEL.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoPiel(prev => prev === t ? '' : t)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontFamily: DM_SANS,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  border: 'none',
                  ...(tipoPiel === t
                    ? { background: '#161313', color: '#F7F5F2' }
                    : { background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', color: 'rgba(22,19,19,0.4)' }
                  ),
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Alergias o medicación */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Alergias o medicación actual
          </label>
          <textarea
            value={alergias}
            onChange={e => setAlergias(e.target.value)}
            placeholder="Ej: alérgica al ibuprofeno, penicilina…"
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />

          {/* Motivo de consulta */}
          <label style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.35)', marginBottom: '6px', display: 'block' }}>
            Motivo de consulta
          </label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: manchas solares, arrugas de expresión…"
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(22,19,19,0.06)', flexShrink: 0 }}>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              width: '100%',
              background: '#161313',
              color: '#F7F5F2',
              border: 'none',
              borderRadius: '2px',
              padding: '13px',
              fontFamily: DM_SANS,
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: guardando ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar paciente'}
          </button>
          <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.25)', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            * Campos obligatorios
          </p>
        </div>
      </div>
    </>
  )
}
