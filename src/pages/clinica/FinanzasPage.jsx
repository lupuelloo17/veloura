// ══════════════════════════════════════════════════════════════════════════
//  FinanzasPage.jsx  —  Dashboard financiero premium
//  Clínica de medicina estética · modelo mixto sesiones + membresías
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { useClinic } from '../../contexts/ClinicContext'
import StaffLayout from './StaffLayout'

const FR = "'Fraunces', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"
const FM = "'DM Mono', monospace"

// ── Datos mock premium ───────────────────────────────────────────────────
const KPI = [
  {
    label: 'Facturación mensual',
    value: '24.850',
    unit:  '€',
    delta: '+12,4%',
    up:    true,
    sub:   'vs. mayo 2026',
  },
  {
    label:  'Ingresos Recurrentes (MRR)',
    value:  '4.200',
    unit:   '€',
    delta:  '+8,1%',
    up:     true,
    sub:    'Membresías Club Lumière',
    accent: true,
  },
  {
    label: 'Ticket Medio',
    value: '412',
    unit:  '€',
    delta: '+5,7%',
    up:    true,
    sub:   '60 sesiones este mes',
  },
  {
    label: 'Margen Neto Est. (EBITDA)',
    value: '68',
    unit:  '%',
    delta: '+2,3pp',
    up:    true,
    sub:   'Tras costes variables',
  },
]

// Evolución mensual (ene → jun 2026)
const MENSUAL = [
  { mes: 'Ene', total: 16800 },
  { mes: 'Feb', total: 18200 },
  { mes: 'Mar', total: 19600 },
  { mes: 'Abr', total: 21400 },
  { mes: 'May', total: 22900 },
  { mes: 'Jun', total: 24850 },
]

// Desglose por unidad de negocio
const UNIDADES = [
  { label: 'Inyectables & Medicina Estética', pct: 54, importe: 13419, brand: true },
  { label: 'Cabina · Tratamientos faciales',  pct: 29, importe:  7207 },
  { label: 'Corner Retail · Skincare',         pct:  9, importe:  2237 },
  { label: 'Membresías Club Lumière',           pct:  8, importe:  1987 },
]

// Últimas transacciones premium
const TRANSACCIONES = [
  { paciente: 'Valentina Moreno',  concepto: 'Full Face · Toxina Botulínica',          canal: 'App',       importe: 680, ok: true  },
  { paciente: 'Lucía Fernández',   concepto: 'Suscripción Mensual Élite · Jun',        canal: 'App',       importe:  99, ok: true  },
  { paciente: 'Sofía Restrepo',    concepto: 'Ácido Hialurónico · Labios & Contorno',  canal: 'Mostrador', importe: 520, ok: true  },
  { paciente: 'Carmen Ortega',     concepto: 'Bioestimulación · Profhilo 2 sesiones',  canal: 'App',       importe: 740, ok: true  },
  { paciente: 'Ana Isabel Torres', concepto: 'Peeling Cosmelan · Melasma intensivo',   canal: 'Mostrador', importe: 890, ok: true  },
  { paciente: 'Marta Llorente',    concepto: 'Suscripción Mensual Élite · Jun',        canal: 'App',       importe:  99, ok: true  },
  { paciente: 'Pilar Castillo',    concepto: 'Radiofrecuencia · Lifting no invasivo',  canal: 'Mostrador', importe: 380, ok: false },
  { paciente: 'Inés Ramos',        concepto: 'Full Face · Ácido Hialurónico Premium',  canal: 'App',       importe: 960, ok: true  },
]

// ── Helpers ──────────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('es-ES').format(n)
}

