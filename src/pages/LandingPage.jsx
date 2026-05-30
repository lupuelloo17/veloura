import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const C = {
  carbon:  '#161313',
  surface: '#1E1C1A',
  sage:    '#C9D3CA',
  taupe:   '#A39384',
  cream:   '#F7F5F2',
  muted:   'rgba(247,245,242,0.45)',
  border:  'rgba(255,255,255,0.07)',
}

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const NAV_LINKS = [
  { label: 'Funciones', href: '#funciones' },
  { label: 'Precios',   href: '#precios'   },
  { label: 'FAQ',       href: '#faq'       },
]

const FEATURES = [
  { num: '01', cat: 'GESTIÓN',     title: 'Agenda inteligente',        desc: 'Gestión de citas con IA predictiva. Reduce cancelaciones un 42% con recordatorios personalizados y lista de espera automática.' },
  { num: '02', cat: 'PACIENTES',   title: 'Expediente clínico digital', desc: 'Historial completo por paciente: tratamientos, fotos de evolución, alergias, consentimientos informados y notas clínicas.' },
  { num: '03', cat: 'FINANZAS',    title: 'Facturación y cobro',        desc: 'Presupuestos, facturas y terminales de pago integrados. Conciliación automática y reportes fiscales listos para descarga.' },
  { num: '04', cat: 'CRECIMIENTO', title: 'Marketing automatizado',     desc: 'Campañas de reactivación, cumpleaños, post-tratamiento y fidelización. Conectado a WhatsApp, email y SMS desde un panel único.' },
  { num: '05', cat: 'DATOS',       title: 'Analítica de clínica',       desc: 'Dashboard en tiempo real: ingresos, ocupación, retención y NPS. Benchmarks del sector para contextualizar tu rendimiento.' },
  { num: '06', cat: 'ESCALA',      title: 'Multi-sede y equipos',       desc: 'Gestiona varias clínicas desde un único login. Roles, permisos y reportes consolidados por sede o especialista.' },
]

const STATS = [
  { num: '1.400+', label: 'Clínicas activas'  },
  { num: '3.8M',   label: 'Citas gestionadas' },
  { num: '98%',    label: 'Satisfacción'       },
  { num: '4',      label: 'Países'             },
]

const TESTIMONIOS = [
  {
    quote: 'Desde que migramos a Veloura reducimos las cancelaciones de último minuto a la mitad. El sistema de recordatorios automáticos ha cambiado nuestra operación.',
    name:  'Dra. Marta Sánchez',
    role:  'Directora médica · Clínica Lumière, Madrid',
  },
  {
    quote: 'Teníamos miedo del cambio, pero la migración fue en menos de un día. Ahora todo el equipo gestiona su agenda desde el móvil. Imprescindible.',
    name:  'Andrea López',
    role:  'Gerente · Centro Estético Nórdica, Barcelona',
  },
  {
    quote: 'La analítica en tiempo real nos permitió identificar qué tratamientos eran más rentables. En tres meses aumentamos el ticket medio un 18%.',
    name:  'Dr. Iván Torres',
    role:  'Fundador · Clínica Essence, Bogotá',
  },
]

const PLANES = [
  {
    key:      'esencial',
    label:    'ESENCIAL',
    precio:   '€149',
    badge:    null,
    desc:     'Para clínicas que empiezan. Todo lo esencial para gestionar tu día a día sin complicaciones.',
    features: ['1 sede · hasta 1 especialista', 'Agenda y citas online', 'Expediente básico', 'Facturación simple', 'Soporte por email'],
    cta:      'Comenzar gratis',
    primary:  false,
  },
  {
    key:      'pro',
    label:    'CLÍNICA PRO',
    precio:   '€249',
    badge:    'MÁS POPULAR',
    desc:     'La elección de la mayoría. IA, marketing y analítica avanzada incluidos.',
    features: ['1 sede · especialistas ilimitados', 'Agenda inteligente con IA', 'Expediente clínico completo + fotos', 'Facturación y TPV integrado', 'Marketing automatizado', 'Analítica avanzada', 'Soporte prioritario'],
    cta:      'Comenzar gratis',
    primary:  true,
  },
  {
    key:      'enterprise',
    label:    'ENTERPRISE',
    precio:   null,
    badge:    null,
    desc:     'Para grupos y redes con necesidades específicas. Precio y condiciones a medida.',
    features: ['Sedes y especialistas ilimitados', 'Panel multi-sede unificado', 'Integraciones a medida', 'SLA garantizado 99.9%', 'Gestor de cuenta dedicado', 'Onboarding presencial'],
    cta:      'Hablar con ventas',
    primary:  false,
  },
]

