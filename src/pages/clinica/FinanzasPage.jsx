// ══════════════════════════════════════════════════════════════════════════
//  FinanzasPage.jsx  —  Dashboard financiero premium · totalmente interactivo
//  Estados: periodo, tab, sede, cargando, txSelec, exportando, toast, upgrade
// ══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { useClinic } from '../../contexts/ClinicContext'
import StaffLayout from './StaffLayout'

const FR = "'Fraunces', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"
const FM = "'DM Mono', monospace"

// ── Datos por periodo ─────────────────────────────────────────────────────
const PERIODOS = {
  '3M': {
    label: 'Últimos 3 meses',
    kpi: [
      { label:'Facturación', value:'68.300', unit:'€', delta:'+9,8%', up:true,  sub:'Feb – Abr 2026' },
      { label:'MRR',         value:'3.950',  unit:'€', delta:'+11,2%', up:true, sub:'Membresías activas', accent:true },
      { label:'Ticket Medio', value:'398',   unit:'€', delta:'+4,1%', up:true,  sub:'171 sesiones' },
      { label:'EBITDA Est.',  value:'65',    unit:'%',  delta:'+1,8pp', up:true, sub:'Tras costes variables' },
    ],
    mensual: [
      { mes:'Feb', total:20100 },
      { mes:'Mar', total:22400 },
      { mes:'Abr', total:25800 },
    ],
  },
  '6M': {
    label: 'Últimos 6 meses',
    kpi: [
      { label:'Facturación', value:'132.750', unit:'€', delta:'+12,4%', up:true, sub:'Ene – Jun 2026' },
      { label:'MRR',         value:'4.200',   unit:'€', delta:'+8,1%',  up:true, sub:'Membresías Club Lumière', accent:true },
      { label:'Ticket Medio', value:'412',    unit:'€', delta:'+5,7%',  up:true, sub:'322 sesiones' },
      { label:'EBITDA Est.',  value:'68',     unit:'%',  delta:'+2,3pp', up:true, sub:'Tras costes variables' },
    ],
    mensual: [
      { mes:'Ene', total:16800 },
      { mes:'Feb', total:18200 },
      { mes:'Mar', total:19600 },
      { mes:'Abr', total:21400 },
      { mes:'May', total:22900 },
      { mes:'Jun', total:24850 },
    ],
  },
  '1A': {
    label: 'Año completo',
    kpi: [
      { label:'Facturación', value:'248.640', unit:'€', delta:'+18,7%', up:true, sub:'Ene – Dic 2026 (proy.)' },
      { label:'MRR',         value:'4.800',   unit:'€', delta:'+22,4%', up:true, sub:'Membresías Club Lumière', accent:true },
      { label:'Ticket Medio', value:'428',    unit:'€', delta:'+9,2%',  up:true, sub:'581 sesiones (proy.)' },
      { label:'EBITDA Est.',  value:'71',     unit:'%',  delta:'+4,1pp', up:true, sub:'Tras costes variables' },
    ],
    mensual: [
      { mes:'E',  total:16800 },
      { mes:'F',  total:18200 },
      { mes:'M',  total:19600 },
      { mes:'A',  total:21400 },
      { mes:'My', total:22900 },
      { mes:'J',  total:24850 },
      { mes:'Jl', total:22100 },
      { mes:'Ag', total:19800 },
      { mes:'S',  total:21200 },
      { mes:'O',  total:23500 },
      { mes:'N',  total:25900 },
      { mes:'D',  total:28390 },
    ],
  },
}

const UNIDADES = [
  { label:'Inyectables & Medicina Estética', pct:54, importe:13419, brand:true },
  { label:'Cabina · Tratamientos faciales',  pct:29, importe: 7207 },
  { label:'Corner Retail · Skincare',         pct: 9, importe: 2237 },
  { label:'Membresías Club Lumière',           pct: 8, importe: 1987 },
]

