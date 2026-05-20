export default function RoutineStepItem({ paso, index }) {
  const frecuenciaLabel = paso.frecuencia_dias === 1
    ? 'Uso diario'
    : `Cada ${paso.frecuencia_dias} días`

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #F0EDE8',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      {/* Número de paso */}
      <div style={{
        minWidth: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#FDF8F0',
        color: '#C9A46A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      <div style={{ flex: 1 }}>
        {/* Nombre del producto + badge frecuencia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontWeight: '700', color: '#2D2A26', fontSize: '15px' }}>
            {paso.nombre_producto}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#C9A46A',
            border: '1px solid #C9A46A',
            borderRadius: '20px',
            padding: '1px 8px',
            fontWeight: '500',
          }}>
            {frecuenciaLabel}
          </span>
        </div>

        {/* Instrucciones */}
        {paso.instrucciones && (
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>
            {paso.instrucciones}
          </p>
        )}

        {/* Advertencias */}
        {paso.advertencias && (
          <div style={{
            marginTop: '8px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            gap: '6px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '14px' }}>⚠</span>
            <p style={{ color: '#92400E', fontSize: '12px', margin: 0 }}>
              {paso.advertencias}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
