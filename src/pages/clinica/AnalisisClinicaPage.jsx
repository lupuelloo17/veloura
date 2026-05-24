import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import FeatureGate from '../../components/FeatureGate'
import StaffLayout from './StaffLayout'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const MOCK_ANALISIS = [
  { id: 'a1', paciente: 'Valentina Morales',   fecha: '15 oct 2025', puntuacion: 3, nivel: 'moderado', criterios_pos: 2, medico: 'Dra. López' },
  { id: 'a2', paciente: 'María Camila Torres', fecha: '1 dic 2025',  puntuacion: 7, nivel: 'alto',     criterios_pos: 5, medico: 'Dr. Ruiz'   },
  { id: 'a3', paciente: 'Sofía Restrepo',      fecha: '5 nov 2025',  puntuacion: 2, nivel: 'moderado', criterios_pos: 2, medico: 'Dra. López' },
  { id: 'a4', paciente: 'Alejandra Gómez',     fecha: '10 ene 2026', puntuacion: 0, nivel: 'bajo',     criterios_pos: 0, medico: 'Dra. López' },
  { id: 'a5', paciente: 'Natalia Herrera',     fecha: '22 feb 2026', puntuacion: 1, nivel: 'bajo',     criterios_pos: 1, medico: 'Dr. Ruiz'   },
  { id: 'a6', paciente: 'Isabella Martínez',   fecha: '3 mar 2026',  puntuacion: 5, nivel: 'alto',     criterios_pos: 4, medico: 'Dra. López' },
]

const RIESGO_STYLE = {
  alto:     { color: '#8B3A3A', bg: 'rgba(139,58,58,0.08)',   border: 'rgba(139,58,58,0.2)',   label: 'ALTO'     },
  moderado: { color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)', label: 'MODERADO' },
  bajo:     { color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)', label: 'BAJO'     },
}

const SUMMARY = [
  { nivel: 'alto',     count: 2 },
  { nivel: 'moderado', count: 2 },
  { nivel: 'bajo',     count: 2 },
]

const FILTERS = [
  { key: 'todos',    label: 'Todos'    },
  { key: 'bajo',     label: 'Bajo'     },
  { key: 'moderado', label: 'Moderado' },
  { key: 'alto',     label: 'Alto'     },
]

export default function AnalisisClinicaPage() {
  const { slug }    = useParams()
  const { clinica } = useClinic()
  const navigate    = useNavigate()
  const [filter, setFilter] = useState('todos')

  const filtered = MOCK_ANALISIS.filter(a => filter === 'todos' || a.nivel === filter)

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>
        <FeatureGate feature="dermoscopia_ia">
          <>
            {/* ── HEADER ──────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(22,19,19,0.3)', margin: '0 0 6px' }}>
                  Dermoscopia · IA
                </p>
                <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
                  Análisis dermoscópicos
                </h1>
                <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', marginBottom: 0 }}>
                  {clinica?.nombre}
                </p>
              </div>
              <button
                onClick={() => navigate(`/clinica/${slug}/dermoscopia`)}
                style={{ background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '10px 18px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="ti ti-microscope" style={{ fontSize: '14px' }} />
                Nuevo análisis
              </button>
            </div>

            {/* ── SUMMARY CARDS ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
              {SUMMARY.map(s => {
                const rs = RIESGO_STYLE[s.nivel]
                return (
                  <div
                    key={s.nivel}
                    onClick={() => setFilter(filter === s.nivel ? 'todos' : s.nivel)}
                    style={{ background: '#FFFFFF', border: `1px solid ${filter === s.nivel ? rs.border : 'rgba(22,19,19,0.07)'}`, borderRadius: '2px', padding: '20px 24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  >
                    <p style={{ fontFamily: FRAUNCES, fontSize: '36px', fontWeight: 300, color: rs.color, margin: 0 }}>
                      {s.count}
                    </p>
                    <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.3)', margin: '6px 0 0' }}>
                      {s.nivel} riesgo
                    </p>
                  </div>
                )
              })}
            </div>

            {/* ── FILTROS ─────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', alignItems: 'center' }}>
              <i className="ti ti-filter" style={{ fontSize: '13px', color: 'rgba(22,19,19,0.3)', marginRight: '4px' }} />
              {FILTERS.map(f => {
                const active = filter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{ borderRadius: '2px', padding: '8px 14px', fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s', ...(active ? { background: '#161313', color: '#F7F5F2', border: '1px solid #161313' } : { background: 'transparent', color: 'rgba(22,19,19,0.4)', border: '1px solid rgba(22,19,19,0.1)' }) }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* ── LISTA DE ANÁLISIS ───────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(a => {
                const rs      = RIESGO_STYLE[a.nivel] ?? RIESGO_STYLE.bajo
                const inicial = a.paciente.split(' ').map(s => s[0]).slice(0, 2).join('')
                return (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/clinica/${slug}/analisis/${a.id}`)}
                    style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '20px 24px', cursor: 'pointer' }}
                  >
                    {/* Fila principal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(22,19,19,0.05)', border: '1px solid rgba(22,19,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: DM_SANS, fontSize: '13px', color: 'rgba(22,19,19,0.4)' }}>{inicial}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>{a.paciente}</p>
                        <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: '2px 0 0' }}>{a.medico} · {a.fecha}</p>
                      </div>
                      <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '2px', border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color, flexShrink: 0 }}>
                        {rs.label}
                      </span>
                      <span style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: 'rgba(22,19,19,0.6)', minWidth: '40px', textAlign: 'right' }}>
                        {a.puntuacion}/7
                      </span>
                      <span style={{ fontFamily: DM_MONO, fontSize: '14px', color: 'rgba(22,19,19,0.2)', marginLeft: '8px' }}>→</span>
                    </div>

                    {/* Barra de puntuación */}
                    <div style={{ marginTop: '10px', height: '2px', background: 'rgba(22,19,19,0.06)', borderRadius: '1px' }}>
                      <div style={{ width: `${(a.puntuacion / 7) * 100}%`, height: '100%', background: rs.color, borderRadius: '1px', transition: 'width 0.3s' }} />
                    </div>

                    {/* Alerta alto riesgo */}
                    {a.nivel === 'alto' && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(139,58,58,0.1)' }}>
                        <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#8B3A3A', margin: 0 }}>
                          ⚠ Requiere revisión urgente por especialista
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        </FeatureGate>
      </div>
    </StaffLayout>
  )
}