const TRANSACCIONES = [
  { id:'TX-001', paciente:'Valentina Moreno',  concepto:'Full Face · Toxina Botulínica',         importe:680,  iva:108.8,  metodoPago:'Tarjeta Visa',   medico:'Dra. García', comision:68,  canal:'App',       ok:true  },
  { id:'TX-002', paciente:'Lucía Fernández',   concepto:'Suscripción Mensual Élite · Jun',       importe: 99,  iva:  0,    metodoPago:'Cargo recurrente', medico:'—',          comision: 0,  canal:'App',       ok:true  },
  { id:'TX-003', paciente:'Sofía Restrepo',    concepto:'Ácido Hialurónico · Labios & Contorno', importe:520,  iva: 83.2,  metodoPago:'Efectivo',         medico:'Dra. García', comision:52,  canal:'Mostrador', ok:true  },
  { id:'TX-004', paciente:'Carmen Ortega',     concepto:'Bioestimulación · Profhilo 2 sesiones', importe:740,  iva:118.4,  metodoPago:'Tarjeta Visa',     medico:'Dr. Ruiz',    comision:74,  canal:'App',       ok:true  },
  { id:'TX-005', paciente:'Ana Isabel Torres', concepto:'Peeling Cosmelan · Melasma intensivo',  importe:890,  iva:142.4,  metodoPago:'Bizum',            medico:'Dra. García', comision:89,  canal:'Mostrador', ok:true  },
  { id:'TX-006', paciente:'Marta Llorente',    concepto:'Suscripción Mensual Élite · Jun',       importe: 99,  iva:  0,    metodoPago:'Cargo recurrente', medico:'—',          comision: 0,  canal:'App',       ok:true  },
  { id:'TX-007', paciente:'Pilar Castillo',    concepto:'Radiofrecuencia · Lifting no invasivo', importe:380,  iva: 60.8,  metodoPago:'Pendiente',        medico:'Dra. García', comision:38,  canal:'Mostrador', ok:false },
  { id:'TX-008', paciente:'Inés Ramos',        concepto:'Full Face · Ácido Hialurónico Premium', importe:960,  iva:153.6,  metodoPago:'Tarjeta Amex',     medico:'Dra. García', comision:96,  canal:'App',       ok:true  },
]

const TABS_DEF = [
  { id:'resumen',     label:'Resumen',            plan:null },
  { id:'comisiones',  label:'Comisiones Médicas',  plan:'premium' },
  { id:'membresias',  label:'Membresías Club',     plan:'elite' },
  { id:'multisede',   label:'Multi-Sede',          plan:'elite' },
]

const SEDES = ['Sede Valencia', 'Sede Madrid']

function fmt(n) { return new Intl.NumberFormat('es-ES').format(n) }

