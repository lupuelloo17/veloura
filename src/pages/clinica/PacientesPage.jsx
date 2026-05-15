import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Plus, ChevronRight, Filter } from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import ClinicLayout from './ClinicLayout'

const MOCK_PACIENTES = [
  { id: 'p1', nombre: 'Valentina',    apellido: 'Morales',   medico: 'Dra. López', ultima_sesion: '18 oct 2025', sesiones: 6, riesgo: 'bajo',     foto: null },
  { id: 'p2', nombre: 'Sofía',        apellido: 'Restrepo',  medico: 'Dra. López', ultima_sesion: '5 nov 2025',  sesiones: 3, riesgo: 'moderado', foto: null },
  { id: 'p3', nombre: 'María Camila', apellido: 'Torres',    medico: 'Dr. Ruiz',   ultima_sesion: '1 dic 2025',  sesiones: 9, riesgo: 'alto',     foto: null },
  { id: 'p4', nombre: 'Alejandra',    apellido: 'Gómez',     medico: 'Dra. López', ultima_sesion: '10 ene 2026', sesiones: 2, riesgo: 'bajo',     foto: null },
  { id: 'p5', nombre: 'Natalia',      apellido: 'Herrera',   medico: 'Dr. Ruiz',   ultima_sesion: '22 feb 2026', sesiones: 5, riesgo: 'bajo',     foto: null },
  { id: 'p6', nombre: 'Isabella',     apellido: 'Martínez',  medico: 'Dra. López', ultima_sesion: '3 mar 2026',  sesiones: 1, riesgo: 'moderado', foto: null },
]

const RIESGO_STYLE = {
  bajo:     { bg: '#dcfce7', text: '#15803d' },
  moderado: { bg: '#fef9c3', text: '#a16207' },
  alto:     { bg: '#fee2e2', text: '#b91c1c' },
}

export default function PacientesPage() {
  const navigate        = useNavigate()
  const { slug }        = useParams()
  const { clinica }     = useClinic()
  const brand           = clinica?.color_primario ?? '#E8A0B0'

  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState('todos') // todos | alto | moderado | bajo

  const filtered = MOCK_PACIENTES.filter(p => {
    const matchQuery = `${p.nombre} ${p.apellido}`.toLowerCase().includes(query.toLowerCase())
    const matchRisk  = filter === 'todos' || p.riesgo === filter
    return matchQuery && matchRisk
  })

  return (
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="bg-white px-5 pt-7 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-gray-900 font-bold text-lg">Pacientes</h1>
              <p className="text-gray-400 text-xs">{MOCK_PACIENTES.length} registros · {clinica?.nombre}</p>
            </div>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: brand }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Risk filter pills */}
        <div className="bg-white px-5 pb-3 flex gap-2 overflow-x-auto border-b border-gray-100">
          {['todos', 'bajo', 'moderado', 'alto'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all"
              style={filter === f
                ? { backgroundColor: brand, borderColor: brand, color: '#fff' }
                : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              {f === 'todos' ? 'Todos' : `Riesgo ${f}`}
            </button>
          ))}
        </div>

        {/* Patient list */}
        <div className="bg-gray-50 px-5 py-3 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Sin resultados</p>
          )}
          {filtered.map(p => {
            const rStyle = RIESGO_STYLE[p.riesgo]
            const initials = `${p.nombre[0]}${p.apellido[0]}`
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/clinica/${slug}/paciente/${p.id}`)}
                className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm text-left active:scale-95 transition-transform"
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: brand }}
                >
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-semibold truncate">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {p.medico} · {p.sesiones} sesiones
                  </p>
                  <p className="text-gray-300 text-[10px] mt-0.5">Última: {p.ultima_sesion}</p>
                </div>
                {/* Risk badge */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: rStyle.bg, color: rStyle.text }}
                  >
                    {p.riesgo}
                  </span>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </ClinicLayout>
  )
}