// ══════════════════════════════════════════════════════════════════════════
//  Gráfico de área SVG puro — sin dependencias externas
// ══════════════════════════════════════════════════════════════════════════
function AreaChart({ data, brandHex }) {
  const W = 560, H = 130, PX = 20, PY = 12
  const maxY = Math.max(...data.map(d => d.total)) * 1.05

  const pts = data.map((d, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - ((d.total / maxY) * (H - PY * 2)),
    ...d,
  }))

  const pathLine = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')
  const pathArea = pathLine +
    ` L${pts[pts.length-1].x.toFixed(1)},${(H-PY).toFixed(1)}` +
    ` L${pts[0].x.toFixed(1)},${(H-PY).toFixed(1)} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%', overflow:'visible' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={brandHex} stopOpacity="0.2" />
          <stop offset="100%" stopColor={brandHex} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Líneas guía */}
      {[0.33, 0.66, 1].map(f => {
        const y = (H - PY - f * (H - PY * 2)).toFixed(1)
        return <line key={f} x1={PX} y1={y} x2={W-PX} y2={y} stroke="rgba(22,19,19,0.05)" strokeWidth="1" />
      })}

      {/* Área */}
      <path d={pathArea} fill="url(#ag)" />
      {/* Línea */}
      <path d={pathLine} fill="none" stroke={brandHex} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />

      {/* Puntos y etiquetas */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
                  fill="#FFFFFF" stroke={brandHex} strokeWidth="1.5" />
          <text x={p.x.toFixed(1)} y={(H).toFixed(1)} textAnchor="middle"
                fontSize="9" fontFamily={FM} fill="rgba(22,19,19,0.28)">
            {p.mes}
          </text>
          {i === pts.length - 1 && (
            <text x={(p.x + 8).toFixed(1)} y={(p.y - 7).toFixed(1)} textAnchor="start"
                  fontSize="9" fontFamily={FM} fill={brandHex}>
              {fmt(p.total)} €
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Página
// ══════════════════════════════════════════════════════════════════════════
export default function FinanzasPage() {
  const { clinica } = useClinic()
  const brandHex = clinica?.color_primario ?? '#929C92'
  const brand    = 'var(--color-brand, #929C92)'

  return (
    <StaffLayout>
      <div style={{
        padding: '36px 36px 72px',
        fontFamily: FB,
        background: '#F7F5F2',
        minHeight: '100%',
      }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom:'32px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <p style={{ margin:'0 0 8px', fontFamily:FM, fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
              Junio 2026 · {clinica?.nombre ?? 'Clínica'}
            </p>
            <h1 style={{ margin:0, fontFamily:FR, fontSize:'30px', fontWeight:400, color:'#161313', letterSpacing:'-0.02em', lineHeight:1.05 }}>
              Finanzas &{' '}
              <em style={{ color: brand, fontStyle:'italic' }}>Rendimiento</em>
            </h1>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            {['3M','6M','1A'].map(p => (
              <button key={p} style={{
                padding:'7px 14px', borderRadius:'2px',
                border:'1px solid rgba(22,19,19,0.1)', background:'transparent',
                fontFamily:FM, fontSize:'9px', letterSpacing:'0.12em',
                textTransform:'uppercase', color:'rgba(22,19,19,0.38)', cursor:'pointer',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
          {KPI.map((k, i) => (
            <div key={i} style={{
              background:'#FFFFFF',
              border:'1px solid rgba(22,19,19,0.07)',
              borderRadius:'2px',
              padding:'22px 20px',
              position:'relative',
              overflow:'hidden',
            }}>
              {/* Acento MRR */}
              {k.accent && (
                <div style={{
                  position:'absolute', top:0, left:0, bottom:0, width:2,
                  background: brand,
                }} />
              )}

              <p style={{ margin:'0 0 14px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                {k.label}
              </p>

              <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'8px' }}>
                <span style={{ fontFamily:FR, fontSize:'32px', fontWeight:400, color:'#161313', letterSpacing:'-0.02em', lineHeight:1 }}>
                  {k.value}
                </span>
                <span style={{ fontFamily:FB, fontSize:'15px', fontWeight:300, color:'rgba(22,19,19,0.35)' }}>
                  {k.unit}
                </span>
              </div>

              <span style={{
                fontFamily:FM, fontSize:'9px', letterSpacing:'0.06em',
                color: k.up ? brandHex : '#8B3A3A',
                background: k.up ? brandHex + '18' : 'rgba(139,58,58,0.08)',
                padding:'3px 8px', borderRadius:'2px',
                display:'inline-block', marginBottom:'6px',
              }}>
                {k.delta}
              </span>

              <p style={{ margin:0, fontFamily:FB, fontSize:'10px', fontWeight:300, color:'rgba(22,19,19,0.32)', display:'block' }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── GRÁFICOS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'14px', marginBottom:'24px' }}>

          {/* Área — evolución mensual */}
          <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px', padding:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
              <div>
                <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
                  Evolución de facturación
                </p>
                <p style={{ margin:0, fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>
                  Ene – Jun 2026
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                <div style={{ width:18, height:2, background: brandHex, borderRadius:1 }} />
                <span style={{ fontFamily:FB, fontSize:'10px', fontWeight:300, color:'rgba(22,19,19,0.38)' }}>
                  Facturación total
                </span>
              </div>
            </div>
            <div style={{ height:'130px' }}>
              <AreaChart data={MENSUAL} brandHex={brandHex} />
            </div>
          </div>

          {/* Barras — desglose unidad de negocio */}
          <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px', padding:'24px' }}>
            <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
              Desglose · unidad de negocio
            </p>
            <p style={{ margin:'0 0 20px', fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>
              Junio 2026
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {UNIDADES.map((u, i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' }}>
                    <span style={{ fontFamily:FB, fontSize:'11px', fontWeight:300, color:'rgba(22,19,19,0.65)', lineHeight:1.35, flex:1, marginRight:'8px' }}>
                      {u.label}
                    </span>
                    <span style={{ fontFamily:FM, fontSize:'10px', color:'rgba(22,19,19,0.45)', flexShrink:0 }}>
                      {fmt(u.importe)} €
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ flex:1, height:'3px', background:'rgba(22,19,19,0.06)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:2,
                        width:`${u.pct}%`,
                        background: u.brand ? brand : `rgba(22,19,19,${0.12 - i*0.02})`,
                      }} />
                    </div>
                    <span style={{ fontFamily:FM, fontSize:'9px', color:'rgba(22,19,19,0.3)', flexShrink:0, width:'26px', textAlign:'right' }}>
                      {u.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRANSACCIONES ── */}
        <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px' }}>

          {/* Header */}
          <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(22,19,19,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
                Últimas transacciones
              </p>
              <p style={{ margin:0, fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>
                Ingresos recientes
              </p>
            </div>
            <button style={{
              padding:'8px 16px', borderRadius:'2px', border:'1px solid rgba(22,19,19,0.1)',
              background:'transparent', fontFamily:FM, fontSize:'8px', letterSpacing:'0.12em',
              textTransform:'uppercase', color:'rgba(22,19,19,0.38)', cursor:'pointer',
            }}>
              Ver todas →
            </button>
          </div>

          {/* Cabecera columnas */}
          <div style={{
            display:'grid', gridTemplateColumns:'160px 1fr 90px 110px 100px',
            padding:'10px 24px', background:'rgba(22,19,19,0.015)',
            borderBottom:'1px solid rgba(22,19,19,0.05)',
          }}>
            {['Paciente','Concepto','Canal','Estado','Importe'].map(h => (
              <span key={h} style={{ fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.26)' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Filas */}
          {TRANSACCIONES.map((t, i) => (
            <div
              key={i}
              style={{
                display:'grid', gridTemplateColumns:'160px 1fr 90px 110px 100px',
                padding:'14px 24px', alignItems:'center',
                borderBottom: i < TRANSACCIONES.length-1 ? '1px solid rgba(22,19,19,0.04)' : 'none',
                transition:'background 0.1s',
                cursor:'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(22,19,19,0.014)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {/* Paciente */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background: brandHex + '20',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:FR, fontSize:'12px', color: brandHex,
                }}>
                  {t.paciente[0]}
                </div>
                <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:400, color:'#161313', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {t.paciente}
                </span>
              </div>

              {/* Concepto */}
              <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:300, color:'rgba(22,19,19,0.55)', paddingRight:'16px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {t.concepto}
              </span>

              {/* Canal */}
              <span style={{ fontFamily:FM, fontSize:'9px', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(22,19,19,0.32)' }}>
                {t.canal}
              </span>

              {/* Estado */}
              <span style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                fontFamily:FM, fontSize:'8px', letterSpacing:'0.1em', textTransform:'uppercase',
                color: t.ok ? brandHex : 'rgba(22,19,19,0.38)',
                background: t.ok ? brandHex + '16' : 'rgba(22,19,19,0.05)',
                padding:'4px 9px', borderRadius:'2px', width:'fit-content',
              }}>
                <span style={{ width:4, height:4, borderRadius:'50%', background: t.ok ? brandHex : 'rgba(22,19,19,0.25)', flexShrink:0 }} />
                {t.ok ? 'Completado' : 'Pendiente'}
              </span>

              {/* Importe */}
              <span style={{ fontFamily:FM, fontSize:'13px', color:'#161313', textAlign:'right' }}>
                {fmt(t.importe)} €
              </span>
            </div>
          ))}

          {/* Footer total */}
          <div style={{
            padding:'14px 24px',
            borderTop:'1px solid rgba(22,19,19,0.06)',
            display:'flex', justifyContent:'flex-end', alignItems:'center',
            background:'rgba(22,19,19,0.012)',
          }}>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:'0 0 2px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>
                Total visible
              </p>
              <p style={{ margin:0, fontFamily:FR, fontSize:'20px', fontWeight:400, color:'#161313' }}>
                {fmt(TRANSACCIONES.reduce((s, t) => s + t.importe, 0))} €
              </p>
            </div>
          </div>
        </div>

      </div>
    </StaffLayout>
  )
}
