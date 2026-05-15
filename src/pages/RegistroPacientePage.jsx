import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, User, Phone, FileText, Shield } from 'lucide-react'

const BRAND = '#C8A882'

const DNI_RE  = /^[0-9]{8}[A-Z]$/
const NIE_RE  = /^[XYZ][0-9]{7}[A-Z]$/
const PHONE_RE = /^\+34\s?[6-9]\d{2}\s?\d{3}\s?\d{3}$/

function validateDni(val) {
  if (!val) return null  // optional
  return (DNI_RE.test(val) || NIE_RE.test(val)) ? null : 'Formato: 12345678A o X1234567A'
}

export default function RegistroPacientePage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [paso, setPaso]   = useState(1)
  const [exito, setExito] = useState(false)

  // Paso 1 — Datos personales
  const [nombre, setNombre]   = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail]     = useState('')
  const [telefono, setTelefono] = useState('+34 ')
  const [fechaNac, setFechaNac] = useState('')

  // Paso 2 — Datos adicionales (opcionales)
  const [dni, setDni]         = useState('')
  const [tarjetaSanitaria, setTarjetaSanitaria] = useState('')
  const [medicoCabecera, setMedicoCabecera]     = useState('')
  const [alergias, setAlergias]                 = useState('')

  // Paso 3 — RGPD
  const [rgpd1, setRgpd1]     = useState(false)  // Política + RGPD (obligatorio)
  const [rgpd2, setRgpd2]     = useState(false)  // Datos de salud (obligatorio)
  const [rgpd3, setRgpd3]     = useState(false)  // Marketing (opcional)

  const dniError  = validateDni(dni.toUpperCase())
  const paso1Ok   = nombre.trim() && apellidos.trim() && email.includes('@') && PHONE_RE.test(telefono)
  const paso3Ok   = rgpd1 && rgpd2

  const PASOS = ['Datos personales', 'Información clínica', 'Privacidad y RGPD']

  function handleSubmit() {
    if (!paso3Ok) return
    // En producción: insertar en Supabase tabla `pacientes`
    // con rgpd_aceptado, rgpd_fecha, marketing_aceptado
    console.log('Registro:', {
      nombre: `${nombre} ${apellidos}`,
      email, telefono, fechaNac, dni, tarjetaSanitaria, medicoCabecera, alergias,
      rgpd_aceptado: true,
      rgpd_fecha: new Date().toISOString(),
      marketing_aceptado: rgpd3,
    })
    setExito(true)
  }

  return (
    <div className="flex flex-col flex-1 min-h-[780px] animate-fade-in">

      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => paso > 1 ? setPaso(p => p - 1) : navigate(-1)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-gray-900 font-bold text-base">Crear tu ficha</h1>
            <p className="text-gray-400 text-xs">Paso {paso} de 3 — {PASOS[paso - 1]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(paso / 3) * 100}%`, backgroundColor: BRAND }}
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 py-5">

        {/* ── Éxito ── */}
        {exito && (
          <div className="text-center py-12">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: BRAND + '20' }}
            >
              <Check size={36} style={{ color: BRAND }} />
            </div>
            <h2 className="text-gray-900 font-bold text-xl mb-2">¡Ficha creada!</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto mb-2">
              Bienvenida/o, <strong>{nombre}</strong>. Tu historial clínico ya está listo.
            </p>
            {!rgpd3 && (
              <p className="text-gray-400 text-xs max-w-xs mx-auto mb-6">
                Solo recibirás recordatorios de cita, no comunicaciones de marketing.
              </p>
            )}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-2xl text-white font-semibold"
              style={{ backgroundColor: BRAND }}
            >
              Acceder a mi perfil
            </button>
          </div>
        )}

        {/* ── Paso 1: Datos personales ── */}
        {!exito && paso === 1 && (
          <div className="space-y-4">
            <SectionTitle icon={User} label="Datos personales" />

            <Field label="Nombre *">
              <input
                value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ana" autoComplete="given-name"
                className={inputCls}
              />
            </Field>

            <Field label="Apellidos *">
              <input
                value={apellidos} onChange={e => setApellidos(e.target.value)}
                placeholder="Martínez García" autoComplete="family-name"
                className={inputCls}
              />
            </Field>

            <Field label="Correo electrónico *">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ana@email.es" autoComplete="email"
                className={inputCls}
              />
            </Field>

            <Field label="Teléfono móvil *">
              <input
                type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="+34 612 345 678" autoComplete="tel"
                className={inputCls}
              />
              <p className="text-gray-400 text-[10px] mt-1">Prefijo +34 incluido</p>
            </Field>

            <Field label="Fecha de nacimiento">
              <input
                type="date" value={fechaNac} onChange={e => setFechaNac(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {/* ── Paso 2: Información clínica ── */}
        {!exito && paso === 2 && (
          <div className="space-y-4">
            <SectionTitle icon={FileText} label="Información clínica" subtitle="Todos los campos son opcionales pero nos ayudan a atenderte mejor" />

            <Field label="DNI / NIE">
              <input
                value={dni} onChange={e => setDni(e.target.value.toUpperCase())}
                placeholder="12345678A"
                maxLength={9}
                className={`${inputCls} ${dniError && dni ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
              />
              {dniError && dni && (
                <p className="text-red-500 text-[10px] mt-1">{dniError}</p>
              )}
              {!dniError && !dni && (
                <p className="text-gray-400 text-[10px] mt-1">Recomendado · Formato: 12345678A o X1234567A</p>
              )}
            </Field>

            <Field label="N.º tarjeta sanitaria">
              <input
                value={tarjetaSanitaria}
                onChange={e => setTarjetaSanitaria(e.target.value)}
                placeholder="ES-4601234567890"
                className={inputCls}
              />
            </Field>

            <Field label="Médico de cabecera">
              <input
                value={medicoCabecera}
                onChange={e => setMedicoCabecera(e.target.value)}
                placeholder="Dr./Dra. Apellidos"
                className={inputCls}
              />
            </Field>

            <Field label="Alergias o medicación actual">
              <textarea
                value={alergias}
                onChange={e => setAlergias(e.target.value)}
                placeholder="Ej: alérgica al ibuprofeno…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
        )}

        {/* ── Paso 3: RGPD ── */}
        {!exito && paso === 3 && (
          <div className="space-y-4">
            <SectionTitle icon={Shield} label="Privacidad y protección de datos" subtitle="Lee y acepta los siguientes términos para completar tu registro" />

            {/* Checkbox 1 — Política de privacidad (OBLIGATORIO) */}
            <CheckItem
              checked={rgpd1}
              onChange={setRgpd1}
              required
              label={
                <>
                  He leído y acepto la{' '}
                  <Link
                    to="/politica-privacidad"
                    className="underline font-semibold"
                    style={{ color: BRAND }}
                    target="_blank"
                  >
                    Política de Privacidad
                  </Link>
                  {' '}y el tratamiento de mis datos personales conforme al{' '}
                  <strong>RGPD (Reglamento UE 2016/679)</strong>
                </>
              }
            />

            {/* Checkbox 2 — Datos de salud (OBLIGATORIO) */}
            <CheckItem
              checked={rgpd2}
              onChange={setRgpd2}
              required
              label="Consiento el tratamiento de mis datos de salud con la finalidad de gestión de mi historial clínico estético, conforme al Art. 9.2.a del RGPD"
            />

            {/* Checkbox 3 — Marketing (OPCIONAL) */}
            <CheckItem
              checked={rgpd3}
              onChange={setRgpd3}
              required={false}
              label="Acepto recibir comunicaciones comerciales y recordatorios por WhatsApp (opcional — si no aceptas, solo recibirás recordatorios de cita)"
            />

            {!paso3Ok && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
                Los dos primeros consentimientos son obligatorios para completar el registro.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer de navegación */}
      {!exito && (
        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          {paso < 3 ? (
            <button
              onClick={() => setPaso(p => p + 1)}
              disabled={paso === 1 && !paso1Ok}
              className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: (paso === 1 && !paso1Ok) ? '#d1d5db' : BRAND }}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!paso3Ok}
              className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: paso3Ok ? BRAND : '#d1d5db' }}
            >
              <Check size={18} /> Completar registro
            </button>
          )}
          {paso === 1 && (
            <p className="text-center text-gray-400 text-xs mt-3">
              * Campos obligatorios
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C8A882] focus:ring-1 focus:ring-[#C8A882] transition-colors'

function SectionTitle({ icon: Icon, label, subtitle }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} style={{ color: BRAND }} />
        <p className="text-gray-800 font-semibold text-sm">{label}</p>
      </div>
      {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-gray-600 text-xs font-medium block mb-1">{label}</label>
      {children}
    </div>
  )
}

function CheckItem({ checked, onChange, label, required }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: checked ? BRAND : '#d1d5db',
            backgroundColor: checked ? BRAND : '#fff',
          }}
          onClick={() => onChange(!checked)}
        >
          {checked && <Check size={12} className="text-white" />}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-gray-700 text-xs leading-relaxed">
          {label}
        </p>
        {required && (
          <span className="text-[10px] font-semibold mt-0.5 inline-block"
                style={{ color: BRAND }}>Obligatorio</span>
        )}
        {!required && (
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">Opcional</span>
        )}
      </div>
    </label>
  )
}
