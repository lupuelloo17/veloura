import { useState } from 'react'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import StaffLayout from './StaffLayout'
import { formatEUR } from '../../config/planes'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

const RESUMEN = {
  ingresos_mes:    12400,
  ingresos_previo: 11200,
  pendiente:        2850,
  ticket_promedio:   365,
  ticket_previo:     340,
  facturas_mes:       34,
  tasa_cobro:         87,
}

const SEMANAS = [
  { label: 'S1 Mar', ingresos: 2800, gastos: 420 },
  { label: 'S2 Mar', ingresos: 3100, gastos: 380 },
  { label: 'S3 Mar', ingresos: 2600, gastos: 510 },
  { label: 'S4 Mar', ingresos: 3200, gastos: 290 },
  { label: 'S1 Abr', ingresos: 2950, gastos: 440 },
  { label: 'S2 Abr', ingresos: 3400, gastos: 360 },
  { label: 'S3 Abr', ingresos: 3100, gastos: 480 },
  { label: 'S4 Abr', ingresos: 3650, gastos: 320 },
  { label: 'S1 May', ingresos: 2900, gastos: 390 },
  { label: 'S2 May', ingresos: 3200, gastos: 410 },
  { label: 'S3 May', ingresos: 3450, gastos: 350 },
  { label: 'S4 May', ingresos: 3200, gastos: 430 },
]

const FACTURAS = [
  { id: 'F-2026-034', paciente: 'Carmen López',    tratamiento: 'Mesoterapia facial',      importe: 150,  iva: 24,   total: 174,   estado: 'pagada',   fecha: '2026-05-14' },
  { id: 'F-2026-033', paciente: 'Ana Martínez',    tratamiento: 'Radiofrecuencia facial',  importe: 180,  iva: 28.8, total: 208.8, estado: 'pagada',   fecha: '2026-05-13' },
  { id: 'F-2026-032', paciente: 'Isabel Torres',   tratamiento: 'Toxina botulínica',       importe: 250,  iva: 40,   total: 290,   estado: 'pagada',   fecha: '2026-05-11' },
  { id: 'F-2026-031', paciente: 'María Fernández', tratamiento: 'Peeling químico',         importe: 120,  iva: 19.2, total: 139.2, estado: 'emitida',  fecha: '2026-05-10' },
  { id: 'F-2026-030', paciente: 'Laura Sánchez',   tratamiento: 'Tratamiento antimanchas', importe: 200,  iva: 32,   total: 232,   estado: 'vencida',  fecha: '2026-04-28' },
  { id: 'F-2026-029', paciente: 'Patricia Ruiz',   tratamiento: 'Consulta inicial',        importe: 80,   iva: 12.8, total: 92.8,  estado: 'vencida',  fecha: '2026-04-25' },
  { id: 'F-2026-028', paciente: 'Carmen López',    tratamiento: 'Ácido hialurónico',       importe: 350,  iva: 56,   total: 406,   estado: 'pagada',   fecha: '2026-04-20' },
  { id: 'F-2026-027', paciente: 'Ana Martínez',    tratamiento: 'Revisión y seguimiento',  importe: 50,   iva: 8,    total: 58,    estado: 'borrador', fecha: '2026-05-15' },
]

const CUENTAS_COBRAR = [
  { paciente: 'Laura Sánchez',   importe: 232,   dias_mora: 17, ultimo_contacto: '2026-05-10', telefono: '+34 677 234 567' },
  { paciente: 'Patricia Ruiz',   importe: 92.8,  dias_mora: 20, ultimo_contacto: '2026-05-08', telefono: '+34 612 789 012' },
  { paciente: 'María Fernández', importe: 139.2, dias_mora: 5,  ultimo_contacto: '2026-05-12', telefono: '+34 655 123 456' },
]

