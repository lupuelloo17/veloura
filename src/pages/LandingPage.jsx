import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, CalendarDays, Shield, ChevronRight, Star } from 'lucide-react'
import { PLANES, formatEUR } from '../config/planes'

const BRAND = '#C8A882'

const BENEFICIOS = [
  {
    icon: CalendarDays,
    titulo: 'Agenda inteligente',
    texto: 'Gestiona citas, envía recordatorios automáticos por WhatsApp y elimina los no-shows.',
  },
  {
    icon: Sparkles,
    titulo: 'Historial clínico digital',
    texto: 'Fotos antes/después, protocolos de tratamiento y seguimiento de resultados en un solo lugar.',
  },
  {
    icon: Shield,
    titulo: 'Cumplimiento RGPD',
    texto: 'Consentimientos digitales, política de privacidad integrada y datos seguros conforme a la normativa europea.',
  },
]

const PLAN_ORDER = ['esencial', 'premium', 'elite']

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

export default function LandingPage() {
  const [nombre, setNombre]   = useState('')
  const [email, setEmail]     = useState('')
  const [clinica, setClinica] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleContacto(e) {
    e.preventDefault()
    if (!nombre.trim() || !email.includes('@')) return
    setEnviando(true)
    // En producción: insertar en Supabase tabla `leads`
    await new Promise(r => setTimeout(r, 800))
    setEnviado(true)
    setEnviando(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* ── NAV ── */}
      <nav className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 z-30">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: BRAND }}
            >
              G
            </div>
            <span className="font-bold text-gray-900 text-base">GlowAI</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#planes" className="text-gray-500 text-sm font-medium hidden sm:block hover:text-gray-800 transition-colors">
              Planes
            </a>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: BRAND }}
            >
              Acceder
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-14 text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ backgroundColor: BRAND + '18', color: BRAND }}
        >
          <Star size={11} fill="currentColor" /> La plataforma de medicina estética
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          La app que tu clínica<br />
          <span style={{ color: BRAND }}>estética necesitaba</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          GlowAI digitaliza tu clínica en minutos: agenda, historial clínico, recordatorios automáticos y cumplimiento RGPD incluidos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#contacto"
            className="px-7 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            Solicitar demo gratuita <ChevronRight className="inline mb-0.5" size={15} />
          </a>
          <Link
            to="/login"
            className="px-7 py-3.5 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Ver demo
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-gray-400 text-xs mt-6">
          Sin tarjeta de crédito · Configuración en menos de 10 minutos · Soporte en español
        </p>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Todo lo que necesita tu clínica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: BRAND + '18' }}
                >
                  <Icon size={20} style={{ color: BRAND }} />
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-2">{titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANES ── */}
      <section id="planes" className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Planes sin sorpresas
          </h2>
          <p className="text-gray-400 text-sm text-center mb-10">
            Todos los precios incluyen IVA. Cancela cuando quieras.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLAN_ORDER.map(key => {
              const plan = PLANES[key]
              const isPopular = key === 'premium'
              return (
                <div
                  key={key}
                  className="rounded-2xl border p-6 flex flex-col relative"
                  style={isPopular
                    ? { borderColor: BRAND, boxShadow: `0 0 0 2px ${BRAND}` }
                    : { borderColor: '#e5e7eb' }
                  }
                >
                  {isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[11px] font-bold"
                      style={{ backgroundColor: BRAND }}
                    >
                      Más popular
                    </div>
                  )}
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{plan.nombre}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatEUR(plan.precio)}
                    </span>
                    <span className="text-gray-400 text-sm">/{plan.periodo}</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-5">{plan.descripcion}</p>

                  <ul className="space-y-2 flex-1 mb-6">
                    {FEATURE_LIST.map(({ key: fk, label }) => {
                      const incluido = plan.features[fk]
                      return (
                        <li key={fk} className="flex items-center gap-2">
                          <Check
                            size={14}
                            className="flex-shrink-0"
                            style={{ color: incluido ? BRAND : '#d1d5db' }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: incluido ? '#374151' : '#9ca3af' }}
                          >
                            {label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <a
                    href="#contacto"
                    className="w-full py-3 rounded-xl text-sm font-semibold text-center block transition-all active:scale-95"
                    style={isPopular
                      ? { backgroundColor: BRAND, color: '#fff' }
                      : { backgroundColor: '#f3f4f6', color: '#374151' }
                    }
                  >
                    Empezar ahora
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" className="bg-gray-50 py-16">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Solicita una demo gratuita
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Nos ponemos en contacto contigo en menos de 24 horas.
          </p>

          {enviado ? (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: BRAND + '20' }}
              >
                <Check size={28} style={{ color: BRAND }} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-1">¡Recibido!</h3>
              <p className="text-gray-500 text-sm">
                Te contactaremos en menos de 24 horas. Mientras tanto, puedes explorar la demo.
              </p>
              <Link
                to="/login"
                className="inline-block mt-6 px-6 py-3 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: BRAND }}
              >
                Ver demo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleContacto} className="space-y-4">
              <div>
                <label className="text-gray-600 text-xs font-medium block mb-1">Nombre *</label>
                <input
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Dra. García"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C8A882] focus:ring-1 focus:ring-[#C8A882] transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium block mb-1">Email profesional *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info@miclinica.es"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C8A882] focus:ring-1 focus:ring-[#C8A882] transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium block mb-1">Nombre de la clínica</label>
                <input
                  value={clinica}
                  onChange={e => setClinica(e.target.value)}
                  placeholder="Clínica Lumière"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C8A882] focus:ring-1 focus:ring-[#C8A882] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                style={{ backgroundColor: enviando ? '#d1d5db' : BRAND }}
              >
                {enviando ? 'Enviando…' : 'Solicitar demo gratuita'}
              </button>
              <p className="text-gray-400 text-[11px] text-center">
                Al enviar aceptas nuestra{' '}
                <Link to="/politica-privacidad" className="underline" style={{ color: BRAND }}>
                  Política de Privacidad
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>GlowAI · Valencia, España · contacto@glowai.app</p>
          <div className="flex items-center gap-4">
            <Link to="/politica-privacidad" className="hover:text-gray-600 transition-colors">
              Política de Privacidad
            </Link>
            <Link to="/politica-privacidad" className="hover:text-gray-600 transition-colors">
              RGPD
            </Link>
            <Link to="/login" className="hover:text-gray-600 transition-colors">
              Acceder
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
