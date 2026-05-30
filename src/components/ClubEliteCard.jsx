// ══════════════════════════════════════════════════════════════════════════
//  ClubEliteCard.jsx
//  Tarjeta premium "Club Elite · Comunidad" — estilo Amex Black/Gold
//
//  Props:
//    clinicaNombre  — nombre de la clínica (ej. "Lumière")
//    onPagar        — callback cuando se conecte Stripe (próximo sprint)
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

const FD = "'Fraunces', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"
const FM = "'DM Mono', monospace"

// ── Icono de estrella pequeño ─────────────────────────────────────────────
function StarIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Modal
// ══════════════════════════════════════════════════════════════════════════
function ClubEliteModal({ onClose, clinicaNombre, onPagar }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(10,8,8,0.75)',
          backdropFilter: 'blur(8px)',
          animation: 'cefade 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '448px', zIndex: 70,
        background: 'linear-gradient(160deg, #0D0B0A 0%, #1A1512 50%, #0D0B0A 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 env(safe-area-inset-bottom, 24px)',
        animation: 'ceup 0.3s cubic-bezier(0.34,1.3,0.64,1)',
        boxShadow: '0 -12px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>

        {/* Franja dorada superior */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #8B6914, #C9A46A, #F0CE7A, #C9A46A, #8B6914)',
        }} />

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(201,164,106,0.2)' }} />
        </div>

        <div style={{ padding: '8px 28px 28px' }}>
          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <StarIcon size={10} color="#C9A46A" />
            <span style={{
              fontFamily: FM, fontSize: '9px', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#C9A46A',
            }}>
              Membresía Exclusiva
            </span>
          </div>

          {/* Título */}
          <h2 style={{
            margin: '0 0 6px',
            fontFamily: FD, fontSize: '28px', fontWeight: 400,
            color: '#F7F5F2', letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            Club Elite
            <br />
            <em style={{ color: '#C9A46A', fontStyle: 'italic' }}>{clinicaNombre ?? 'Lumière'}</em>
          </h2>

          <p style={{
            margin: '0 0 24px',
            fontFamily: FB, fontSize: '13px', fontWeight: 300,
            color: 'rgba(247,245,242,0.45)', lineHeight: 1.65,
          }}>
            Acceso exclusivo a eventos privados de tu clínica, lanzamientos de productos en primicia y prioridad VIP en agenda.
          </p>

          {/* Beneficios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {[
              'Citas prioritarias sin espera',
              'Invitaciones a eventos privados',
              'Acceso anticipado a nuevos tratamientos',
              'Asesoría personalizada mensual',
              'Descuentos exclusivos para miembros',
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <StarIcon size={9} color="#C9A46A" />
                <span style={{
                  fontFamily: FB, fontSize: '12px', fontWeight: 300,
                  color: 'rgba(247,245,242,0.6)', lineHeight: 1.5,
                }}>
                  {b}
                </span>
              </div>
            ))}
          </div>

          {/* Precio */}
          <div style={{
            padding: '14px 16px',
            border: '1px solid rgba(201,164,106,0.2)',
            borderRadius: 2,
            marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{
              fontFamily: FM, fontSize: '9px', letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(201,164,106,0.5)',
            }}>
              Membresía mensual
            </span>
            <span style={{
              fontFamily: FD, fontSize: '22px', fontWeight: 400, color: '#C9A46A',
            }}>
              99 €<span style={{ fontSize: '12px', fontFamily: FB, fontWeight: 300, color: 'rgba(201,164,106,0.5)' }}>/mes</span>
            </span>
          </div>

          {/* CTA — preparado para Stripe */}
          <button
            onClick={onPagar ?? (() => alert('Conectando con Stripe... (próximo sprint)'))}
            style={{
              width: '100%', padding: '15px',
              border: 'none', borderRadius: 2, cursor: 'pointer',
              background: 'linear-gradient(135deg, #8B6914 0%, #C9A46A 50%, #F0CE7A 100%)',
              fontFamily: FB, fontSize: '12px', fontWeight: 400,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#0D0B0A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <StarIcon size={11} color="#0D0B0A" />
            Unirme al Club Elite
          </button>

          <p style={{
            margin: '12px 0 0', textAlign: 'center',
            fontFamily: FM, fontSize: '9px', letterSpacing: '0.08em',
            color: 'rgba(247,245,242,0.2)',
          }}>
            Cancela cuando quieras · Sin permanencia
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ceup   { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes cefade { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  Tarjeta principal (estilo tarjeta de crédito premium)
// ══════════════════════════════════════════════════════════════════════════
export default function ClubEliteCard({ clinicaNombre, onPagar }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Tarjeta */}
      <button
        onClick={() => setModalOpen(true)}
        style={{
          width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
          padding: 0, background: 'transparent',
        }}
      >
        <div style={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          aspectRatio: '1.586 / 1', // proporción tarjeta crédito
          background: 'linear-gradient(135deg, #0D0B0A 0%, #1C1611 40%, #2A1F0F 70%, #1A1209 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        }}>

          {/* Textura metálica sutil */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(201,164,106,0.02) 1px, rgba(201,164,106,0.02) 2px)',
            pointerEvents: 'none',
          }} />

          {/* Franja dorada izquierda */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: 'linear-gradient(180deg, #F0CE7A, #8B6914, #F0CE7A)',
          }} />

          {/* Brillo esquina superior derecha */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,206,122,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '18px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StarIcon size={9} color="#C9A46A" />
                  <span style={{
                    fontFamily: FM, fontSize: '8px', letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: 'rgba(201,164,106,0.6)',
                  }}>
                    Membership
                  </span>
                </div>
                <p style={{
                  margin: 0, fontFamily: FD, fontSize: '15px', fontWeight: 400,
                  color: '#F7F5F2', letterSpacing: '-0.01em',
                }}>
                  Club Elite
                </p>
              </div>

              {/* Logo / chip estilizado */}
              <div style={{
                width: 34, height: 26, borderRadius: 3,
                background: 'linear-gradient(135deg, #C9A46A, #8B6914)',
                opacity: 0.85,
              }} />
            </div>

            {/* Nombre clínica */}
            <div>
              <p style={{
                margin: '0 0 3px', fontFamily: FM, fontSize: '8px',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'rgba(201,164,106,0.4)',
              }}>
                {clinicaNombre ?? 'Tu clínica'}
              </p>
              <p style={{
                margin: 0, fontFamily: FD, fontSize: '13px', fontWeight: 400,
                fontStyle: 'italic', color: '#C9A46A',
              }}>
                Comunidad exclusiva
              </p>
            </div>

            {/* Bottom row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{
                  margin: '0 0 2px', fontFamily: FM, fontSize: '7px',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(247,245,242,0.2)',
                }}>
                  Membresía desde
                </p>
                <p style={{
                  margin: 0, fontFamily: FM, fontSize: '11px',
                  color: 'rgba(247,245,242,0.5)', letterSpacing: '0.06em',
                }}>
                  2026
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px',
                border: '1px solid rgba(201,164,106,0.25)',
                borderRadius: 2,
              }}>
                <span style={{
                  fontFamily: FM, fontSize: '8px', letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(201,164,106,0.7)',
                }}>
                  Ver beneficios
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                     stroke="rgba(201,164,106,0.5)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </button>

      {/* Modal */}
      {modalOpen && (
        <ClubEliteModal
          onClose={() => setModalOpen(false)}
          clinicaNombre={clinicaNombre}
          onPagar={onPagar}
        />
      )}
    </>
  )
}
