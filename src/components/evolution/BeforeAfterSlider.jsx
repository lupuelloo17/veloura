import { useState, useRef, useEffect } from 'react'

export default function BeforeAfterSlider({
  antesUrl,
  despuesUrl,
  label = '',
  zona = '',
  fecha_antes = '',
  fecha_despues = '',
}) {
  const [pos,    setPos]    = useState(50)
  const [active, setActive] = useState(false)
  const containerRef = useRef(null)

  function calcPos(clientX) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }

  useEffect(() => {
    function onMouseMove(e) { if (active) calcPos(e.clientX) }
    function onMouseUp()    { setActive(false) }
    function onTouchMove(e) { if (active) calcPos(e.touches[0].clientX) }
    function onTouchEnd()   { setActive(false) }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend',  onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  onTouchEnd)
    }
  }, [active])

  if (!antesUrl || !despuesUrl) return null

  return (
    <div style={{ borderRadius: '16px', border: '1px solid #F0EDE8', overflow: 'hidden', background: '#FFFFFF' }}>

      {/* Header */}
      {(label || zona) && (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F0EDE8' }}>
          {label && (
            <span style={{
              background: '#FDF8F0', color: '#C9A46A', fontSize: '11px',
              fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
            }}>
              {label}
            </span>
          )}
          {zona && (
            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{zona}</span>
          )}
        </div>
      )}

      {/* Comparador */}
      <div
        ref={containerRef}
        style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', userSelect: 'none' }}
      >
        {/* Imagen después (fondo) */}
        <img
          src={despuesUrl}
          alt="Después"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />

        {/* Imagen antes (recortada) */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: `inset(0 ${100 - pos}% 0 0)`,
        }}>
          <img
            src={antesUrl}
            alt="Antes"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        </div>

        {/* Etiqueta Antes */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(0,0,0,0.5)', color: '#FFF',
          fontSize: '11px', fontWeight: '700', padding: '3px 8px',
          borderRadius: '6px', letterSpacing: '0.05em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          Antes
        </span>

        {/* Etiqueta Después */}
        <span style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(0,0,0,0.5)', color: '#FFF',
          fontSize: '11px', fontWeight: '700', padding: '3px 8px',
          borderRadius: '6px', letterSpacing: '0.05em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          Después
        </span>

        {/* Línea divisoria + handle */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pos}%`, transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ width: '2px', flex: 1, background: '#FFFFFF', opacity: 0.9 }} />
        </div>

        <div
          onMouseDown={() => setActive(true)}
          onTouchStart={() => setActive(true)}
          style={{
            position: 'absolute',
            top: '50%', left: `${pos}%`,
            transform: 'translate(-50%, -50%)',
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#C9A46A', border: '3px solid #FFFFFF',
            cursor: 'ew-resize', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="#2D2A26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Footer con fechas */}
      {(fecha_antes || fecha_despues) && (
        <div style={{
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          gap: '8px', borderTop: '1px solid #F0EDE8',
        }}>
          {fecha_antes && (
            <span style={{ fontSize: '11px', color: '#9CA3AF', flex: 1 }}>{fecha_antes}</span>
          )}
          {fecha_antes && fecha_despues && (
            <div style={{ width: '1px', height: '12px', background: '#E5E7EB' }} />
          )}
          {fecha_despues && (
            <span style={{ fontSize: '11px', color: '#9CA3AF', flex: 1, textAlign: 'right' }}>{fecha_despues}</span>
          )}
        </div>
      )}
    </div>
  )
}
