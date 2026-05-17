import { useClinic } from '../../contexts/ClinicContext'
import ClinicNav from '../../components/ClinicNav'
import RecordatoriosBanner from '../../components/RecordatoriosBanner'
import { AlertTriangle } from 'lucide-react'

export default function ClinicLayout({ children }) {
  const { loading, error } = useClinic()

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 py-20">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando clínica…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 px-8 text-center py-20">
        <AlertTriangle size={32} className="text-amber-400" />
        <p className="text-gray-800 font-semibold">Clínica no encontrada</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center px-4 py-3 border-b border-gray-100 bg-white">
        <img src="/logo.png" alt="Veloura" style={{ height: '48px' }} className="w-auto" />
      </header>
      <RecordatoriosBanner />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <ClinicNav />
    </div>
  )
}
