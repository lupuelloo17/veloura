import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCitas } from '../../contexts/CitasContext'
import FeatureGate from '../../components/FeatureGate'
import StaffLayout from './StaffLayout'
import { formatEUR } from '../../config/planes'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const STATS = [
  { label: 'Pacientes',     value: 148,        sub: 'de 300 máx.',    icono: 'ti-users'       },
  { label: 'Sesiones/mes',  value: 34,          sub: 'últimos 30 días', icono: 'ti-calendar'    },
  { label: 'Análisis IA',   value: 27,          sub: 'dermoscópicos',   icono: 'ti-microscope'  },
  { label: 'Ing. estimado', value: '~12.400 €', sub: 'este mes',        icono: 'ti-trending-up' },
]

const KPI_CARDS = [
  { label: 'Pacientes activos', valor: '148',            tendencia: '+12 este mes',          icono: 'ti-users'       },
  { label: 'Sesiones / mes',    valor: '34',             tendencia: '+5 vs mes anterior',    icono: 'ti-calendar'    },
  { label: 'Análisis IA',       valor: '27',             tendencia: '3 pendientes revisión', icono: 'ti-microscope'  },
  { label: 'Ingresos',          valor: formatEUR(12400), tendencia: '+8% vs mes anterior',   icono: 'ti-trending-up' },
]

