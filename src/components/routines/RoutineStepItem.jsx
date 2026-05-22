import { useState } from 'react'

export default function RoutineStepItem({ paso, index }) {
  const [expanded, setExpanded] = useState(false)

  const frecuenciaLabel = paso.frecuencia_dias === 1
    ? 'Uso diario'
    : `Cada ${paso.frecuencia_dias} días`

  return (
    <div
      className="vl-card"
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer', transition: 'var(--vl-transition)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
    >
      {/* Número de paso */}
      <div style={{
        minWidth: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'var(--vl-carbon)',
        color: 'var(--vl-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 500,
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nombre + badge frecuencia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 500,
            fontFamily: 'var(--vl-font-body)',
            color: 'var(--vl-carbon)',
            flex: 1,
          }}>
            {paso.nombre_producto}
          </span>
          <span className="vl-freq-tag">{frecuenciaLabel}</span>
        </div>

        {/* Instrucciones */}
        {paso.instrucciones && (
          <p style={{ color: 'var(--vl-carbon-soft)', fontSize: '13px', margin: '4px 0 0', lineHeight: 1.6 }}>
            {paso.instrucciones}
          </p>
        )}

        {/* Advertencias */}
        {paso.advertencias && (
          <div className="vl-warning-box" style={{ marginTop: '8px' }}>
            <i className="ti ti-alert-triangle" style={{ color: 'var(--vl-brand)', fontSize: '14px', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, color: 'var(--vl-carbon-mid)', fontSize: '12px' }}>
              {paso.advertencias}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
