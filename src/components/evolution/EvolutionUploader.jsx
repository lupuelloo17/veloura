import { useState, useRef, useCallback } from 'react'

const MAX_SIZE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const FASE_CONFIG = {
  antes:    { label: 'Antes',    color: '#6B7280', bg: '#F3F4F6' },
  despues:  { label: 'Después',  color: '#059669', bg: '#ECFDF5' },
  progreso: { label: 'Progreso', color: '#C9A46A', bg: '#FDF8F0' },
}

export default function EvolutionUploader({ onUpload, sesion_numero = 1, disabled = false }) {
  const [fase,      setFase]      = useState('progreso')
  const [zona,      setZona]      = useState('')
  const [notas,     setNotas]     = useState('')
  const [preview,   setPreview]   = useState(null)
  const [archivo,   setArchivo]   = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [errorMsg,  setErrorMsg]  = useState('')

  const inputRef = useRef(null)

  function validarArchivo(file) {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WebP.'
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `El archivo supera los ${MAX_SIZE_MB} MB.`
    return null
  }

  const procesarArchivo = useCallback((file) => {
    if (!file) return
    const err = validarArchivo(file)
    if (err) { setErrorMsg(err); return }
    setErrorMsg('')
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }, [])

  function limpiarPreview() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setArchivo(null)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) procesarArchivo(file)
  }

  async function handleSubmit() {
    if (!archivo || uploading) return
    setUploading(true)
    setErrorMsg('')
    try {
      await onUpload({ archivo, fase, zona_corporal: zona, notas, sesion_numero })
      limpiarPreview()
      setZona('')
      setNotas('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir la foto.')
    } finally {
      setUploading(false)
    }
  }

  const faseCfg = FASE_CONFIG[fase]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Selector de fase */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {Object.entries(FASE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFase(key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '10px', fontSize: '12px',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${fase === key ? cfg.color : '#E5E7EB'}`,
              background: fase === key ? cfg.bg : '#FFFFFF',
              color: fase === key ? cfg.color : '#9CA3AF',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Zona de imagen */}
      {!preview ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? '#C9A46A' : '#E5E7EB'}`,
            borderRadius: '12px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: dragging ? '#FDF8F0' : '#FAFAF9',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
          <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#2D2A26', fontSize: '14px' }}>
            Arrastra una foto o haz clic
          </p>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: '12px' }}>
            JPG, PNG, WebP · Máx. 10MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            style={{ display: 'none' }}
            disabled={disabled}
            onChange={e => procesarArchivo(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3' }}>
          <img
            src={preview}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick={limpiarPreview}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', color: '#FFF',
              border: 'none', cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          <span style={{
            position: 'absolute', bottom: '8px', left: '8px',
            background: faseCfg.bg, color: faseCfg.color,
            fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
          }}>
            {faseCfg.label}
          </span>
        </div>
      )}

      {/* Zona corporal */}
      <input
        value={zona}
        onChange={e => setZona(e.target.value)}
        placeholder="Zona corporal (ej: mejilla izquierda, frente...)"
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '10px',
          border: '1px solid #E5E7EB', background: '#F9FAFB',
          fontSize: '13px', color: '#1F2937', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Notas */}
      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        rows={3}
        placeholder="Notas opcionales sobre esta foto..."
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '10px',
          border: '1px solid #E5E7EB', background: '#F9FAFB',
          fontSize: '13px', color: '#1F2937', outline: 'none',
          resize: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Error */}
      {errorMsg && (
        <p style={{
          margin: 0, padding: '10px 12px', borderRadius: '10px',
          background: '#FEF2F2', color: '#DC2626', fontSize: '13px',
        }}>
          {errorMsg}
        </p>
      )}

      {/* Éxito */}
      {success && (
        <p style={{
          margin: 0, padding: '10px 12px', borderRadius: '10px',
          background: '#ECFDF5', color: '#059669', fontSize: '13px', fontWeight: '600',
        }}>
          ✓ Foto subida correctamente
        </p>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleSubmit}
        disabled={!archivo || uploading || disabled}
        style={{
          width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
          background: !archivo || uploading || disabled ? '#E5E7EB' : '#C9A46A',
          color: !archivo || uploading || disabled ? '#9CA3AF' : '#2D2A26',
          fontSize: '14px', fontWeight: '700', cursor: !archivo || uploading || disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.15s',
        }}
      >
        {uploading && (
          <span style={{
            width: '14px', height: '14px', border: '2px solid #2D2A26',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', display: 'inline-block',
          }} />
        )}
        {uploading ? 'Subiendo…' : 'Guardar foto de evolución'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