const DOCTORS = [
  { nombre: 'Dra. García',  especialidad: 'Medicina Estética', pacientes: 48, sesiones_mes: 20, activo: true,  foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face' },
  { nombre: 'Dr. Ruiz',     especialidad: 'Dermatología',       pacientes: 31, sesiones_mes: 9,  activo: true,  foto: null },
  { nombre: 'Dra. Montoya', especialidad: 'Medicina Estética',  pacientes: 12, sesiones_mes: 5,  activo: false, foto: null },
]

const ALERTS = [
  { tipo: 'abandono',   texto: '5 pacientes sin actividad en +60 días', color: '#d97706' },
  { tipo: 'renovacion', texto: 'Plan Premium · Renueva en 11 meses',    color: '#2563eb' },
  { tipo: 'capacidad',  texto: 'Capacidad al 49% (148/300 pacientes)',  color: '#16a34a' },
]

const ALERT_DOT   = { abandono: '#929C92', renovacion: '#A39384', capacidad: 'rgba(22,19,19,0.2)' }
const ALERT_TITLE = { abandono: 'Riesgo abandono', renovacion: 'Suscripción', capacidad: 'Capacidad' }

function getCitasMetrics(citas) {
  const weekStart  = new Date('2026-05-11T00:00:00')
  const weekEnd    = new Date('2026-05-17T23:59:59')
  const estaSemana = citas.filter(c => {
    const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
    return f >= weekStart && f <= weekEnd
  })
  const total       = citas.length
  const confirmadas = citas.filter(c => ['confirmada','completada'].includes(c.estado)).length
  const noShows     = citas.filter(c => c.estado === 'no_asistio').length
  const tasa_conf   = total > 0 ? Math.round((confirmadas / total) * 100) : 0
  const tasa_ns     = total > 0 ? Math.round((noShows    / total) * 100) : 0
  const freq = {}
  citas.forEach(c => { freq[c.tratamiento] = (freq[c.tratamiento] || 0) + 1 })
  const topTrat      = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const topTratShort = topTrat.length > 18 ? topTrat.slice(0, 18) + '…' : topTrat
  return { citasSemana: estaSemana.length, tasa_conf, tasa_ns, topTrat: topTratShort }
}

const card = {
  background: '#FFFFFF',
  border: '1px solid rgba(22,19,19,0.07)',
  borderRadius: '2px',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { clinica, plan } = useClinic()
  const { user, logout }  = useAuth()
  const { citas }         = useCitas()
  const citasMetrics = getCitasMetrics(citas)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError,   setPortalError]   = useState(null)

  const pagoFallido = clinica?.stripe_subscription_status === 'past_due'
  const planActivo  = clinica?.plan_activo !== false

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handlePortal() {
    if (!clinica?.stripe_customer_id) {
      navigate('/precios')
      return
    }
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/create-portal-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customerId:  clinica.stripe_customer_id,
          clinicaSlug: clinica.slug,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      setPortalError(err.message)
    } finally {
      setPortalLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <p style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', margin: '0 0 6px' }}>
              {clinica?.nombre}
            </p>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
              Dashboard ejecutivo
            </h1>
            <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', textTransform: 'capitalize', margin: '4px 0 0' }}>
              {today}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '1px solid rgba(22,19,19,0.12)', padding: '6px 14px', borderRadius: '2px',
              color: 'rgba(22,19,19,0.4)',
            }}>
              {clinica?.plan?.toUpperCase() ?? '—'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px',
                padding: '6px 14px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(22,19,19,0.35)', cursor: 'pointer', fontFamily: DM_SANS,
              }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── PAGO FALLIDO ────────────────────────────────── */}
        {pagoFallido && (
          <div style={{
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)',
            borderRadius: '2px', padding: '14px 20px', marginBottom: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: 'rgba(185,28,28,0.9)', margin: '0 0 2px' }}>
                Pago fallido
              </p>
              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(185,28,28,0.7)', margin: 0 }}>
                Actualiza tu método de pago para no perder el acceso.
              </p>
            </div>
            <button
              onClick={handlePortal}
              style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(185,28,28,0.8)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}
            >
              Actualizar
            </button>
          </div>
        )}

        {/* ── KPI GRID ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '40px' }}>
          {KPI_CARDS.map(kpi => (
            <div key={kpi.label} style={{ ...card, padding: '24px' }}>
              <div style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`ti ${kpi.icono}`} style={{ fontSize: '13px', color: '#929C92' }} />
                {kpi.label}
              </div>
              <p style={{ fontFamily: FRAUNCES, fontSize: '40px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 8px' }}>
                {kpi.valor}
              </p>
              <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: 0 }}>
                {kpi.tendencia}
              </p>
            </div>
          ))}
        </div>

        {/* ── GRID INFERIOR ───────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Tabla médicos */}
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Equipo médico</span>
              <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', letterSpacing: '0.1em' }}>
                {DOCTORS.length} ESPECIALISTAS
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(22,19,19,0.06)' }}>
                  {['ESPECIALISTA', 'PACIENTES', 'SESIONES', 'ESTADO'].map(h => (
                    <th key={h} style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)', padding: '10px 24px', textAlign: 'left', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCTORS.map(d => (
                  <tr key={d.nombre} style={{ borderBottom: '1px solid rgba(22,19,19,0.04)' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {d.foto
                          ? <img src={d.foto} alt={d.nombre} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(146,156,146,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: FRAUNCES, fontSize: '12px', color: '#929C92' }}>
                                {d.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                          )
                        }
                        <div>
                          <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0 }}>{d.nombre}</p>
                          <p style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: 0 }}>{d.especialidad}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontFamily: DM_MONO, fontSize: '13px', color: '#161313' }}>{d.pacientes}</td>
                    <td style={{ padding: '14px 24px', fontFamily: DM_MONO, fontSize: '13px', color: '#161313' }}>{d.sesiones_mes}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '2px',
                        ...(d.activo
                          ? { background: 'rgba(146,156,146,0.12)', color: '#929C92', border: '1px solid rgba(146,156,146,0.2)' }
                          : { background: 'rgba(22,19,19,0.04)',    color: 'rgba(22,19,19,0.3)', border: '1px solid rgba(22,19,19,0.08)' }
                        ),
                      }}>
                        {d.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alertas + citas */}
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Alertas clínicas</span>
              <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(185,28,28,0.5)', letterSpacing: '0.1em', border: '1px solid rgba(185,28,28,0.15)', padding: '3px 8px', borderRadius: '2px' }}>
                {ALERTS.length}
              </span>
            </div>
            {ALERTS.map(a => (
              <div key={a.tipo} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(22,19,19,0.05)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '6px', background: ALERT_DOT[a.tipo] }} />
                <div>
                  <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: '0 0 2px' }}>{ALERT_TITLE[a.tipo]}</p>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', lineHeight: 1.5, margin: 0 }}>{a.texto}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '6px', background: 'rgba(22,19,19,0.15)' }} />
              <div>
                <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: '0 0 2px' }}>Agenda esta semana</p>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', lineHeight: 1.5, margin: 0 }}>
                  {citasMetrics.citasSemana} citas · {citasMetrics.tasa_conf}% confirmadas · {citasMetrics.tasa_ns}% no-shows
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BILLING ─────────────────────────────────────── */}
        <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 6px' }}>
                Mi suscripción
              </h2>
              <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: 0 }}>
                Gestiona tu plan, facturas y método de pago
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: FRAUNCES, fontSize: '28px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: 0 }}>
                {formatEUR(plan?.precio ?? 0)}
              </p>
              <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                / MES
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid rgba(22,19,19,0.12)', padding: '5px 12px', borderRadius: '2px', color: 'rgba(22,19,19,0.4)' }}>
              {plan?.nombre ?? 'Sin plan'}
            </span>
            <span style={{
              fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: '2px',
              ...(pagoFallido
                ? { background: 'rgba(220,38,38,0.08)', color: 'rgba(185,28,28,0.8)', border: '1px solid rgba(220,38,38,0.15)' }
                : planActivo
                  ? { background: 'rgba(146,156,146,0.1)', color: '#929C92', border: '1px solid rgba(146,156,146,0.2)' }
                  : { background: 'rgba(22,19,19,0.04)', color: 'rgba(22,19,19,0.35)', border: '1px solid rgba(22,19,19,0.08)' }
              ),
            }}>
              {pagoFallido ? 'PAGO PENDIENTE' : planActivo ? 'ACTIVO' : 'INACTIVO'}
            </span>
            {clinica?.fecha_renovacion && (
              <span style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.25)', letterSpacing: '0.04em' }}>
                Renueva {new Date(clinica.fecha_renovacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {portalError && (
            <p style={{ fontFamily: DM_SANS, fontSize: '12px', color: 'rgba(185,28,28,0.8)', marginBottom: '12px' }}>{portalError}</p>
          )}

          <button
            onClick={handlePortal}
            disabled={portalLoading}
            style={{
              fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '1px solid rgba(22,19,19,0.12)', borderRadius: '2px',
              padding: '10px 20px', background: 'transparent',
              color: 'rgba(22,19,19,0.5)', cursor: portalLoading ? 'not-allowed' : 'pointer',
              opacity: portalLoading ? 0.5 : 1, transition: 'opacity 0.15s',
            }}
          >
            {portalLoading ? 'Abriendo portal…' : 'Gestionar suscripción →'}
          </button>
        </div>

        {/* ── DERMOSCOPIA (FeatureGate) ────────────────────── */}
        <FeatureGate feature="dermoscopia_ia">
          <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: 0 }}>
                Análisis dermoscópicos
              </h2>
              <button
                onClick={() => navigate(`/clinica/${slug}/analisis`)}
                style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Ver todos →
              </button>
            </div>
            {[
              { nivel: 'Alto',     n: 3,  dot: '#929C92',             pct: (3  / 27) * 100 },
              { nivel: 'Moderado', n: 9,  dot: '#A39384',             pct: (9  / 27) * 100 },
              { nivel: 'Bajo',     n: 15, dot: 'rgba(22,19,19,0.15)', pct: (15 / 27) * 100 },
            ].map(r => (
              <div key={r.nivel} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <span style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.06em', color: 'rgba(22,19,19,0.4)', width: '60px', textAlign: 'right', flexShrink: 0 }}>
                  {r.nivel}
                </span>
                <div style={{ flex: 1, height: '2px', background: 'rgba(22,19,19,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.dot, borderRadius: '1px' }} />
                </div>
                <span style={{ fontFamily: DM_MONO, fontSize: '12px', color: '#161313', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                  {r.n}
                </span>
              </div>
            ))}
          </div>
        </FeatureGate>

        {/* ── CONFIGURACIÓN ───────────────────────────────── */}
        <div style={{ ...card, padding: '24px' }}>
          <h2 style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313', margin: '0 0 16px' }}>
            Configuración de clínica
          </h2>
          {[
            { label: 'Sede',  value: `${clinica?.ciudad ?? '—'}, ${clinica?.pais ?? '—'}` },
            { label: 'Slug',  value: clinica?.slug ?? '—'           },
            { label: 'Color', value: clinica?.color_primario ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(22,19,19,0.05)' }}>
              <span style={{ fontFamily: DM_MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)' }}>
                {label}
              </span>
              <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: '#161313' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

      </div>
    </StaffLayout>
  )
}
