import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Users, CalendarDays, TrendingUp, Microscope,
  ChevronRight, AlertCircle, ShieldCheck, LogOut,
  Building2, CreditCard, CheckCircle2, UserX, Star,
  ExternalLink, RefreshCw,
} from 'lucide-react'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCitas } from '../../contexts/CitasContext'
import FeatureGate from '../../components/FeatureGate'
import ClinicLayout from './ClinicLayout'
import { formatEUR } from '../../config/planes'

const STATS = [
  { label: 'Pacientes',     value: 148,  sub: 'de 300 máx.',    icon: Users        },
  { label: 'Sesiones/mes',  value: 34,   sub: 'últimos 30 días', icon: CalendarDays },
  { label: 'Análisis IA',   value: 27,   sub: 'dermoscópicos',   icon: Microscope   },
  { label: 'Ing. estimado', value: '~12.400 €', sub: 'este mes', icon: TrendingUp },
]

const DOCTORS = [
  { nombre: 'Dra. García',      especialidad: 'Medicina Estética', pacientes: 48, sesiones_mes: 20, activo: true,  foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face' },
  { nombre: 'Dr. Ruiz',         especialidad: 'Dermatología',       pacientes: 31, sesiones_mes: 9,  activo: true,  foto: null },
  { nombre: 'Dra. Montoya',     especialidad: 'Medicina Estética',  pacientes: 12, sesiones_mes: 5,  activo: false, foto: null },
]

const ALERTS = [
  { tipo: 'abandono',   texto: '5 pacientes sin actividad en +60 días', color: '#d97706' },
  { tipo: 'renovacion', texto: 'Plan Premium · Renueva en 11 meses',    color: '#2563eb' },
  { tipo: 'capacidad',  texto: 'Capacidad al 49% (148/300 pacientes)',  color: '#16a34a' },
]

function getCitasMetrics(citas) {
  // Semana actual: lu 2026-05-11 → do 2026-05-17
  const weekStart = new Date('2026-05-11T00:00:00')
  const weekEnd   = new Date('2026-05-17T23:59:59')
  const estaSemana = citas.filter(c => {
    const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha)
    return f >= weekStart && f <= weekEnd
  })

  const total     = citas.length
  const confirmadas = citas.filter(c => ['confirmada','completada'].includes(c.estado)).length
  const noShows   = citas.filter(c => c.estado === 'no_asistio').length
  const tasa_conf = total > 0 ? Math.round((confirmadas / total) * 100) : 0
  const tasa_ns   = total > 0 ? Math.round((noShows / total) * 100) : 0

  // Tratamiento más solicitado este mes
  const freq = {}
  citas.forEach(c => { freq[c.tratamiento] = (freq[c.tratamiento] || 0) + 1 })
  const topTrat = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const topTratShort = topTrat.length > 18 ? topTrat.slice(0, 18) + '…' : topTrat

  return { citasSemana: estaSemana.length, tasa_conf, tasa_ns, topTrat: topTratShort }
}

