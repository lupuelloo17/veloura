// ══════════════════════════════════════════════════════════════════════════
//  ClubEliteCard.jsx  —  Veloura Centurion · Club VIP
//
//  Tarjeta de membresía premium estilo American Express Black/Centurion.
//  Diseño: negro puro, detalles dorados, tipografía elegante en caps.
//
//  Props:
//    clinicaNombre  — nombre de la clínica (ej. "Lumière")
//    onPagar        — callback Stripe (próximo sprint). Si no se pasa,
//                     el botón muestra un alert provisional.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

const FD = "'Fraunces', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"
const FM = "'DM Mono', monospace"

const ORO  = '#C9A46A'
const ORO2 = '#F0CE7A'
const CARD_BG = '#070504'

// ── Estrella SVG ──────────────────────────────────────────────────────────
function Star({ size = 10, color = ORO }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

// ── Diamante SVG ──────────────────────────────────────────────────────────
function Diamond({ size = 8, color = ORO }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L2 9l10 13L22 9 12 2z"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Modal Paywall
// ══════════════════════════════════════════════════════════════════════════
function CenturionModal({ onClose, clinicaNombre, onPagar }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        animation: 'vcfade 0.2s ease',
      }} />

      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '448px', zIndex: 70,
        background: CARD_BG,
        borderRadius: '20px 20px 0 0',
        animation: 'vcup 0.3s cubic-bezier(0.34,1.2,0.64,1)',
        boxShadow: '0 -16px 80px rgba(201,164,106,0.12), 0 -4px 20px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Línea dorada superior */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${ORO}, ${ORO2}, ${ORO}, transparent)` }} />

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 2px' }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(201,164,106,0.15)' }} />
        </div>

        <div style={{ padding: '12px 28px 36px' }}>

          {/* Badge top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Diamond size={7} />
            <span style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: ORO }}>
              Acceso exclusivo VIP
            </span>
          </div>

          {/* Título */}
          <h2 style={{ margin: '0 0 4px', fontFamily: FD, fontSize: '30px', fontWeight: 400, color: '#F7F5F2', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Club {clinicaNombre ?? 'Lumière'}
          </h2>
          <p style={{ margin: '0 0 22px', fontFamily: FD, fontSize: '18px', fontWeight: 400, fontStyle: 'italic', color: ORO }}>
            Centurion · VIP
          </p>

          <p style={{ margin: '0 0 22px', fontFamily: FB, fontSize: '13px', fontWeight: 300, color: 'rgba(247,245,242,0.45)', lineHeight: 1.65 }}>
            Únete a la comunidad más exclusiva de tu clínica y disfruta de privilegios que no están disponibles para el público general.
          </p>

          {/* Beneficios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
            {[
              ['Agenda prioritaria', 'Sin espera, acceso inmediato'],
              ['Eventos privados', 'Lanzamientos y veladas exclusivas'],
              ['Tratamientos en primicia', 'Antes de su lanzamiento oficial'],
              ['Asesoría personalizada', 'Consulta mensual dedicada'],
              ['Descuentos VIP', 'Hasta 20% en todos los servicios'],
            ].map(([titulo, desc], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Star size={8} color={ORO} />
                <div>
                  <p style={{ margin: '0 0 1px', fontFamily: FB, fontSize: '12px', fontWeight: 400, color: '#F7F5F2' }}>{titulo}</p>
                  <p style={{ margin: 0, fontFamily: FB, fontSize: '11px', fontWeight: 300, color: 'rgba(247,245,242,0.3)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Precio */}
          <div style={{
            padding: '14px 18px', marginBottom: 18,
            border: `1px solid rgba(201,164,106,0.2)`, borderRadius: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontFamily: FM, fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,164,106,0.4)' }}>Membresía mensual</p>
              <p style={{ margin: 0, fontFamily: FM, fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,245,242,0.2)' }}>Sin permanencia · Cancela cuando quieras</p>
            </div>
            <p style={{ margin: 0, fontFamily: FD, fontSize: '26px', fontWeight: 400, color: ORO }}>
              99 <span style={{ fontSize: '14px', fontFamily: FB, fontWeight: 300, color: 'rgba(201,164,106,0.5)' }}>€/mes</span>
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onPagar ?? (() => alert('Stripe se conectará en el próximo sprint.\nMembresía VIP activa cuando esté lista.'))}
            style={{
              width: '100%', padding: '16px',
              border: 'none', borderRadius: 2, cursor: 'pointer',
              background: `linear-gradient(135deg, #6B4F0F 0%, ${ORO} 45%, ${ORO2} 75%, ${ORO} 100%)`,
              fontFamily: FM, fontSize: '10px', fontWeight: 400,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#070504',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 4px 20px rgba(201,164,106,0.3)`,
            }}
          >
            <Diamond size={10} color="#070504" />
            Activar Membresía VIP
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vcup   { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes vcfade { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Tarjeta (estilo Centurion Black)
// ══════════════════════════════════════════════════════════════════════════
export default function ClubEliteCard({ clinicaNombre, onPagar }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${CARD_BG} 0%, #100C08 50%, #0A0705 100%)`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,164,106,0.08)',
        border: '1px solid rgba(201,164,106,0.12)',
      }}>

        {/* Hilo dorado superior */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent 5%, ${ORO} 30%, ${ORO2} 50%, ${ORO} 70%, transparent 95%)` }} />

        {/* Patrón guilloche sutil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(60deg, transparent, transparent 2px, rgba(201,164,106,0.015) 2px, rgba(201,164,106,0.015) 4px)',
        }} />

        {/* Halo dorado esquina derecha */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(201,164,106,0.12) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '20px 20px 18px', position: 'relative' }}>

          {/* Row 1: badge + chip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Diamond size={7} />
                <span style={{ fontFamily: FM, fontSize: '7px', letterSpacing: '0.22em', textTransform: 'uppercase', color: ORO }}>
                  Centurion · VIP
                </span>
              </div>
              <p style={{ margin: 0, fontFamily: FD, fontSize: '17px', fontWeight: 400, color: '#F7F5F2', letterSpacing: '-0.01em' }}>
                Club {clinicaNombre ?? 'Lumière'}
              </p>
            </div>

            {/* Chip metálico */}
            <div style={{
              width: 36, height: 28, borderRadius: 4,
              background: `linear-gradient(135deg, ${ORO}, #8B6914, ${ORO2})`,
              opacity: 0.9, flexShrink: 0,
            }} />
          </div>

          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            border: `1px solid rgba(201,164,106,0.3)`,
            borderRadius: 2,
            marginBottom: 16,
          }}>
            <Star size={7} />
            <span style={{ fontFamily: FM, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: ORO }}>
              Acceso exclusivo · Comunidad
            </span>
          </div>

          {/* Descripción corta */}
          <p style={{ margin: '0 0 18px', fontFamily: FB, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.38)', lineHeight: 1.6 }}>
            Eventos privados · Agenda VIP · Tratamientos en primicia
          </p>

          {/* Botón CTA */}
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '100%', padding: '13px',
              border: 'none', borderRadius: 2, cursor: 'pointer',
              background: `linear-gradient(135deg, #6B4F0F, ${ORO} 50%, ${ORO2})`,
              fontFamily: FM, fontSize: '9px', fontWeight: 400,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: CARD_BG,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 16px rgba(201,164,106,0.25)`,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Diamond size={8} color={CARD_BG} />
            Activar Membresía VIP
          </button>
        </div>

        {/* Hilo dorado inferior */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent 5%, rgba(201,164,106,0.25) 50%, transparent 95%)` }} />
      </div>

      {open && (
        <CenturionModal
          onClose={() => setOpen(false)}
          clinicaNombre={clinicaNombre}
          onPagar={onPagar}
        />
      )}
    </>
  )
}
