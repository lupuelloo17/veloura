import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import StaffLayout from './StaffLayout'
import NuevoPacienteDrawer from '../../components/NuevoPacienteDrawer'
import PACIENTES from '../../data/pacientes'
import { supabase } from '../../lib/supabase'
import { formatFecha } from '../../utils/fecha'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RIESGO_STYLE = {
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)' },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)' },
  alto:     { color: '#161313', bg: 'rgba(22,19,19,0.06)',    border: 'rgba(22,19,19,0.15)'   },
}

const FILTERS = [
  { key: 'todos',    label: 'Todos'    },
  { key: 'bajo',     label: 'Bajo'     },
  { key: 'moderado', label: 'Moderado' },
  { key: 'alto',     label: 'Alto'     },
]

export default function PacientesPage() {
  const navigate    = useNavigate()
  const { slug }    = useParams()
  const { clinica } = useClinic()

  const [pacientes,  setPacientes]  = useState(PACIENTES)
  const [cargando,   setCargando]   = useState(false)
  const [query,      setQuery]      = useState('')
  const [filter,     setFilter]     = useState('todos')
  const [showDrawer, setShowDrawer] = useState(false)
  const [toast,      setToast]      = useState(null)
  const [focusSearch, setFocusSearch] = useState(false)

  useEffect(() => {
    if (!supabase || !clinica?.id || clinica._isMock) return
    setCargando(true)
    supabase
      .from('pacientes')
      .select('*')
      .eq('clinica_id', clinica.id)
      .order('creado_en', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data?.length) setPacientes(data)
        setCargando(false)
      })
  }, [clinica?.id])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleGuardado(nuevo) {
    setPacientes(prev => [nuevo, ...prev])
    showToast('Paciente añadido correctamente')
  }

  const filtered = pacientes.filter(p => {
    const matchQuery = `${p.nombre} ${p.apellido}`.toLowerCase().includes(query.toLowerCase())
    const matchRisk  = filter === 'todos' || p.riesgo === filter
    return matchQuery && matchRisk
  })

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <p style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Gestión de pacientes
            </p>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
              Pacientes
            </h1>
            <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', marginBottom: 0 }}>
              {filtered.length} pacientes registrados
            </p>
          </div>

          <button
            onClick={() => setShowDrawer(true)}
            style={{
              background: '#161313', color: '#F7F5F2', border: 'none',
              borderRadius: '2px', padding: '10px 20px',
              fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: '14px' }} />
            Nuevo paciente
          </button>
        </div>

        {/* ── BÚSQUEDA + FILTROS ──────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>

          {/* Búsqueda */}
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="ti ti-search" style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '14px', color: 'rgba(22,19,19,0.25)', pointerEvents: 'none',
            }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocusSearch(true)}
              onBlur={() => setFocusSearch(false)}
              placeholder="Buscar por nombre, email..."
              style={{
                width: '100%', padding: '11px 16px 11px 40px',
                background: '#FFFFFF',
                border: `1px solid ${focusSearch ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.08)'}`,
                borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px',
                fontWeight: 300, color: '#161313', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    borderRadius: '2px', padding: '8px 14px',
                    fontFamily: DM_MONO, fontSize: '10px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.15s',
                    ...(active
                      ? { background: '#161313', color: '#F7F5F2', border: '1px solid #161313' }
                      : { background: 'transparent', color: 'rgba(22,19,19,0.4)', border: '1px solid rgba(22,19,19,0.1)' }
                    ),
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── TABLA ───────────────────────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', overflow: 'hidden' }}>

          {cargando && (
            <>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: '64px', background: 'rgba(22,19,19,0.03)', marginBottom: '1px' }} />
              ))}
            </>
          )}

          {!cargando && filtered.length === 0 && (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <i className="ti ti-users-off" style={{ fontSize: '28px', color: 'rgba(22,19,19,0.12)', display: 'block', marginBottom: '8px' }} />
              <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
                No se encontraron pacientes
              </p>
            </div>
          )}

          {!cargando && filtered.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(22,19,19,0.06)', background: 'rgba(22,19,19,0.01)' }}>
                  {['Paciente', 'Riesgo', 'Última visita', 'Visitas', ''].map(col => (
                    <th key={col} style={{
                      fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)',
                      padding: '10px 20px', textAlign: 'left', fontWeight: 400,
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const rs      = RIESGO_STYLE[p.riesgo] ?? RIESGO_STYLE.bajo
                  const inicial = `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase()
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/clinica/${slug}/paciente/${p.id}`)}
                      style={{ borderBottom: '1px solid rgba(22,19,19,0.04)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,19,19,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Paciente */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.foto_perfil ? (
                            <img
                              src={p.foto_perfil}
                              alt={p.nombre}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(22,19,19,0.06)', border: '1px solid rgba(22,19,19,0.08)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ fontFamily: FRAUNCES, fontSize: '13px', color: 'rgba(22,19,19,0.4)' }}>
                                {inicial}
                              </span>
                            </div>
                          )}
                          <div>
                            <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>
                              {p.nombre} {p.apellido}
                            </p>
                            {p.email && (
                              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: '1px 0 0' }}>
                                {p.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Riesgo */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em',
                          textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px',
                          border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
                        }}>
                          {p.riesgo ?? 'bajo'}
                        </span>
                      </td>

                      {/* Última visita */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '12px', color: 'rgba(22,19,19,0.45)' }}>
                          {!p.ultima_visita || isNaN(new Date(p.ultima_visita)) ? '—' : formatFecha(p.ultima_visita)}
                        </span>
                      </td>

                      {/* Visitas */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '13px', color: '#161313' }}>
                          {p.total_visitas ?? '0'}
                        </span>
                      </td>

                      {/* Flecha */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: DM_MONO, fontSize: '14px', color: 'rgba(22,19,19,0.2)' }}>→</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── DRAWER ──────────────────────────────────────── */}
      {showDrawer && (
        <NuevoPacienteDrawer
          onClose={() => setShowDrawer(false)}
          onGuardado={handleGuardado}
        />
      )}

      {/* ── TOAST ───────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
          background: '#161313', color: '#F7F5F2',
          padding: '12px 20px', borderRadius: '2px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
        }}>
          <span style={{ color: '#929C92' }}>✓</span>
          {toast}
        </div>
      )}
    </StaffLayout>
  )
}