export default function AdminDashboardPage() {
  const navigate   = useNavigate()
  const { slug }   = useParams()
  const { clinica, plan } = useClinic()
  const { user, logout }  = useAuth()
  const { citas }         = useCitas()
  const brand = clinica?.color_primario ?? '#C8A882'
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
    <ClinicLayout>
      <div className="animate-fade-in">
        {/* ── Header ── */}
        <div className="bg-white px-5 pt-7 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: brand }}
              >
                {clinica?.nombre?.[0] ?? 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-gray-900 font-bold text-base leading-tight">
                    {clinica?.nombre}
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                    <ShieldCheck size={9} /> ADMIN
                  </span>
                </div>
                <p className="text-gray-400 text-xs capitalize">{today}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Plan pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: brand + '18', color: brand }}
          >
            <CreditCard size={11} />
            {plan?.nombre} · {formatEUR(plan?.precio ?? 0)} / mes
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-4 space-y-4">

          {/* ── Pago fallido — banner rojo ── */}
          {pagoFallido && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-xs font-semibold">Pago fallido</p>
                <p className="text-red-600 text-xs mt-0.5">
                  Actualiza tu método de pago para no perder el acceso.
                </p>
              </div>
              <button
                onClick={handlePortal}
                className="text-red-600 text-xs font-semibold underline flex-shrink-0"
              >
                Actualizar
              </button>
            </div>
          )}

          {/* ── Suscripción ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-900 font-semibold text-sm mb-3 flex items-center gap-2">
              <CreditCard size={14} className="text-gray-400" /> Mi suscripción
            </p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: brand + '18', color: brand }}
                  >
                    {plan?.nombre ?? 'Sin plan'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      planActivo && !pagoFallido
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {pagoFallido ? 'Pago pendiente' : planActivo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {clinica?.fecha_renovacion && (
                  <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
                    <RefreshCw size={9} />
                    Renueva el {new Date(clinica.fecha_renovacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-900 text-lg font-extrabold">{formatEUR(plan?.precio ?? 0)}</p>
                <p className="text-gray-400 text-[10px]">/ mes</p>
              </div>
            </div>

            {portalError && (
              <p className="text-red-500 text-xs mb-2">{portalError}</p>
            )}

            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors active:scale-95"
            >
              {portalLoading
                ? 'Abriendo portal…'
                : <><ExternalLink size={12} /> Gestionar suscripción</>
              }
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {STATS.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
                <Icon size={15} className="text-gray-400 mb-2" />
                <p className="text-gray-900 text-2xl font-bold">{value}</p>
                <p className="text-gray-700 text-xs font-medium leading-snug">{label}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Métricas de citas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-700 text-sm font-semibold">Agenda & Citas</p>
              <button
                onClick={() => navigate(`/clinica/${slug}/agenda`)}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: brand }}
              >
                Ver agenda <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl p-3.5 shadow-sm">
                <CalendarDays size={14} className="text-gray-400 mb-1.5" />
                <p className="text-gray-900 text-2xl font-bold">{citasMetrics.citasSemana}</p>
                <p className="text-gray-700 text-xs font-medium">Citas esta semana</p>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm">
                <CheckCircle2 size={14} className="text-green-500 mb-1.5" />
                <p className="text-gray-900 text-2xl font-bold">{citasMetrics.tasa_conf}%</p>
                <p className="text-gray-700 text-xs font-medium">Tasa confirmación</p>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm">
                <UserX size={14} className="text-red-400 mb-1.5" />
                <p className="text-gray-900 text-2xl font-bold">{citasMetrics.tasa_ns}%</p>
                <p className="text-gray-700 text-xs font-medium">Tasa no-shows</p>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm">
                <Star size={14} className="text-amber-400 mb-1.5" />
                <p className="text-gray-900 text-sm font-bold leading-snug">{citasMetrics.topTrat}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">Top tratamiento</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {ALERTS.map(a => (
              <div
                key={a.tipo}
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border-l-4"
                style={{ borderLeftColor: a.color }}
              >
                <AlertCircle size={15} style={{ color: a.color }} className="flex-shrink-0" />
                <p className="text-gray-700 text-xs">{a.texto}</p>
              </div>
            ))}
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-900 font-semibold text-sm">Equipo médico</p>
              <span className="text-gray-400 text-xs">{DOCTORS.filter(d => d.activo).length} activos</span>
            </div>
            <div className="space-y-3">
              {DOCTORS.map(d => (
                <div key={d.nombre} className="flex items-center gap-3">
                  {d.foto
                    ? <img src={d.foto} alt={d.nombre} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                    : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: d.activo ? brand : '#d1d5db' }}
                      >
                        {d.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${d.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {d.nombre}
                    </p>
                    <p className="text-gray-400 text-xs">{d.especialidad}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-900 text-sm font-bold">{d.pacientes}</p>
                    <p className="text-gray-400 text-[10px]">pacientes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dermoscopy (feature-gated) */}
          <FeatureGate feature="dermoscopia_ia">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-900 font-semibold text-sm">Análisis dermoscópicos</p>
                <button
                  onClick={() => navigate(`/clinica/${slug}/analisis`)}
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: brand }}
                >
                  Ver todos <ChevronRight size={12} />
                </button>
              </div>
              {[
                { nivel: 'alto',     n: 3,  color: '#dc2626' },
                { nivel: 'moderado', n: 9,  color: '#d97706' },
                { nivel: 'bajo',     n: 15, color: '#16a34a' },
              ].map(r => (
                <div key={r.nivel} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span
                    className="text-[10px] font-bold capitalize w-16 text-right"
                    style={{ color: r.color }}
                  >{r.nivel}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.n / 27) * 100}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-gray-600 text-xs font-semibold w-5 text-right">{r.n}</span>
                </div>
              ))}
            </div>
          </FeatureGate>

          {/* Clinic info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-900 font-semibold text-sm mb-2 flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> Configuración
            </p>
            {[
              { label: 'Sede',     value: `${clinica?.ciudad ?? '—'}, ${clinica?.pais ?? '—'}` },
              { label: 'Slug',     value: clinica?.slug ?? '—' },
              { label: 'Color',    value: clinica?.color_primario ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="text-gray-800 text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClinicLayout>
  )
}