const ESTADO_FACTURA = {
  pagada:   { label: 'PAGADA',   color: '#929C92', bg: 'rgba(146,156,146,0.10)', border: 'rgba(146,156,146,0.2)' },
  emitida:  { label: 'EMITIDA',  color: '#A39384', bg: 'rgba(163,147,132,0.10)', border: 'rgba(163,147,132,0.2)' },
  vencida:  { label: 'VENCIDA',  color: '#8B3A3A', bg: 'rgba(139,58,58,0.08)',   border: 'rgba(139,58,58,0.2)'   },
  borrador: { label: 'BORRADOR', color: 'rgba(22,19,19,0.3)', bg: 'rgba(22,19,19,0.04)', border: 'rgba(22,19,19,0.1)' },
}

const URGENCIA_COLOR = { alta: '#8B3A3A', media: '#A39384', baja: '#929C92' }

function pctCambio(actual, previo) {
  return Math.round(((actual - previo) / previo) * 100)
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function urgencia(dias) {
  return dias > 15 ? 'alta' : dias > 7 ? 'media' : 'baja'
}

const card = {
  background: '#FFFFFF',
  border: '1px solid rgba(22,19,19,0.07)',
  borderRadius: '2px',
}

export default function FinanzasPage() {
  const { clinica } = useClinic()
  const { logout }  = useAuth()

  const [tab,            setTab]            = useState('dashboard')
  const [filtroFactura,  setFiltroFactura]  = useState('todas')

  const facturasFiltradas = filtroFactura === 'todas'
    ? FACTURAS
    : FACTURAS.filter(f => f.estado === filtroFactura)

  const totalFacturasFiltradas = facturasFiltradas.reduce((s, f) => s + f.total, 0)

  const maxVal        = Math.max(...SEMANAS.map(s => s.ingresos))
  const chartH        = 160
  const chartPad      = 20
  const barW          = 100 / SEMANAS.length
  const totalIngresos = SEMANAS.reduce((s, w) => s + w.ingresos, 0)
  const totalGastos   = SEMANAS.reduce((s, w) => s + w.gastos, 0)

  const totalPendiente   = CUENTAS_COBRAR.reduce((s, c) => s + c.importe, 0)
  const diasMoraPromedio = Math.round(CUENTAS_COBRAR.reduce((s, c) => s + c.dias_mora, 0) / CUENTAS_COBRAR.length)

  const TAB_LIST = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'facturas',  label: 'Facturas'  },
    { key: 'cobrar',    label: 'Cuentas por cobrar' },
  ]

  const FILTER_FACTURAS = [
    { key: 'todas',    label: 'Todas'    },
    { key: 'pagada',   label: 'Pagadas'  },
    { key: 'emitida',  label: 'Emitidas' },
    { key: 'vencida',  label: 'Vencidas' },
  ]

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
            Gestión financiera
          </p>
          <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Finanzas
          </h1>
          <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', marginBottom: 0 }}>
            {clinica?.nombre}
          </p>
        </div>

        {/* ── TABS ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(22,19,19,0.08)', marginBottom: '32px' }}>
          {TAB_LIST.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: DM_SANS, fontSize: '13px',
                letterSpacing: '0.02em', transition: 'all 0.15s',
                borderBottom: `2px solid ${tab === t.key ? '#161313' : 'transparent'}`,
                color: tab === t.key ? '#161313' : 'rgba(22,19,19,0.35)',
                fontWeight: tab === t.key ? 400 : 300,
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB DASHBOARD ───────────────────────────────── */}
        {tab === 'dashboard' && (
          <>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>

              {/* Ingresos del mes */}
              <div style={{ ...card, padding: '24px' }}>
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.3)', margin: '0 0 12px' }}>
                  INGRESOS · MAY 2026
                </p>
                <p style={{ fontFamily: FRAUNCES, fontSize: '38px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  {formatEUR(RESUMEN.ingresos_mes)}
                </p>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#929C92', margin: 0 }}>
                  +{pctCambio(RESUMEN.ingresos_mes, RESUMEN.ingresos_previo)}% vs abril
                </p>
              </div>

              {/* Pendiente de cobro */}
              <div style={{ ...card, padding: '24px' }}>
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.3)', margin: '0 0 12px' }}>
                  PENDIENTE COBRO
                </p>
                <p style={{ fontFamily: FRAUNCES, fontSize: '38px', fontWeight: 300, color: '#8B3A3A', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  {formatEUR(RESUMEN.pendiente)}
                </p>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#A39384', margin: 0 }}>
                  {CUENTAS_COBRAR.length} facturas vencidas
                </p>
              </div>

              {/* Ticket promedio */}
              <div style={{ ...card, padding: '24px' }}>
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.3)', margin: '0 0 12px' }}>
                  TICKET PROMEDIO
                </p>
                <p style={{ fontFamily: FRAUNCES, fontSize: '38px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  {formatEUR(RESUMEN.ticket_promedio)}
                </p>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#929C92', margin: 0 }}>
                  +{pctCambio(RESUMEN.ticket_promedio, RESUMEN.ticket_previo)}% vs abril
                </p>
              </div>

              {/* Tasa de cobro */}
              <div style={{ ...card, padding: '24px' }}>
                <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(22,19,19,0.3)', margin: '0 0 12px' }}>
                  TASA DE COBRO
                </p>
                <p style={{ fontFamily: FRAUNCES, fontSize: '38px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  {RESUMEN.tasa_cobro}%
                </p>
                <div style={{ height: '2px', background: 'rgba(22,19,19,0.06)', borderRadius: '1px', marginBottom: '8px' }}>
                  <div style={{ width: RESUMEN.tasa_cobro + '%', height: '100%', background: '#929C92', borderRadius: '1px' }} />
                </div>
                <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', margin: 0 }}>
                  {RESUMEN.facturas_mes} facturas emitidas
                </p>
              </div>
            </div>

            {/* Gráfica */}
            <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>
                  Evolución de ingresos
                </span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { color: 'rgba(146,156,146,0.6)', label: 'Ingresos' },
                    { color: 'rgba(163,147,132,0.4)', label: 'Gastos'   },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <svg width="100%" height="200" style={{ overflow: 'visible' }}>
                {SEMANAS.map((s, i) => {
                  const groupW   = 100 / SEMANAS.length
                  const x        = i * groupW
                  const ingH     = (s.ingresos / maxVal) * chartH
                  const gasH     = (s.gastos   / maxVal) * chartH
                  const barWide  = groupW * 0.35
                  const gasWide  = groupW * 0.2
                  const ingX     = x + groupW * 0.15
                  const gasX     = x + groupW * 0.52
                  const labelX   = x + groupW / 2

                  return (
                    <g key={i}>
                      <rect
                        x={`${ingX}%`} y={chartH - ingH + chartPad}
                        width={`${barWide}%`} height={ingH}
                        fill="rgba(146,156,146,0.6)" rx="1"
                      />
                      <rect
                        x={`${gasX}%`} y={chartH - gasH + chartPad}
                        width={`${gasWide}%`} height={gasH}
                        fill="rgba(163,147,132,0.4)" rx="1"
                      />
                      <text
                        x={`${labelX}%`} y={chartH + chartPad + 16}
                        textAnchor="middle"
                        style={{ fontFamily: DM_MONO, fontSize: '8px', fill: 'rgba(22,19,19,0.3)' }}
                      >
                        {s.label}
                      </text>
                    </g>
                  )
                })}
              </svg>

              <div style={{ display: 'flex', gap: '32px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(22,19,19,0.06)' }}>
                {[
                  { label: 'Total ingresos', valor: totalIngresos, color: '#161313' },
                  { label: 'Total gastos',   valor: totalGastos,   color: '#161313' },
                  { label: 'Beneficio neto', valor: totalIngresos - totalGastos, color: '#929C92' },
                ].map(t => (
                  <div key={t.label}>
                    <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                      {t.label}
                    </p>
                    <p style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: t.color, margin: 0 }}>
                      {formatEUR(t.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB FACTURAS ────────────────────────────────── */}
        {tab === 'facturas' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
              <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>
                {FACTURAS.length} facturas
              </span>
              <div style={{ flex: 1 }} />
              {FILTER_FACTURAS.map(f => {
                const active = filtroFactura === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFiltroFactura(f.key)}
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

            {/* Tabla */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(22,19,19,0.06)', background: 'rgba(22,19,19,0.01)' }}>
                    {['FACTURA', 'PACIENTE', 'TRATAMIENTO', 'IMPORTE', 'IVA', 'TOTAL', 'ESTADO', 'FECHA'].map(col => (
                      <th key={col} style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)', padding: '10px 20px', textAlign: 'left', fontWeight: 400 }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.map(f => {
                    const ef = ESTADO_FACTURA[f.estado] ?? ESTADO_FACTURA.borrador
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid rgba(22,19,19,0.04)' }}>
                        <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.5)', letterSpacing: '0.04em' }}>{f.id}</td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313' }}>{f.paciente}</td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)' }}>{f.tratamiento}</td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '13px', color: 'rgba(22,19,19,0.6)' }}>{formatEUR(f.importe)}</td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '12px', color: 'rgba(22,19,19,0.3)' }}>{formatEUR(f.iva)}</td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '13px', fontWeight: 500, color: '#161313' }}>{formatEUR(f.total)}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '2px', border: `1px solid ${ef.border}`, background: ef.bg, color: ef.color }}>
                            {ef.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.35)' }}>{formatFecha(f.fecha)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(22,19,19,0.08)', background: 'rgba(22,19,19,0.01)' }}>
                    <td colSpan={5} style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)' }}>
                      Total
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: '#161313' }}>
                        {formatEUR(totalFacturasFiltradas)}
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* ── TAB CUENTAS POR COBRAR ──────────────────────── */}
        {tab === 'cobrar' && (
          <>
            {/* Banner resumen */}
            <div style={{ background: 'rgba(139,58,58,0.04)', border: '1px solid rgba(139,58,58,0.12)', borderRadius: '2px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '32px' }}>
              {[
                { label: 'TOTAL PENDIENTE',    valor: formatEUR(totalPendiente),      color: '#8B3A3A' },
                { label: 'FACTURAS VENCIDAS',  valor: CUENTAS_COBRAR.length,          color: '#8B3A3A' },
                { label: 'DÍAS MORA PROMEDIO', valor: diasMoraPromedio + ' días',     color: '#8B3A3A' },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)', margin: '0 0 4px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: FRAUNCES, fontSize: '24px', fontWeight: 300, color: item.color, margin: 0 }}>
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>

            {/* Cuentas */}
            {CUENTAS_COBRAR.map((cuenta, idx) => {
              const urg   = urgencia(cuenta.dias_mora)
              const color = URGENCIA_COLOR[urg]
              const waHref = `https://wa.me/${cuenta.telefono.replace(/\s/g, '')}`
              return (
                <div key={idx} style={{ ...card, padding: '20px 24px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                    {/* Semáforo */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: color }} />

                    {/* Info paciente */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>
                        {cuenta.paciente}
                      </p>
                      <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', margin: '2px 0 0' }}>
                        Último contacto: {formatFecha(cuenta.ultimo_contacto)}
                      </p>
                    </div>

                    {/* Días mora */}
                    <div style={{ textAlign: 'center', minWidth: '80px' }}>
                      <p style={{ fontFamily: FRAUNCES, fontSize: '24px', fontWeight: 300, color, margin: 0 }}>
                        {cuenta.dias_mora}
                      </p>
                      <p style={{ fontFamily: DM_MONO, fontSize: '9px', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                        Días mora
                      </p>
                    </div>

                    {/* Importe */}
                    <p style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: '#161313', minWidth: '100px', textAlign: 'right', margin: 0 }}>
                      {formatEUR(cuenta.importe)}
                    </p>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`tel:${cuenta.telefono}`}
                        style={{ border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', padding: '7px 12px', fontFamily: DM_SANS, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(22,19,19,0.4)', background: 'none', cursor: 'pointer', textDecoration: 'none' }}
                      >
                        Llamar
                      </a>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        style={{ border: '1px solid rgba(90,122,90,0.2)', borderRadius: '2px', padding: '7px 12px', fontFamily: DM_SANS, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5A7A5A', background: 'none', cursor: 'pointer', textDecoration: 'none' }}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

      </div>
    </StaffLayout>
  )
}