// ══════════════════════════════════════════════════════════════════════════
//  Gráfico de área SVG
// ══════════════════════════════════════════════════════════════════════════
function AreaChart({ data, brandHex, fade }) {
  const W = 560, H = 130, PX = 20, PY = 12
  const maxY = Math.max(...data.map(d => d.total)) * 1.08
  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * (W - PX * 2),
    y: H - PY - ((d.total / maxY) * (H - PY * 2)),
    ...d,
  }))
  const moveto = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')
  const area   = `M${pts[0].x.toFixed(1)},${(H-PY).toFixed(1)} L${moveto} L${pts[pts.length-1].x.toFixed(1)},${(H-PY).toFixed(1)} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%', overflow:'visible', opacity: fade ? 0.35 : 1, transition:'opacity 0.3s' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={brandHex} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={brandHex} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      {[0.33,0.66,1].map(f => {
        const y=(H-PY-f*(H-PY*2)).toFixed(1)
        return <line key={f} x1={PX} y1={y} x2={W-PX} y2={y} stroke="rgba(22,19,19,0.05)" strokeWidth="1"/>
      })}
      <path d={area} fill="url(#ag)"/>
      <path d={`M${moveto}`} fill="none" stroke={brandHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#FFFFFF" stroke={brandHex} strokeWidth="1.5"/>
          <text x={p.x.toFixed(1)} y={H.toFixed(1)} textAnchor="middle" fontSize="9" fontFamily={FM} fill="rgba(22,19,19,0.28)">{p.mes}</text>
          {i===pts.length-1&&<text x={(p.x+8).toFixed(1)} y={(p.y-7).toFixed(1)} textAnchor="start" fontSize="9" fontFamily={FM} fill={brandHex}>{fmt(p.total)} €</text>}
        </g>
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Modal detalle transacción
// ══════════════════════════════════════════════════════════════════════════
function TxModal({ tx, onClose, brandHex }) {
  if (!tx) return null
  const base = tx.importe - tx.iva

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:60,background:'rgba(22,19,19,0.45)',backdropFilter:'blur(4px)',animation:'fxf 0.2s ease' }}/>
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'420px', zIndex:70,
        background:'#FFFFFF', boxShadow:'-8px 0 40px rgba(22,19,19,0.12)',
        display:'flex', flexDirection:'column',
        animation:'fxs 0.28s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid rgba(22,19,19,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                {tx.id} · Factura digital
              </p>
              <h2 style={{ margin:0, fontFamily:FR, fontSize:'22px', fontWeight:400, color:'#161313' }}>
                {tx.paciente}
              </h2>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(22,19,19,0.1)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(22,19,19,0.4)" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

          {/* Estado */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px' }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:'5px',
              fontFamily:FM, fontSize:'8px', letterSpacing:'0.12em', textTransform:'uppercase',
              color: tx.ok ? brandHex : '#8B3A3A',
              background: tx.ok ? brandHex+'18' : 'rgba(139,58,58,0.08)',
              padding:'5px 10px', borderRadius:'2px',
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background: tx.ok?brandHex:'#8B3A3A' }}/>
              {tx.ok ? 'Pagado' : 'Pendiente de cobro'}
            </span>
            <span style={{ fontFamily:FM, fontSize:'9px', color:'rgba(22,19,19,0.3)' }}>{tx.canal}</span>
          </div>

          {/* Concepto */}
          <Section label="Concepto">
            <p style={{ margin:0, fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.7)', lineHeight:1.5 }}>{tx.concepto}</p>
          </Section>

          {/* Desglose económico */}
          <Section label="Desglose de factura">
            <Row3 a="Base imponible"  b={`${fmt(base.toFixed(2))} €`} />
            <Row3 a={`IVA (16%)`}     b={`${fmt(tx.iva.toFixed(2))} €`} light />
            <div style={{ height:1, background:'rgba(22,19,19,0.07)', margin:'8px 0' }}/>
            <Row3 a="Total"           b={<span style={{ fontFamily:FR, fontSize:'18px', color:'#161313' }}>{fmt(tx.importe)} €</span>} bold />
          </Section>

          {/* Método de pago */}
          <Section label="Método de pago">
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:32, height:20, borderRadius:'3px', background:'rgba(22,19,19,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="10" viewBox="0 0 24 16" fill="none" stroke="rgba(22,19,19,0.3)" strokeWidth="1.5">
                  <rect x="1" y="1" width="22" height="14" rx="2"/>
                  <line x1="1" y1="5" x2="23" y2="5"/>
                </svg>
              </div>
              <span style={{ fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(22,19,19,0.7)' }}>{tx.metodoPago}</span>
            </div>
          </Section>

          {/* Comisión médico */}
          {tx.medico !== '—' && (
            <Section label="Comisión médica">
              <Row3 a={tx.medico}       b={`${fmt(tx.comision)} €`} />
              <Row3 a="Porcentaje"       b="10% del neto" light />
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'20px 28px', borderTop:'1px solid rgba(22,19,19,0.07)', display:'flex', gap:'8px' }}>
          <button style={{
            flex:1, padding:'12px',
            border:'1px solid rgba(22,19,19,0.1)', borderRadius:'2px',
            background:'transparent', fontFamily:FM, fontSize:'9px',
            letterSpacing:'0.12em', textTransform:'uppercase',
            color:'rgba(22,19,19,0.45)', cursor:'pointer',
          }}>
            Descargar PDF
          </button>
          <button style={{
            flex:1, padding:'12px',
            border:'none', borderRadius:'2px',
            background:'var(--color-brand,#161313)', fontFamily:FM, fontSize:'9px',
            letterSpacing:'0.12em', textTransform:'uppercase',
            color:'#F7F5F2', cursor:'pointer',
          }}>
            Enviar al paciente
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fxf { from{opacity:0} to{opacity:1} }
        @keyframes fxs { from{transform:translateX(100%)} to{transform:translateX(0)} }
      `}</style>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Modal Upgrade
