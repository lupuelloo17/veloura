import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const BRAND = '#C9A46A'  // Veloura gold

export default function PagoExitosoPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div
        className="w-full max-w-sm text-center transition-all duration-700"
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        {/* Animated check */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-500"
          style={{
            backgroundColor: BRAND + '18',
            transform: visible ? 'scale(1)' : 'scale(0.5)',
          }}
        >
          <CheckCircle2 size={48} style={{ color: BRAND }} />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
          ¡Bienvenida a Veloura!
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-2">
          Tu suscripción está activa.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          En menos de 24 horas recibirás acceso completo a tu panel con todas las funcionalidades de tu plan.
        </p>

        <Link
          to={user?.clinica_slug ? `/clinica/${user.clinica_slug}/dashboard` : '/login'}
          className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
          style={{ backgroundColor: BRAND }}
        >
          Acceder a mi clínica <ArrowRight size={18} />
        </Link>

        <Link
          to="/"
          className="block mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          Volver al inicio
        </Link>

        {sessionId && (
          <p className="mt-8 text-gray-300 text-[10px] font-mono">
            Ref: {sessionId.slice(0, 24)}…
          </p>
        )}
      </div>
    </div>
  )
}
