import { useState } from 'react'
import { X, Check, User, Mail, Phone, Calendar, Droplets, AlertCircle, MessageSquare } from 'lucide-react'
import { useClinic } from '../contexts/ClinicContext'
import { supabase } from '../lib/supabase'

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

export default function NuevoPacienteDrawer({ onClose, onGuardado }) {
  const { clinica } = useClinic()
  const brand = clinica?.color_primario ?? '#C8A882'

  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [telefono, setTelefono] = useState('+34 ')
  const [fechaNac, setFechaNac] = useState('')
  const [tipoPiel, setTipoPiel] = useState('')
  const [alergias, setAlergias] = useState('')
  const [motivo,   setMotivo]   = useState('')

  const [errors,   setErrors]   = useState({})
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    const errs = validate({ nombre, email })
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setGuardando(true)

    // Split "Nombre Apellido Apellido2" → nombre + apellido
    const partes   = nombre.trim().split(/\s+/)
    const primerNombre = partes[0]
    const apellido     = partes.slice(1).join(' ') || '—'

    const nuevoPaciente = {
      nombre:           primerNombre,
      apellido,
      email:            email.trim(),
      telefono,
      fecha_nacimiento: fechaNac || null,
      tipo_piel:        tipoPiel || null,
      alergias:         alergias.trim() || null,
      motivo_consulta:  motivo.trim()   || null,
      clinica_id:       clinica?.id ?? 'mock-lumiere',
      riesgo:           'bajo',
      total_visitas:    0,
      rgpd_aceptado:    false,
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl flex flex-col animate-slide-up"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-gray-900 font-bold text-base">Nuevo paciente</h2>
            <p className="text-gray-400 text-xs">Rellena los datos del paciente</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

          {/* Error de envío */}
          {errors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-xs">{errors.submit}</p>
            </div>
          )}

          {/* Nombre */}
          <Field label="Nombre completo *" icon={User} error={errors.nombre}>
            <input
              value={nombre}
              onChange={e => { setNombre(e.target.value); setErrors(prev => ({ ...prev, nombre: null })) }}
              placeholder="Ana Martínez García"
              autoComplete="name"
              className={inputCls(!!errors.nombre)}
            />
          </Field>

          {/* Email */}
          <Field label="Email *" icon={Mail} error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })) }}
              placeholder="ana@email.es"
              autoComplete="email"
              className={inputCls(!!errors.email)}
            />
          </Field>

          {/* Teléfono */}
          <Field label="Teléfono" icon={Phone}>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="+34 612 345 678"
              autoComplete="tel"
              className={inputCls(false)}
            />
            <p className="text-gray-400 text-[10px] mt-1">Prefijo +34 incluido</p>
          </Field>

          {/* Fecha de nacimiento */}
          <Field label="Fecha de nacimiento" icon={Calendar}>
            <input
              type="date"
              value={fechaNac}
              onChange={e => setFechaNac(e.target.value)}
              className={inputCls(false)}
            />
          </Field>

          {/* Tipo de piel */}
          <Field label="Tipo de piel" icon={Droplets}>
            <div className="flex flex-wrap gap-2">
              {TIPOS_PIEL.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoPiel(prev => prev === t ? '' : t)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                  style={tipoPiel === t
                    ? { backgroundColor: brand, borderColor: brand, color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Alergias */}
          <Field label="Alergias o medicación actual" icon={AlertCircle}>
            <textarea
              value={alergias}
              onChange={e => setAlergias(e.target.value)}
              placeholder="Ej: alérgica al ibuprofeno, penicilina…"
              rows={2}
              className={`${inputCls(false)} resize-none`}
            />
          </Field>

          {/* Motivo de consulta */}
          <Field label="Motivo de consulta" icon={MessageSquare}>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: manchas solares, arrugas de expresión…"
              rows={2}
              className={`${inputCls(false)} resize-none`}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: guardando ? '#d1d5db' : brand }}
          >
            {guardando
              ? 'Guardando…'
              : <><Check size={16} /> Guardar paciente</>
            }
          </button>
          <p className="text-center text-gray-400 text-xs mt-2">* Campos obligatorios</p>
        </div>
      </div>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function inputCls(hasError) {
  return `w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400'
      : 'border-gray-200 focus:border-[#C8A882] focus:ring-1 focus:ring-[#C8A882]'
  }`
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-gray-400" />
        <label className="text-gray-600 text-xs font-medium">{label}</label>
      </div>
      {children}
      {error && (
        <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}
