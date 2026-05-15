import { useNavigate } from 'react-router-dom'
import { FlaskConical, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function DemoBanner() {
  const { isDemoMode, logout } = useAuth()
  const navigate = useNavigate()

  if (!isDemoMode) return null

  async function exitDemo() {
    await logout()
    navigate('/demo')
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-400 px-4 py-2">
      <div className="flex items-center gap-2">
        <FlaskConical size={13} className="text-amber-900 flex-shrink-0" />
        <p className="text-amber-900 text-xs font-semibold">
          Modo demo — los datos son ficticios
        </p>
      </div>
      <button
        onClick={exitDemo}
        className="flex items-center gap-1 text-amber-900 text-[10px] font-bold hover:text-amber-950 transition-colors"
      >
        Salir <X size={11} />
      </button>
    </div>
  )
}