// ══════════════════════════════════════════════════════════════════════════
function UpgradeModal({ plan, onClose, brandHex }) {
  const isPremium = plan === 'premium'
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:60,background:'rgba(10,8,8,0.7)',backdropFilter:'blur(8px)' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'440px', zIndex:70,
        background:'#0D0B0A',
        borderRadius:'4px', overflow:'hidden',
        boxShadow:'0 24px 80px rgba(0,0,0,0.5)',
        animation:'fxf 0.22s ease',
      }}>
        {/* Línea dorada */}
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${brandHex},#F0CE7A,${brandHex},transparent)` }}/>
        <div style={{ padding:'32px 32px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={brandHex}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontFamily:FM, fontSize:'8px', letterSpacing:'0.2em', textTransform:'uppercase', color:brandHex }}>
              {isPremium ? 'Plan Premium' : 'Plan Élite'} · Función bloqueada
            </span>
          </div>
          <h2 style={{ margin:'0 0 8px', fontFamily:FR, fontSize:'24px', fontWeight:400, color:'#F7F5F2' }}>
            {isPremium ? 'Comisiones Médicas' : 'Finanzas Multi-Sede'}
          </h2>
          <p style={{ margin:'0 0 24px', fontFamily:FB, fontSize:'13px', fontWeight:300, color:'rgba(247,245,242,0.4)', lineHeight:1.65 }}>
            {isPremium
              ? 'Controla el rendimiento económico de cada médico, automatiza las liquidaciones y genera informes de comisiones con un solo clic.'
              : 'Consolida la facturación de todas tus sedes en un único panel, compara el rendimiento por ubicación y gestiona los flujos de caja multi-cuenta con Stripe Connect.'
            }
          </p>
          {/* Beneficios */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'28px' }}>
            {(isPremium
              ? ['Liquidaciones automáticas mensuales','Informe de rendimiento por médico','Dashboard de comisiones en tiempo real']
              : ['Panel consolidado multi-sede','Comparativa de KPIs por ubicación','Stripe Connect para pagos distribuidos']
            ).map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill={brandHex}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:300, color:'rgba(247,245,242,0.6)' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={onClose} style={{ flex:1, padding:'13px', border:'1px solid rgba(247,245,242,0.1)', borderRadius:'2px', background:'transparent', fontFamily:FM, fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(247,245,242,0.35)', cursor:'pointer' }}>
              Ahora no
            </button>
            <button style={{ flex:2, padding:'13px', border:'none', borderRadius:'2px', background:`linear-gradient(135deg,#6B4F0F,${brandHex})`, fontFamily:FM, fontSize:'9px', letterSpacing:'0.16em', textTransform:'uppercase', color:'#0D0B0A', cursor:'pointer' }}>
              Actualizar a {isPremium ? 'Premium' : 'Élite'} →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Micro-helpers ─────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom:'20px' }}>
      <p style={{ margin:'0 0 10px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>{label}</p>
      {children}
    </div>
  )
}
function Row3({ a, b, light, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'5px 0', borderBottom:'1px solid rgba(22,19,19,0.04)' }}>
      <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:300, color: light?'rgba(22,19,19,0.38)':'rgba(22,19,19,0.6)' }}>{a}</span>
      <span style={{ fontFamily: bold?FR:FM, fontSize: bold?'inherit':'11px', fontWeight: bold?400:400, color:'rgba(22,19,19,0.7)' }}>{b}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Toast
// ══════════════════════════════════════════════════════════════════════════
function Toast({ msg, onHide }) {
  useEffect(() => { if (msg) { const t=setTimeout(onHide,3500); return ()=>clearTimeout(t) } }, [msg])
  if (!msg) return null
  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:80,
      background:'#161313', color:'#F7F5F2',
      padding:'14px 20px', borderRadius:'2px',
      display:'flex', alignItems:'center', gap:'10px',
      fontFamily:FB, fontSize:'13px', fontWeight:300,
      boxShadow:'0 8px 24px rgba(22,19,19,0.2)',
      animation:'fxf 0.2s ease',
    }}>
      <span style={{ color:'var(--color-brand,#929C92)' }}>✓</span>
      {msg}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Spinner
