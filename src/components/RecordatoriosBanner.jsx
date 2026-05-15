import { useState, useEffect } from 'react'
import { X, Phone, CheckCircle, XCircle, Bell } from 'lucide-react'
import { checkRecordatorios, dismissReminder } from '../services/recordatorios'
import { useCitas } from '../contexts/CitasContext'

const URGENCIA_STYLE = {
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
  danger:  { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' },
}

export default function RecordatoriosBanner() {
  const { citas, actualizarCita } = useCitas()
  const [notifs, setNotifs]       = useState([])
  const [idx, setIdx]             = useState(0)

  useEffect(() => {
    setNotifs(checkRecordatorios(citas))
    setIdx(0)
  }, [citas])

  if (notifs.length === 0) return null

  const n     = notifs[Math.min(idx, notifs.length - 1)]
  if (!n) return null
  const style = URGENCIA_STYLE[n.urgencia]

  function dismiss(id) {
    dismissReminder(id)
    const next = notifs.filter(x => x.id !== id)
    setNotifs(next)
    setIdx(i => Math.min(i, Math.max(0, next.length - 1)))
  }

  function onConfirmar() {
    actualizarCita(n.cita.id, { estado: 'confirmada', recordatorio_24h_enviado: true })
    dismiss(n.id)
  }

  function onCancelar() {
    actualizarCita(n.cita.id, { estado: 'cancelada' })
    dismiss(n.id)
  }

  function onMarcarRecordado() {
    actualizarCita(n.cita.id, { recordatorio_24h_enviado: true })
    dismiss(n.id)
  }

  return (
    <div
      className="mx-4 mt-3 rounded-2xl p-3 animate-slide-up"
      style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      {/* Paginador si hay varias */}
      {notifs.length > 1 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold" style={{ color: style.text }}>
            {idx + 1} de {notifs.length} recordatorios
          </span>
          <div className="flex gap-1">
            {notifs.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i === idx ? style.icon : style.border }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mensaje */}
      <div className="flex items-start gap-2.5">
        <Bell size={14} style={{ color: style.icon }} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-snug flex-1" style={{ color: style.text }}>
          {n.mensaje}
        </p>
        <button
          onClick={() => dismiss(n.id)}
          className="flex-shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Cerrar"
        >
          <X size={13} style={{ color: style.text }} />
        </button>
      </div>

      {/* Acciones */}
      {n.acciones.length > 0 && (
        <div className="flex gap-2 mt-2.5 ml-5 flex-wrap">
          {n.acciones.includes('confirmar') && (
            <button
              onClick={onConfirmar}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity active:opacity-70"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}
            >
              <CheckCircle size={12} /> Confirmar
            </button>
          )}
          {n.acciones.includes('cancelar') && (
            <button
              onClick={onCancelar}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity active:opacity-70"
              style={{ backgroundColor: '#dc2626', color: '#fff' }}
            >
              <XCircle size={12} /> Cancelar
            </button>
          )}
          {n.acciones.includes('marcar_recordado') && (
            <button
              onClick={onMarcarRecordado}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity active:opacity-70"
              style={{ backgroundColor: style.icon, color: '#fff' }}
            >
              <Phone size={12} /> Marcar recordado
            </button>
          )}
        </div>
      )}
    </div>
  )
}
