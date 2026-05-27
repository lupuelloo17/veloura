import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function useInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isMobile && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShow(true)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShow(false)
  }

  return { show, dismiss }
}

const DEMO_ACCOUNTS = [
  {
    email: 'admin@lumiere.com',
    label: 'Administrador',
    desc: 'Panel completo · gestión de clínica',
    color: '#161313',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  {
    email: 'dra.garcia@lumiere.com',
    label: 'Dra. García',
    desc: 'Medicina Estética · vista de médico',
    color: '#929C92',
    border: 'none',
  },
  {
    email: 'paciente@lumiere.com',
    label: 'Sofía Restrepo',
    desc: 'Paciente · su perfil, citas, análisis',
    color: '#A39384',
    border: 'none',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { show: showBanner, dismiss: dismissBanner } = useInstallBanner()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  function fillDemo(acc) {
    setEmail(acc.email)
    setPassword('demo1234')
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      const user = await login(email.trim(), password)
      if (!user.clinica_slug) throw new Error('No se encontró la clínica asociada a tu cuenta.')
      const dest = user.rol === 'paciente' ? 'mi-perfil' : 'dashboard'
      navigate(`/clinica/${user.clinica_slug}/${dest}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '2px',
    fontSize: '14px',
    fontWeight: 300,
    color: '#F7F5F2',
    outline: 'none',
    fontFamily: "'DM Sans', system-ui",
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    marginBottom: '16px',
  }

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 300,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(247,245,242,0.4)',
    marginBottom: '8px',
    display: 'block',
  }

  const active = !!(email && password)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1,
      minHeight: '780px',
      background: '#161313',
      fontFamily: "'DM Sans', system-ui",
    }}>

      {/* ── SECCIÓN SUPERIOR ─────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 28px 24px',
      }}>

        {/* Wordmark */}
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '28px', fontWeight: 300,
          color: '#F7F5F2', letterSpacing: '-0.02em',
          marginBottom: '4px', textAlign: 'center', margin: '0 0 4px',
        }}>
          Veloura
        </p>

        {/* Eyebrow */}
        <p style={{
          fontFamily: "'DM Sans', system-ui",
          fontSize: '10px', fontWeight: 300,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(201,211,202,0.45)',
          textAlign: 'center', margin: '0 0 40px',
        }}>
          Acceso al portal
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>

          {/* Email */}
          <label style={labelStyle}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@lumiere.com"
            autoComplete="email"
            style={inputStyle}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(201,211,202,0.4)'
              e.target.style.background  = 'rgba(255,255,255,0.06)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)'
              e.target.style.background  = 'rgba(255,255,255,0.04)'
            }}
          />

          {/* Password */}
          <label style={labelStyle}>Contraseña</label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ ...inputStyle, paddingRight: '44px', marginBottom: 0 }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(201,211,202,0.4)'
                e.target.style.background  = 'rgba(255,255,255,0.06)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.background  = 'rgba(255,255,255,0.04)'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: 'absolute', right: '14px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(247,245,242,0.3)', fontSize: '14px',
                lineHeight: 1, padding: 0,
              }}
            >
              {showPass ? '●' : '○'}
            </button>
          </div>

          {/* Forgot password */}
          <Link
            to="/reset-password"
            style={{
              textAlign: 'right', fontSize: '11px', fontWeight: 300,
              letterSpacing: '0.04em', color: 'rgba(201,211,202,0.5)',
              textDecoration: 'none', display: 'block',
              marginTop: '-8px', marginBottom: '20px',
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'flex-start',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '2px', padding: '10px 14px', marginBottom: '12px',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,160,160,0.8)', flexShrink: 0 }}>⚠</span>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'rgba(255,160,160,0.8)', lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !active}
            style={{
              width: '100%', padding: '14px',
              background: active ? '#F7F5F2' : 'rgba(255,255,255,0.08)',
              color: active ? '#161313' : 'rgba(247,245,242,0.2)',
              border: 'none', borderRadius: '2px',
              fontSize: '12px', fontWeight: 400,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: active ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', system-ui",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.18s',
            }}
          >
            {loading && (
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(22,19,19,0.2)',
                borderTopColor: '#161313',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'Accediendo…' : 'Acceder'}
          </button>
        </form>
      </div>

      {/* ── BANNER PWA ────────────────────────────────────────── */}
      {showBanner && (
        <div style={{
          margin: '0 20px 16px',
          padding: '12px 14px',
          background: 'rgba(201,211,202,0.06)',
          border: '1px solid rgba(201,211,202,0.12)',
          borderRadius: '2px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <p style={{
            margin: 0, flex: 1,
            fontSize: '11px', fontWeight: 300,
            color: 'rgba(247,245,242,0.4)', lineHeight: 1.6,
          }}>
            Instala Veloura: toca Compartir → Añadir a inicio
          </p>
          <button
            onClick={dismissBanner}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(247,245,242,0.2)', fontSize: '16px',
              lineHeight: 1, padding: 0, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── SECCIÓN DEMO ─────────────────────────────────────── */}
      <div style={{ padding: '0 28px 32px' }}>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{
            fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(247,245,242,0.2)', fontWeight: 300, whiteSpace: 'nowrap',
          }}>
            Demo
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Botones demo */}
        {DEMO_ACCOUNTS.map(acc => (
          <button
            key={acc.email}
            onClick={() => fillDemo(acc)}
            style={{
              width: '100%', marginBottom: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.18s',
              fontFamily: "'DM Sans', system-ui",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.06)'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: acc.color,
              border: acc.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 400, color: '#F7F5F2',
              flexShrink: 0,
            }}>
              {acc.label[0]}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: '0 0 2px',
                fontSize: '13px', fontWeight: 400,
                color: 'rgba(247,245,242,0.75)',
                fontFamily: "'DM Sans', system-ui",
              }}>
                {acc.label}
              </p>
              <p style={{
                margin: 0,
                fontSize: '11px', fontWeight: 300,
                color: 'rgba(247,245,242,0.3)', letterSpacing: '0.02em',
              }}>
                {acc.desc}
              </p>
            </div>

            {/* Badge */}
            <span style={{
              marginLeft: 'auto', flexShrink: 0,
              fontSize: '10px', fontFamily: "'DM Mono', monospace",
              color: 'rgba(247,245,242,0.2)',
            }}>
              demo1234
            </span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(247,245,242,0.2) !important; }
      `}</style>
    </div>
  )
}
