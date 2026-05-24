import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANES, FEATURE_LABELS, formatEUR } from '../config/planes'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const PLAN_ORDER = ['esencial', 'premium', 'elite']

const PRICE_IDS = {
  esencial: import.meta.env.VITE_STRIPE_PRICE_ESENCIAL,
  premium:  import.meta.env.VITE_STRIPE_PRICE_PREMIUM,
  elite:    import.meta.env.VITE_STRIPE_PRICE_ELITE,
}

const FEATURE_LIST = [
  { key: 'citas',              label: 'Gestión de citas' },
  { key: 'historial_fotos',    label: 'Historial fotográfico' },
  { key: 'protocolos',         label: 'Protocolos de tratamiento' },
  { key: 'dashboard_basico',   label: 'Dashboard clínico' },
  { key: 'dermoscopia_ia',     label: 'Dermoscopia con IA' },
  { key: 'cosmeceuticos',      label: 'Recomendaciones cosmecéuticas' },
  { key: 'supervision_remota', label: 'Supervisión remota' },
  { key: 'alertas_abandono',   label: 'Alertas de abandono' },
  { key: 'multisede',          label: 'Gestión multi-sede' },
]

export default function PreciosPage() {
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError]            = useState(null)

  async function handleEmpezar(planKey) {
    const priceId = PRICE_IDS[planKey]
    if (!priceId || priceId.startsWith('price_PENDING')) {
      setError('Los planes aún no están configurados en Stripe. Crea los productos en el dashboard de Stripe y actualiza los Price IDs en .env')
      return
    }
    setError(null)
    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, clinicaNombre: 'Mi Clínica' }),
      })
      const text = await res.text()
      if (!text) throw new Error('Las funciones API solo funcionan en producción (Vercel). Ejecuta "vercel dev" para probar en local.')
      let data
      try {
        data = JSON.parse(text)
      } catch {
        console.error('Respuesta no-JSON del servidor:', text)
        throw new Error('Error del servidor al procesar el pago. Revisa los logs de Vercel.')
      }
      if (!res.ok || data.error) throw new Error(data.error || 'Error al procesar el pago')
      if (!data.url) throw new Error('No se recibió URL de pago')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  const navLinkStyle = {
    fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
    letterSpacing: '0.04em', color: 'rgba(247,245,242,0.4)',
    textDecoration: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#161313', fontFamily: DM_SANS }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(22,19,19,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', width: '100%',
          padding: '0 48px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={navLinkStyle}>← Volver</Link>
          <Link to="/" style={{
            fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300,
            color: '#F7F5F2', letterSpacing: '-0.02em', textDecoration: 'none',
          }}>
            Veloura
          </Link>
          <Link to="/login" style={navLinkStyle}>Iniciar sesión</Link>
        </div>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────────── */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 48px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '20px', height: '1px', background: 'rgba(201,211,202,0.4)' }} />
            <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(201,211,202,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              PRECIOS
            </span>
            <div style={{ width: '20px', height: '1px', background: 'rgba(201,211,202,0.4)' }} />
          </div>

          <h1 style={{
            fontFamily: FRAUNCES, fontWeight: 300,
            fontSize: 'clamp(38px,4vw,58px)',
            color: '#F7F5F2', letterSpacing: '-0.02em', lineHeight: 1.05,
            margin: '0 0 16px',
          }}>
            <span style={{ display: 'block' }}>Transparente.</span>
            <span style={{ display: 'block' }}>Sin sorpresas.</span>
          </h1>

          <p style={{
            fontFamily: DM_SANS, fontSize: '16px', fontWeight: 300,
            color: 'rgba(247,245,242,0.4)', lineHeight: 1.7, margin: 0,
          }}>
            Todos los precios incluyen IVA. Pago mensual con tarjeta. Sin comisiones ocultas.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '2px', padding: '12px 20px', marginBottom: '32px',
            textAlign: 'center', fontSize: '13px', fontWeight: 300,
            color: 'rgba(255,160,160,0.8)',
          }}>
            {error}
          </div>
        )}

        {/* Grid de planes */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px',
          overflow: 'hidden', marginBottom: '48px',
        }}>
          {PLAN_ORDER.map((key, i) => {
            const plan      = PLANES[key]
            const isPopular = key === 'premium'
            const isLoading = loadingPlan === key
            const isLast    = i === PLAN_ORDER.length - 1

            return (
              <div
                key={key}
                style={{
                  padding: '40px 36px',
                  display: 'flex', flexDirection: 'column',
                  position: 'relative',
                  borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  background: isPopular ? 'rgba(247,245,242,0.03)' : 'transparent',
                }}
              >
                {/* Badge popular */}
                {isPopular && (
                  <span style={{
                    position: 'absolute', top: '20px', right: '20px',
                    fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em',
                    border: '1px solid rgba(201,211,202,0.2)',
                    color: 'rgba(201,211,202,0.45)', padding: '3px 10px',
                    textTransform: 'uppercase',
                  }}>
                    MÁS POPULAR
                  </span>
                )}

                {/* Label */}
                <p style={{
                  fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.14em',
                  color: 'rgba(201,211,202,0.4)', textTransform: 'uppercase',
                  margin: '0 0 20px',
                }}>
                  {plan.nombre.toUpperCase()}
                </p>

                {/* Precio */}
                {plan.precio && plan.precio !== Infinity ? (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      fontFamily: FRAUNCES, fontSize: '48px', fontWeight: 300,
                      color: '#F7F5F2', letterSpacing: '-0.02em',
                    }}>
                      {formatEUR(plan.precio)}
                    </span>
                    <span style={{
                      fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
                      color: 'rgba(247,245,242,0.3)', marginLeft: '6px',
                    }}>
                      /mes + IVA
                    </span>
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      fontFamily: FRAUNCES, fontSize: '38px', fontWeight: 300,
                      color: '#F7F5F2', letterSpacing: '-0.02em',
                    }}>
                      Consultar
                    </span>
                  </div>
                )}

                {/* Descripción */}
                <p style={{
                  fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
                  color: 'rgba(247,245,242,0.35)', lineHeight: 1.6,
                  margin: '0 0 8px',
                }}>
                  {plan.descripcion}
                </p>

                {/* Capacidad */}
                <p style={{
                  fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.06em',
                  color: 'rgba(201,211,202,0.25)', margin: '0 0 28px',
                }}>
                  Hasta {plan.max_pacientes === Infinity ? '∞' : plan.max_pacientes} pacientes
                  {' · '}
                  {plan.max_medicos === Infinity ? '∞' : plan.max_medicos} médico{plan.max_medicos !== 1 ? 's' : ''}
                </p>

                {/* Features */}
                <ul style={{
                  flex: 1, paddingLeft: 0, listStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  margin: '0 0 36px',
                }}>
                  {FEATURE_LIST.map(({ key: fk, label }) => {
                    const incluido = plan.features[fk]
                    return (
                      <li key={fk} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: DM_MONO, fontSize: '12px', flexShrink: 0, marginTop: '1px',
                          color: incluido ? '#929C92' : 'rgba(255,255,255,0.1)',
                        }}>
                          {incluido ? '✓' : '–'}
                        </span>
                        <span style={{
                          fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
                          color: incluido ? 'rgba(247,245,242,0.55)' : 'rgba(247,245,242,0.18)',
                        }}>
                          {label}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleEmpezar(key)}
                  disabled={!!loadingPlan}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: '2px',
                    fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: loadingPlan ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                    ...(isPopular
                      ? { background: '#F7F5F2', color: '#161313', border: 'none' }
                      : { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(247,245,242,0.5)' }
                    ),
                  }}
                >
                  {isLoading ? 'Redirigiendo…' : 'Empezar ahora'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Nota test */}
        <div style={{
          maxWidth: '480px', margin: '0 auto 64px',
          padding: '20px 24px',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: DM_SANS, fontSize: '12px', fontWeight: 400,
            color: 'rgba(247,245,242,0.4)', margin: '0 0 6px',
          }}>
            Modo de prueba activo
          </p>
          <p style={{
            fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300,
            color: 'rgba(247,245,242,0.25)', margin: 0, lineHeight: 1.6,
          }}>
            Usa la tarjeta{' '}
            <span style={{ fontFamily: DM_MONO, color: 'rgba(201,211,202,0.6)' }}>
              4242 4242 4242 4242
            </span>
            , cualquier fecha futura y CVC de 3 dígitos.
          </p>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px' }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(247,245,242,0.2)' }}>
            Veloura · contacto@veloura.app
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/politica-privacidad" style={{
              fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
              color: 'rgba(247,245,242,0.25)', textDecoration: 'none',
            }}>
              Política de Privacidad
            </Link>
            <Link to="/" style={{
              fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
              color: 'rgba(247,245,242,0.25)', textDecoration: 'none',
            }}>
              Inicio
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
