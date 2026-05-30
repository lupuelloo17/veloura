// ══════════════════════════════════════════════════════════════════════════
//  BackHeader.jsx  —  Cabecera sticky con botón Atrás
//  Usar en cualquier sub-vista para que el usuario nunca quede atrapado.
//
//  Props:
//    title     string  — título de la vista actual
//    onBack    fn      — callback personalizado (default: navigate(-1))
//    right     node    — elemento opcional en el lado derecho
// ══════════════════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom'

export default function BackHeader({ title, onBack, right }) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) { onBack(); return }
    navigate(-1)
  }

  return (
    <div style={{
      position:    'sticky',
      top:         0,
      zIndex:      40,
      height:      '52px',
      background:  'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(22,19,19,0.07)',
      display:     'flex',
      alignItems:  'center',
      padding:     '0 16px',
      gap:         '12px',
      flexShrink:  0,
    }}>
      {/* Botón Atrás */}
      <button
        onClick={handleBack}
        aria-label="Volver"
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          36,
          height:         36,
          borderRadius:   2,
          border:         '1px solid rgba(22,19,19,0.1)',
          background:     'transparent',
          cursor:         'pointer',
          flexShrink:     0,
          color:          'rgba(22,19,19,0.55)',
          transition:     'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,19,19,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Título */}
      <span style={{
        flex:          1,
        fontFamily:    "'DM Sans', system-ui",
        fontSize:      '14px',
        fontWeight:    400,
        color:         '#161313',
        letterSpacing: '0.01em',
        overflow:      'hidden',
        textOverflow:  'ellipsis',
        whiteSpace:    'nowrap',
      }}>
        {title}
      </span>

      {/* Slot derecho opcional */}
      {right && (
        <div style={{ flexShrink: 0 }}>
          {right}
        </div>
      )}
    </div>
  )
}