const FAQS = [
  { q: '¿Cuánto tiempo lleva implementar Veloura?', a: 'La configuración inicial toma menos de 10 minutos. En 30 minutos tienes tu equipo activo y tus primeras citas cargadas.' },
  { q: '¿Puedo migrar mis datos de otro sistema?',  a: 'Sí. Ofrecemos migración gratuita desde Excel, Google Sheets y los principales sistemas del sector. Te acompañamos en el proceso.' },
  { q: '¿Hay contrato de permanencia?',             a: 'No. Puedes cancelar cuando quieras desde tu panel. Sin penalizaciones ni letra pequeña.' },
  { q: '¿Funciona en móvil?',                       a: 'Sí. Tus pacientes tienen su app instalable en iOS y Android. El panel de gestión está optimizado para tablet y escritorio.' },
  { q: '¿Cómo es el soporte?',                      a: 'Soporte en español por WhatsApp y email. Plan Pro incluye soporte prioritario con tiempo de respuesta garantizado.' },
  { q: '¿Puedo personalizar la app con mi marca?',  a: 'Sí. Cada clínica tiene su propia URL, colores y logo. Tus pacientes ven tu marca, no la nuestra.' },
]

export default function LandingPage() {
  const [scrolled,    setScrolled]    = useState(false)
  const [openFaqs,    setOpenFaqs]    = useState([])
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 768)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = '' }
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function toggleFaq(i) {
    setOpenFaqs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const eyebrow = {
    fontFamily: DM_MONO, fontSize: '11px',
    color: 'rgba(201,211,202,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase',
  }

  const navLink = {
    fontSize: '14px', fontWeight: 300,
    color: 'rgba(247,245,242,0.55)', textDecoration: 'none', letterSpacing: '0.01em',
  }

  const btnPrimary = {
    background: C.cream, color: C.carbon,
    padding: '14px 32px', borderRadius: '2px',
    fontSize: '14px', fontWeight: 400, letterSpacing: '0.04em',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
  }

  const btnOutline = {
    background: 'transparent', border: '1px solid rgba(247,245,242,0.2)',
    color: C.cream, padding: '14px 32px', borderRadius: '2px',
    fontSize: '14px', fontWeight: 400, letterSpacing: '0.04em',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
  }

  const px = isMobile ? '24px' : '48px'

  return (
    <div style={{ background: C.carbon, color: C.cream, fontFamily: DM_SANS }}>

      {/* ══ NAV ═════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        transition: 'background 0.3s',
        background: scrolled || menuOpen ? 'rgba(22,19,19,0.97)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(12px)' : 'none',
      }}>
        <div style={{ maxWidth: '1200px', margin: 'auto', padding: `0 ${px}`, height: '64px', display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ fontFamily: FRAUNCES, fontSize: '22px', fontWeight: 300, color: C.cream, textDecoration: 'none', letterSpacing: '-0.02em' }}>
            Veloura
          </Link>

          {!isMobile && (
            <div style={{ display: 'flex', gap: '32px', marginLeft: '48px' }}>
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} style={navLink}>{l.label}</a>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {!isMobile && (
            <>
              <Link to="/login" style={navLink}>Iniciar sesión</Link>
              <Link to="/registro-clinica" style={{
                border: '1px solid rgba(247,245,242,0.25)', padding: '8px 20px', borderRadius: '2px',
                color: C.cream, fontSize: '13px', fontWeight: 400, letterSpacing: '0.04em',
                textDecoration: 'none', marginLeft: '24px',
              }}>
                Prueba gratuita
              </Link>
            </>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.cream, fontSize: '22px', padding: '4px 0', lineHeight: 1 }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={{ background: 'rgba(22,19,19,0.97)', padding: '20px 24px' }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.href} href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{ fontFamily: DM_SANS, fontSize: '18px', fontWeight: 300, color: 'rgba(247,245,242,0.75)', textDecoration: 'none', display: 'block', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: DM_SANS, fontSize: '18px', fontWeight: 300, color: 'rgba(247,245,242,0.75)', textDecoration: 'none', display: 'block', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro-clinica" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: DM_SANS, fontSize: '16px', fontWeight: 400, color: C.cream, textDecoration: 'none', display: 'block', padding: '16px 0' }}
            >
              Prueba gratuita →
            </Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section id="inicio" style={{
        minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center',
        backgroundImage: 'url(https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(22,19,19,0.93) 45%, rgba(22,19,19,0.6) 100%)' }} />
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: '1200px', margin: 'auto', width: '100%',
          paddingTop: 'calc(80px + 5vh)',
          paddingLeft: px, paddingRight: px, paddingBottom: '60px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '1px', background: 'rgba(201,211,202,0.5)' }} />
            <span style={eyebrow}>PLATAFORMA SAAS · ESTÉTICA MÉDICA</span>
          </div>

          <h1 style={{ fontFamily: FRAUNCES, fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 24px', maxWidth: '700px' }}>
            <span style={{ display: 'block', fontSize: 'clamp(42px,5.5vw,82px)', color: C.cream }}>La plataforma</span>
            <span style={{ display: 'block', fontSize: 'clamp(42px,5.5vw,82px)', color: C.taupe, fontStyle: 'italic' }}>inteligente</span>
            <span style={{ display: 'block', fontSize: 'clamp(42px,5.5vw,82px)', color: C.cream }}>para clínicas</span>
            <span style={{ display: 'block', fontSize: 'clamp(42px,5.5vw,82px)', color: C.cream }}>estéticas.</span>
          </h1>

          <p style={{ maxWidth: '460px', fontFamily: DM_SANS, fontSize: '17px', fontWeight: 300, color: 'rgba(247,245,242,0.5)', lineHeight: 1.75, margin: '0 0 40px' }}>
            Gestión de pacientes, agenda inteligente y analítica en tiempo real. Todo lo que tu clínica necesita en una sola plataforma.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/registro-clinica" style={btnPrimary}>Empezar gratis →</Link>
            <Link to="/login" style={btnOutline}>Ver demo</Link>
          </div>

          <div style={{ marginTop: '72px', paddingTop: '32px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <span style={{ fontFamily: FRAUNCES, fontSize: '30px', fontWeight: 300, color: C.cream, display: 'block' }}>{s.num}</span>
                <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(201,211,202,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px', display: 'block' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FUNCIONES ═══════════════════════════════════════════ */}
      <section id="funciones" style={{ background: '#1A1816', padding: `${isMobile ? '80px' : '120px'} ${px}` }}>
        <div style={{ maxWidth: '1200px', margin: 'auto' }}>
          <span style={{ ...eyebrow, display: 'block' }}>FUNCIONES</span>
          <h2 style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: isMobile ? '38px' : '52px', color: C.cream, lineHeight: 1.05, maxWidth: '600px', margin: '16px 0 64px' }}>
            Cada herramienta que necesita tu clínica.
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
            border: `1px solid ${C.border}`, borderRadius: '4px', overflow: 'hidden',
          }}>
            {FEATURES.map((f, i) => {
              const cols      = isMobile ? 1 : 3
              const isLastCol = (i + 1) % cols === 0
              const isLastRow = isMobile ? i === FEATURES.length - 1 : i >= FEATURES.length - cols
              return (
                <div
                  key={f.num}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    padding: '40px 36px', position: 'relative',
                    borderRight:  isLastCol ? 'none' : `1px solid ${C.border}`,
                    borderBottom: isLastRow  ? 'none' : `1px solid ${C.border}`,
                    background:   hoveredCard === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                    transition:   'background 0.2s',
                  }}
                >
                  <span style={{ position: 'absolute', top: '24px', right: '28px', fontFamily: FRAUNCES, fontSize: '72px', fontWeight: 300, color: 'rgba(247,245,242,0.04)', lineHeight: 1, userSelect: 'none' }}>{f.num}</span>
                  <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(201,211,202,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 20px' }}>{f.cat}</p>
                  <h3 style={{ fontFamily: FRAUNCES, fontSize: '22px', fontWeight: 400, color: C.cream, margin: '0 0 12px' }}>{f.title}</h3>
                  <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(247,245,242,0.4)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS ═════════════════════════════════════════ */}
      <section style={{ background: C.carbon, padding: `${isMobile ? '80px' : '100px'} ${px}` }}>
        <div style={{ maxWidth: '1200px', margin: 'auto' }}>
          <span style={{ ...eyebrow, display: 'block' }}>TESTIMONIOS</span>
          <h2 style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: isMobile ? '32px' : '44px', color: C.cream, margin: '16px 0 56px', maxWidth: '500px', lineHeight: 1.1 }}>
            Lo que dicen nuestros clientes.
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
            gap: '1px', background: C.border,
            border: `1px solid ${C.border}`, borderRadius: '4px', overflow: 'hidden',
          }}>
            {TESTIMONIOS.map((t, i) => (
              <div key={i} style={{ background: '#1A1816', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ fontFamily: DM_MONO, fontSize: '12px', color: C.sage }}>★</span>
                  ))}
                </div>
                <p style={{ fontFamily: FRAUNCES, fontWeight: 300, fontStyle: 'italic', fontSize: '18px', color: 'rgba(247,245,242,0.7)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  "{t.quote}"
                </p>
                <div>
                  <p style={{ fontFamily: DM_SANS, fontWeight: 500, fontSize: '13px', color: C.cream, margin: '0 0 4px' }}>{t.name}</p>
                  <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(201,211,202,0.35)', letterSpacing: '0.08em', margin: 0 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRECIOS ═════════════════════════════════════════════ */}
      <section id="precios" style={{ background: '#1A1816', padding: `${isMobile ? '80px' : '120px'} ${px}` }}>
        <div style={{ maxWidth: '1200px', margin: 'auto' }}>
          <span style={{ ...eyebrow, display: 'block' }}>PRECIOS</span>
          <h2 style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: isMobile ? '38px' : '52px', color: C.cream, lineHeight: 1.05, margin: '16px 0 0' }}>
            Transparente. Sin sorpresas.
          </h2>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '17px', color: 'rgba(247,245,242,0.4)', margin: '16px 0 64px' }}>
            14 días de prueba gratuita en todos los planes. Sin tarjeta de crédito.
          </p>
          <div style={{
            maxWidth: '960px', margin: 'auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
            border: `1px solid ${C.border}`, borderRadius: '4px', overflow: 'hidden',
          }}>
            {PLANES.map((plan, i) => (
              <div key={plan.key} style={{
                padding: '40px', position: 'relative',
                background: plan.primary ? 'rgba(247,245,242,0.03)' : 'transparent',
                borderRight:  isMobile ? 'none' : (i < PLANES.length - 1 ? `1px solid ${C.border}` : 'none'),
                borderBottom: isMobile && i < PLANES.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                {plan.badge && (
                  <span style={{ position: 'absolute', top: '20px', right: '20px', fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em', border: '1px solid rgba(201,211,202,0.25)', color: 'rgba(201,211,202,0.5)', padding: '3px 10px' }}>
                    {plan.badge}
                  </span>
                )}
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(201,211,202,0.4)', margin: '0 0 16px' }}>{plan.label}</p>
                {plan.precio ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: '48px', color: C.cream, lineHeight: 1 }}>{plan.precio}</span>
                    <span style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.3)' }}>/mes</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: '38px', color: C.cream, lineHeight: 1 }}>Consultar</span>
                  </div>
                )}
                <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(247,245,242,0.35)', lineHeight: 1.6, margin: '0 0 32px' }}>{plan.desc}</p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 36px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: DM_MONO, fontSize: '13px', color: '#929C92', flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(247,245,242,0.45)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/registro-clinica" style={{
                  width: '100%', padding: '13px',
                  background: plan.primary ? C.cream : 'transparent',
                  color: plan.primary ? C.carbon : 'rgba(247,245,242,0.6)',
                  border: plan.primary ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '2px', textAlign: 'center',
                  fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  textDecoration: 'none', display: 'block', boxSizing: 'border-box', fontWeight: 400,
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.carbon, padding: `${isMobile ? '80px' : '100px'} ${px}` }}>
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
          <h2 style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: isMobile ? '38px' : '48px', color: C.cream, margin: '0 0 48px' }}>
            ¿Tienes preguntas?
          </h2>
          {FAQS.map((faq, i) => {
            const open = openFaqs.includes(i)
            return (
              <div key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <div
                  onClick={() => toggleFaq(i)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: DM_SANS, fontWeight: 400, fontSize: '16px', color: 'rgba(247,245,242,0.75)' }}>{faq.q}</span>
                  <span style={{ fontFamily: DM_MONO, fontSize: '14px', color: 'rgba(201,211,202,0.4)', flexShrink: 0, marginLeft: '16px' }}>{open ? '↑' : '↓'}</span>
                </div>
                <div style={{ maxHeight: open ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.35)', lineHeight: 1.8, margin: '0 0 20px' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════════ */}
      <section style={{
        padding: `${isMobile ? '80px' : '120px'} ${px}`,
        position: 'relative', overflow: 'hidden',
        backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,19,19,0.9)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: 'auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: FRAUNCES, fontWeight: 300, fontStyle: 'italic', fontSize: isMobile ? '36px' : '52px', color: C.cream, lineHeight: 1.1, margin: '0 0 16px' }}>
            Tu clínica merece una plataforma a su altura.
          </h2>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '17px', color: 'rgba(247,245,242,0.45)', margin: '0 0 40px' }}>
            Únete a más de 1.400 clínicas que ya gestionan su negocio con Veloura. Sin permanencia. Sin complicaciones.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/registro-clinica" style={btnPrimary}>Empezar gratis →</Link>
            <Link to="/login" style={btnOutline}>Ver demo</Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: '#0F0D0C', padding: `${isMobile ? '60px' : '80px'} ${px} 40px` }}>
        <div style={{ maxWidth: '1200px', margin: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr',
            gap: isMobile ? '40px 24px' : '48px',
            marginBottom: '64px',
          }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <p style={{ fontFamily: FRAUNCES, fontWeight: 300, fontSize: '20px', color: C.cream, margin: 0 }}>Veloura</p>
              <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '13px', color: 'rgba(247,245,242,0.3)', lineHeight: 1.7, marginTop: '12px', maxWidth: '280px' }}>
                La plataforma SaaS que está transformando la gestión de clínicas de medicina estética en España y Latinoamérica.
              </p>
            </div>
            <div>
              <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(201,211,202,0.3)', margin: '0 0 20px' }}>PRODUCTO</p>
              {[
                { label: 'Funciones',       href: '#funciones' },
                { label: 'Precios',         href: '#precios'   },
                { label: 'Integraciones',   href: '#'          },
                { label: 'Actualizaciones', href: '#'          },
              ].map(l => (
                <a key={l.label} href={l.href} style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.3)', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>{l.label}</a>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(201,211,202,0.3)', margin: '0 0 20px' }}>EMPRESA</p>
              {['Sobre nosotros', 'Blog', 'Prensa', 'Trabaja con nosotros'].map(l => (
                <a key={l} href="#" style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.3)', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(201,211,202,0.3)', margin: '0 0 20px' }}>LEGAL</p>
              <Link to="/politica-privacidad" style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.3)', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>Privacidad</Link>
              {['Términos de uso', 'Cookies', 'RGPD'].map(l => (
                <a key={l} href="#" style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: '14px', color: 'rgba(247,245,242,0.3)', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(247,245,242,0.2)' }}>© 2025 Veloura Technologies SL · Todos los derechos reservados</span>
            <span style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(247,245,242,0.2)' }}>Hecho con cuidado · Madrid, España</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