// ══════════════════════════════════════════════════════════════════════════
function Spinner({ brandHex }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'40px 0' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid rgba(22,19,19,0.08)`, borderTopColor: brandHex, animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Página principal
// ══════════════════════════════════════════════════════════════════════════
export default function FinanzasPage() {
  const { clinica } = useClinic()
  const brandHex = clinica?.color_primario ?? '#929C92'

  // ── Estados ──────────────────────────────────────────────────────────
  const [periodo,     setPeriodo]     = useState('6M')
  const [tab,         setTab]         = useState('resumen')
  const [sede,        setSede]        = useState(SEDES[0])
  const [cargando,    setCargando]    = useState(false)
  const [txSelec,     setTxSelec]     = useState(null)
  const [exportando,  setExportando]  = useState(false)
  const [toast,       setToast]       = useState('')
  const [upgradePlan, setUpgradePlan] = useState(null) // 'premium' | 'elite'

  // ── Cambio de periodo con spinner ────────────────────────────────────
  function cambiarPeriodo(p) {
    if (p === periodo) return
    setCargando(true)
    setTimeout(() => { setPeriodo(p); setCargando(false) }, 550)
  }

  function cambiarSede(s) {
    setCargando(true)
    setTimeout(() => { setSede(s); setCargando(false) }, 400)
  }

  // ── Exportar ─────────────────────────────────────────────────────────
  async function handleExportar(tipo) {
    if (exportando) return
    setExportando(true)
    await new Promise(r => setTimeout(r, 1400))
    setExportando(false)
    setToast(`Informe financiero ${tipo} exportado correctamente`)
  }

  // ── Click tab (con bloqueo premium) ──────────────────────────────────
  function handleTab(t) {
    if (t.plan) { setUpgradePlan(t.plan); return }
    setTab(t.id)
  }

  const data = PERIODOS[periodo]

  return (
    <StaffLayout>
      <div style={{ padding:'36px 36px 72px', fontFamily:FB, background:'#F7F5F2', minHeight:'100%' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <p style={{ margin:'0 0 6px', fontFamily:FM, fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
              {data.label} · {clinica?.nombre ?? 'Clínica'}
            </p>
            <h1 style={{ margin:0, fontFamily:FR, fontSize:'30px', fontWeight:400, color:'#161313', letterSpacing:'-0.02em', lineHeight:1.05 }}>
              Finanzas &{' '}
              <em style={{ color:'var(--color-brand,#929C92)', fontStyle:'italic' }}>Rendimiento</em>
            </h1>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            {/* Selector sede */}
            <div style={{ display:'flex', border:'1px solid rgba(22,19,19,0.1)', borderRadius:'2px', overflow:'hidden' }}>
              {SEDES.map(s => (
                <button key={s} onClick={() => cambiarSede(s)} style={{
                  padding:'7px 14px', background: s===sede?'#161313':'transparent',
                  border:'none', fontFamily:FM, fontSize:'8px', letterSpacing:'0.1em',
                  textTransform:'uppercase', color: s===sede?'#F7F5F2':'rgba(22,19,19,0.4)',
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Filtros fecha */}
            <div style={{ display:'flex', border:'1px solid rgba(22,19,19,0.1)', borderRadius:'2px', overflow:'hidden' }}>
              {['3M','6M','1A'].map(p => (
                <button key={p} onClick={() => cambiarPeriodo(p)} style={{
                  padding:'7px 14px', background: p===periodo?'#161313':'transparent',
                  border:'none', fontFamily:FM, fontSize:'8px', letterSpacing:'0.12em',
                  textTransform:'uppercase', color: p===periodo?'#F7F5F2':'rgba(22,19,19,0.4)',
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Exportar */}
            <div style={{ display:'flex', gap:'6px' }}>
              {['PDF','Excel'].map(tipo => (
                <button key={tipo} onClick={() => handleExportar(tipo)} disabled={exportando} style={{
                  padding:'7px 14px', borderRadius:'2px',
                  border:'1px solid rgba(22,19,19,0.1)',
                  background: exportando?'rgba(22,19,19,0.04)':'transparent',
                  fontFamily:FM, fontSize:'8px', letterSpacing:'0.12em',
                  textTransform:'uppercase', color:'rgba(22,19,19,0.45)', cursor: exportando?'not-allowed':'pointer',
                  display:'flex', alignItems:'center', gap:'5px',
                  transition:'all 0.15s',
                }}>
                  {exportando ? (
                    <span style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid rgba(22,19,19,0.2)', borderTopColor:'rgba(22,19,19,0.5)', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(22,19,19,0.4)" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  {exportando ? 'Generando…' : tipo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS FINANCIERAS ── */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(22,19,19,0.08)', marginBottom:'24px' }}>
          {TABS_DEF.map(t => (
            <button key={t.id} onClick={() => handleTab(t)} style={{
              padding:'10px 18px', background:'none', border:'none', cursor:'pointer',
              fontFamily:FB, fontSize:'13px', letterSpacing:'0.01em', transition:'all 0.15s',
              borderBottom: `2px solid ${tab===t.id&&!t.plan ? 'var(--color-brand,#161313)' : 'transparent'}`,
              color: tab===t.id&&!t.plan ? '#161313' : 'rgba(22,19,19,0.38)',
              fontWeight: tab===t.id&&!t.plan ? 400 : 300,
              marginBottom:'-1px',
              display:'flex', alignItems:'center', gap:'7px',
            }}>
              {t.label}
              {t.plan && (
                <span style={{
                  fontFamily:FM, fontSize:'7px', letterSpacing:'0.14em', textTransform:'uppercase',
                  color: t.plan==='premium' ? brandHex : '#C9A46A',
                  background: t.plan==='premium' ? brandHex+'18' : 'rgba(201,164,106,0.15)',
                  padding:'2px 6px', borderRadius:'2px',
                }}>
                  {t.plan === 'premium' ? 'Premium' : 'Élite'} ✦
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── CONTENIDO (spinner o datos) ── */}
        {cargando ? (
          <Spinner brandHex={brandHex} />
        ) : (
          <>
            {/* KPI CARDS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
              {data.kpi.map((k,i) => (
                <div key={i} style={{
                  background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)',
                  borderRadius:'2px', padding:'22px 20px', position:'relative', overflow:'hidden',
                }}>
                  {k.accent && <div style={{ position:'absolute',top:0,left:0,bottom:0,width:2,background:'var(--color-brand,#929C92)' }}/>}
                  <p style={{ margin:'0 0 12px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(22,19,19,0.3)' }}>
                    {k.label}
                  </p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'8px' }}>
                    <span style={{ fontFamily:FR, fontSize:'30px', fontWeight:400, color:'#161313', letterSpacing:'-0.02em', lineHeight:1 }}>{k.value}</span>
                    <span style={{ fontFamily:FB, fontSize:'14px', fontWeight:300, color:'rgba(22,19,19,0.35)' }}>{k.unit}</span>
                  </div>
                  <span style={{
                    fontFamily:FM, fontSize:'9px', letterSpacing:'0.06em',
                    color: k.up ? brandHex : '#8B3A3A',
                    background: k.up ? brandHex+'18' : 'rgba(139,58,58,0.08)',
                    padding:'3px 8px', borderRadius:'2px', display:'inline-block', marginBottom:'6px',
                  }}>
                    {k.delta}
                  </span>
                  <p style={{ margin:0, fontFamily:FB, fontSize:'10px', fontWeight:300, color:'rgba(22,19,19,0.32)' }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* GRÁFICOS */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'14px', marginBottom:'24px' }}>
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px', padding:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                  <div>
                    <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>Evolución de facturación</p>
                    <p style={{ margin:0, fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>{data.label}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <div style={{ width:18, height:2, background: brandHex, borderRadius:1 }}/>
                    <span style={{ fontFamily:FB, fontSize:'10px', fontWeight:300, color:'rgba(22,19,19,0.38)' }}>Facturación total</span>
                  </div>
                </div>
                <div style={{ height:'130px' }}>
                  <AreaChart data={data.mensual} brandHex={brandHex} />
                </div>
              </div>

              <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px', padding:'24px' }}>
                <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>Desglose · unidad de negocio</p>
                <p style={{ margin:'0 0 20px', fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>{data.label}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {UNIDADES.map((u,i) => (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' }}>
                        <span style={{ fontFamily:FB, fontSize:'11px', fontWeight:300, color:'rgba(22,19,19,0.65)', flex:1, marginRight:'8px' }}>{u.label}</span>
                        <span style={{ fontFamily:FM, fontSize:'10px', color:'rgba(22,19,19,0.45)', flexShrink:0 }}>{fmt(u.importe)} €</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, height:'3px', background:'rgba(22,19,19,0.06)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:2, width:`${u.pct}%`, background: u.brand?'var(--color-brand,#929C92)':`rgba(22,19,19,${0.14-i*0.03})` }}/>
                        </div>
                        <span style={{ fontFamily:FM, fontSize:'9px', color:'rgba(22,19,19,0.3)', flexShrink:0, width:26, textAlign:'right' }}>{u.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLA TRANSACCIONES */}
            <div style={{ background:'#FFFFFF', border:'1px solid rgba(22,19,19,0.07)', borderRadius:'2px' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(22,19,19,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ margin:'0 0 3px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>Últimas transacciones</p>
                  <p style={{ margin:0, fontFamily:FR, fontSize:'17px', fontWeight:400, color:'#161313' }}>Ingresos recientes</p>
                </div>
                <p style={{ margin:0, fontFamily:FM, fontSize:'9px', color:'rgba(22,19,19,0.3)', letterSpacing:'0.06em' }}>
                  Clic en una fila para ver el desglose ↗
                </p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 90px 110px 100px', padding:'10px 24px', background:'rgba(22,19,19,0.015)', borderBottom:'1px solid rgba(22,19,19,0.05)' }}>
                {['Paciente','Concepto','Canal','Estado','Importe'].map(h => (
                  <span key={h} style={{ fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.26)' }}>{h}</span>
                ))}
              </div>

              {TRANSACCIONES.map((t, i) => (
                <div key={i}
                  onClick={() => setTxSelec(t)}
                  style={{
                    display:'grid', gridTemplateColumns:'160px 1fr 90px 110px 100px',
                    padding:'14px 24px', alignItems:'center',
                    borderBottom: i<TRANSACCIONES.length-1?'1px solid rgba(22,19,19,0.04)':'none',
                    cursor:'pointer', transition:'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(22,19,19,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background: brandHex+'20', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FR, fontSize:'12px', color: brandHex }}>
                      {t.paciente[0]}
                    </div>
                    <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:400, color:'#161313', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.paciente}</span>
                  </div>
                  <span style={{ fontFamily:FB, fontSize:'12px', fontWeight:300, color:'rgba(22,19,19,0.55)', paddingRight:'16px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.concepto}</span>
                  <span style={{ fontFamily:FM, fontSize:'9px', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(22,19,19,0.32)' }}>{t.canal}</span>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:'5px',
                    fontFamily:FM, fontSize:'8px', letterSpacing:'0.1em', textTransform:'uppercase',
                    color: t.ok ? brandHex : '#8B3A3A',
                    background: t.ok ? brandHex+'16' : 'rgba(139,58,58,0.08)',
                    padding:'4px 9px', borderRadius:'2px', width:'fit-content',
                  }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background: t.ok?brandHex:'#8B3A3A', flexShrink:0 }}/>
                    {t.ok ? 'Completado' : 'Pendiente'}
                  </span>
                  <span style={{ fontFamily:FM, fontSize:'13px', color:'#161313', textAlign:'right' }}>{fmt(t.importe)} €</span>
                </div>
              ))}

              <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(22,19,19,0.06)', display:'flex', justifyContent:'flex-end', background:'rgba(22,19,19,0.012)' }}>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 2px', fontFamily:FM, fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(22,19,19,0.28)' }}>Total visible</p>
                  <p style={{ margin:0, fontFamily:FR, fontSize:'20px', fontWeight:400, color:'#161313' }}>{fmt(TRANSACCIONES.reduce((s,t)=>s+t.importe,0))} €</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Animaciones globales */}
        <style>{`
          @keyframes fxf { from{opacity:0} to{opacity:1} }
          @keyframes fxs { from{transform:translateX(100%)} to{transform:translateX(0)} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>

      {/* Modales y overlays */}
      {txSelec && <TxModal tx={txSelec} onClose={() => setTxSelec(null)} brandHex={brandHex} />}
      {upgradePlan && <UpgradeModal plan={upgradePlan} onClose={() => setUpgradePlan(null)} brandHex={brandHex} />}
      <Toast msg={toast} onHide={() => setToast('')} />
    </StaffLayout>
  )
}
