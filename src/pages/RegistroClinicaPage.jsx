import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const BRAND = '#C8A882'
const PASOS = ['Tu clínica', 'Cuenta admin', 'Privacidad']

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

const inputStyle = {
  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '2px', fontSize: '14px', fontWeight: 300,
  color: '#F7F5F2', outline: 'none', fontFamily: DM_SANS,
  letterSpacing: '0.02em', marginBottom: '16px',
}

const labelStyle = {
  fontSize: '10px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'rgba(247,245,242,0.35)', marginBottom: '8px', display: 'block',
}

export default function RegistroClinicaPage() {
  const navigate = useNavigate()
  const [paso, setPaso]         = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError]       = useState(null)

  // ── Paso 1: Clínica
  const [nombre, setNombre]         = useState('')
  const [slug, setSlug]             = useState('')
  const [ciudad, setCiudad]         = useState('')
  const [slugManual, setSlugManual] = useState(false)

  function handleNombreChange(v) {
    setNombre(v)
    if (!slugManual) setSlug(toSlug(v))
  }

  // ── Paso 2: Admin
  const [adminNombre, setAdminNombre] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)

  // ── Paso 3: RGPD
  const [rgpd1, setRgpd1] = useState(false)
  const [rgpd2, setRgpd2] = useState(false)

  // ── Validaciones
  const slugOk  = /^[a-z0-9-]{3,40}$/.test(slug)
  const paso1Ok = nombre.trim().length >= 2 && slugOk
  const paso2Ok = (
    adminNombre.trim().length >= 2 &&
    email.includes('@') &&
    password.length >= 8 &&
    password === confirm
  )
  const paso3Ok = rgpd1 && rgpd2

  // ── Submit
  async function handleSubmit() {
    if (!paso3Ok) return
    setEnviando(true)
    setError(null)
    try {
      if (!supabase) {
        await new Promise(r => setTimeout(r, 1000))
        const mockUser = {
          id: 'mock-new-admin', email, nombre: adminNombre,
          rol: 'admin', clinica_slug: slug, clinica_id: 'mock-' + slug,
        }
        localStorage.setItem('glowai_session', JSON.stringify(mockUser))
        navigate(`/clinica/${slug}/dashboard`, { replace: true })
        return
      }

      const { data: existing } = await supabase
        .from('clinicas').select('id').eq('slug', slug).maybeSingle()
      if (existing) throw new Error('El identificador ya está en uso. Elige otro.')

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { nombre: adminNombre.trim() },
          emailRedirectTo: `${window.location.origin}/clinica/${slug}/dashboard`,
        },
      })
      if (authErr) throw authErr
      const userId = authData.user?.id
      if (!userId) throw new Error('No se pudo crear la cuenta')

      const { data: clinicaData, error: clinErr } = await supabase
        .from('clinicas')
        .insert({
          slug, nombre: nombre.trim(), ciudad: ciudad.trim() || null,
          plan: 'esencial', color_primario: BRAND,
        })
        .select('id').single()
      if (clinErr) throw new Error('Error creando la clínica: ' + clinErr.message)

      const { error: uErr } = await supabase
        .from('usuarios')
        .insert({
          id: userId, clinica_id: clinicaData.id,
          nombre: adminNombre.trim(), email: email.trim().toLowerCase(),
          rol: 'admin', activo: true,
        })
      if (uErr) throw new Error('Error creando perfil de administrador: ' + uErr.message)

      await supabase.auth.refreshSession()
      navigate(`/clinica/${slug}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.message || 'Error inesperado. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const canContinue = (paso === 1 && paso1Ok) || (paso === 2 && paso2Ok) || (paso === 3 && paso3Ok)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: '780px',
      background: '#161313', fontFamily: DM_SANS,
    }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <button
            onClick={() => paso > 1 ? setPaso(p => p - 1) : navigate('/login')}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(247,245,242,0.5)', fontSize: '16px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{
              fontFamily: FRAUNCES, fontSize: '18px', fontWeight: 300,
              color: '#F7F5F2', letterSpacing: '-0.01em', margin: 0,
            }}>
              Registra tu clínica
            </h1>
            <p style={{
              fontFamily: DM_MONO, fontSize: '10px',
              color: 'rgba(247,245,242,0.3)', letterSpacing: '0.08em',
              margin: '4px 0 0',
            }}>
              PASO {paso} DE 3 — {PASOS[paso - 1].toUpperCase()}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', borderRadius: 0 }}>
          <div style={{
            height: '1px', background: '#929C92',
            width: `${(paso / 3) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>

        {/* ── Paso 1: Clínica ── */}
        {paso === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: '#929C92' }}>⬡</span>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#F7F5F2' }}>
                Datos de tu clínica
              </span>
            </div>

            <label style={labelStyle}>Nombre de la clínica *</label>
            <input
              value={nombre}
              onChange={e => handleNombreChange(e.target.value)}
              placeholder="Clínica Lumière"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />

            <label style={labelStyle}>Identificador único (URL) *</label>
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(247,245,242,0.2)',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                veloura.app/
              </span>
              <input
                value={slug}
                onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }}
                placeholder="clinica-lumiere"
                style={{ ...inputStyle, paddingLeft: '100px', marginBottom: 0 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
              />
            </div>
            {slug && !slugOk && (
              <p style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.04em', color: 'rgba(255,140,140,0.7)', marginBottom: '12px' }}>
                Solo letras minúsculas, números y guiones (mín. 3 caracteres)
              </p>
            )}
            {slug && slugOk && (
              <p style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.04em', color: 'rgba(201,211,202,0.5)', marginBottom: '12px' }}>
                Tus pacientes se registrarán en veloura.app/registro/{slug}
              </p>
            )}
            {!(slug && (slugOk || !slugOk)) && <div style={{ marginBottom: '16px' }} />}

            <label style={labelStyle}>Ciudad</label>
            <input
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              placeholder="Madrid, Barcelona…"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>
        )}

        {/* ── Paso 2: Admin ── */}
        {paso === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#929C92' }}>○</span>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#F7F5F2' }}>
                Cuenta de administrador
              </span>
            </div>
            <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.3)', marginBottom: '24px' }}>
              Serás el administrador principal de la clínica
            </p>

            <label style={labelStyle}>Tu nombre completo *</label>
            <input
              value={adminNombre}
              onChange={e => setAdminNombre(e.target.value)}
              placeholder="Ana García"
              autoComplete="name"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />

            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@tuclinica.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />

            <label style={labelStyle}>Contraseña *</label>
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: '44px', marginBottom: 0 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(247,245,242,0.2)', fontSize: '12px', fontWeight: 300, lineHeight: 1, padding: 0,
                }}
              >
                {showPass ? '○' : '●'}
              </button>
            </div>
            {password && password.length < 8 && (
              <p style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.04em', color: 'rgba(255,200,100,0.6)', marginBottom: '12px' }}>
                Mínimo 8 caracteres
              </p>
            )}
            {!(password && password.length < 8) && <div style={{ marginBottom: '16px' }} />}

            <label style={labelStyle}>Confirmar contraseña *</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              style={{ ...inputStyle, marginBottom: '4px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,211,202,0.35)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)';  e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
            {confirm && confirm !== password && (
              <p style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.04em', color: 'rgba(255,140,140,0.7)', marginBottom: '8px' }}>
                No coincide
              </p>
            )}
          </div>
        )}

        {/* ── Paso 3: RGPD ── */}
        {paso === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#929C92' }}>◈</span>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#F7F5F2' }}>
                Privacidad y condiciones
              </span>
            </div>

            <p style={{
              fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
              color: 'rgba(247,245,242,0.35)', lineHeight: 1.7, marginBottom: '20px',
            }}>
              Al registrar tu clínica en Veloura aceptas nuestros términos y el tratamiento
              de los datos conforme al RGPD.
            </p>

            {/* Checkbox 1 */}
            <div
              onClick={() => setRgpd1(v => !v)}
              role="checkbox"
              aria-checked={rgpd1}
              tabIndex={0}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRgpd1(v => !v) } }}
              style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '16px', userSelect: 'none' }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '2px', flexShrink: 0, marginTop: '2px',
                border: rgpd1 ? '1px solid #929C92' : '1px solid rgba(255,255,255,0.15)',
                background: rgpd1 ? 'rgba(146,156,146,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {rgpd1 && <span style={{ fontSize: '11px', color: '#929C92', lineHeight: 1 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.4)', lineHeight: 1.6, margin: 0 }}>
                  He leído y acepto la{' '}
                  <Link
                    to="/politica-privacidad"
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#929C92', textDecoration: 'none' }}
                  >
                    Política de Privacidad
                  </Link>
                  {' '}y los Términos de servicio de Veloura
                </p>
                <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(146,156,146,0.5)', letterSpacing: '0.08em', marginTop: '4px', display: 'block' }}>
                  OBLIGATORIO
                </span>
              </div>
            </div>

            {/* Checkbox 2 */}
            <div
              onClick={() => setRgpd2(v => !v)}
              role="checkbox"
              aria-checked={rgpd2}
              tabIndex={0}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRgpd2(v => !v) } }}
              style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '16px', userSelect: 'none' }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '2px', flexShrink: 0, marginTop: '2px',
                border: rgpd2 ? '1px solid #929C92' : '1px solid rgba(255,255,255,0.15)',
                background: rgpd2 ? 'rgba(146,156,146,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {rgpd2 && <span style={{ fontSize: '11px', color: '#929C92', lineHeight: 1 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.4)', lineHeight: 1.6, margin: 0 }}>
                  Acepto el tratamiento de datos clínicos de mis pacientes bajo mi responsabilidad
                  como responsable del tratamiento (RGPD UE 2016/679)
                </p>
                <span style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(146,156,146,0.5)', letterSpacing: '0.08em', marginTop: '4px', display: 'block' }}>
                  OBLIGATORIO
                </span>
              </div>
            </div>

            {/* Info trial */}
            <div style={{
              background: 'rgba(146,156,146,0.06)', border: '1px solid rgba(146,156,146,0.12)',
              borderRadius: '2px', padding: '14px 16px', marginTop: '16px',
            }}>
              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.35)', lineHeight: 1.7, margin: 0 }}>
                Empezarás con un <strong style={{ fontWeight: 400, color: 'rgba(247,245,242,0.5)' }}>periodo de prueba gratuito</strong>.
                Podrás gestionar tu plan desde la configuración de la clínica en cualquier momento.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)',
            borderRadius: '2px', padding: '10px 14px', marginTop: '16px',
            fontSize: '12px', fontWeight: 300, color: 'rgba(255,160,160,0.7)', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '16px 24px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {paso < 3 ? (
          <button
            onClick={() => { setError(null); setPaso(p => p + 1) }}
            disabled={(paso === 1 && !paso1Ok) || (paso === 2 && !paso2Ok)}
            style={{
              width: '100%', padding: '13px', borderRadius: '2px', border: 'none',
              fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              background: canContinue ? '#F7F5F2' : 'rgba(255,255,255,0.06)',
              color: canContinue ? '#161313' : 'rgba(247,245,242,0.2)',
              transition: 'all 0.15s',
            }}
          >
            Continuar →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!paso3Ok || enviando}
            style={{
              width: '100%', padding: '13px', borderRadius: '2px', border: 'none',
              fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: paso3Ok && !enviando ? 'pointer' : 'not-allowed',
              background: paso3Ok && !enviando ? '#F7F5F2' : 'rgba(255,255,255,0.06)',
              color: paso3Ok && !enviando ? '#161313' : 'rgba(247,245,242,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            {enviando ? (
              <>
                <span style={{
                  width: '14px', height: '14px',
                  border: '2px solid rgba(22,19,19,0.2)',
                  borderTopColor: '#161313',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Creando…
              </>
            ) : 'Crear mi clínica'}
          </button>
        )}

        {paso === 1 && (
          <p style={{ textAlign: 'center', marginTop: '12px', fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.25)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'rgba(201,211,202,0.5)', textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(247,245,242,0.18) !important; }
      `}</style>
    </div>
  )
}
