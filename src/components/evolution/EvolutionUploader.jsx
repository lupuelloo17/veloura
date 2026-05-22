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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Selector de fase */}
      <div>
        <p style={{
          margin: '0 0 8px',
          fontSize: '10px', fontWeight: 300,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--vl-sage-mid)',
        }}>
          Tipo de foto
        </p>
        <div style={{
          display: 'flex', gap: '1px',
          border: '1px solid var(--vl-page-border)',
          borderRadius: '2px', overflow: 'hidden',
        }}>
          {Object.entries(FASE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFase(key)}
              style={{
                flex: 1, padding: '10px 4px',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--vl-font-body)',
                fontSize: '10px', fontWeight: 300,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'var(--vl-transition)',
                background: fase === key ? 'var(--vl-carbon)' : 'transparent',
                color: fase === key ? 'var(--vl-sage)' : 'var(--vl-sage-mid)',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zona de imagen */}
      {!preview ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `1px solid ${dragging ? 'var(--vl-sage-mid)' : 'var(--vl-page-border)'}`,
            borderRadius: '2px',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: dragging ? 'var(--vl-page-dark)' : 'var(--vl-white)',
            transition: 'var(--vl-transition)',
          }}
        >
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--vl-font-body)', fontSize: '13px', fontWeight: 300, color: 'var(--vl-carbon)', letterSpacing: '0.04em' }}>
            Arrastra una foto o haz clic
          </p>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 300, color: 'var(--vl-sage-mid)', letterSpacing: '0.06em' }}>
            JPG, PNG, WebP · Máx. 10 MB
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
        <div style={{ position: 'relative', borderRadius: '2px', overflow: 'hidden', aspectRatio: '4/3' }}>
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
              background: 'rgba(22,19,19,0.72)', color: 'var(--vl-page)',
              border: 'none', cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          <span style={{
            position: 'absolute', bottom: '8px', left: '8px',
            background: 'rgba(22,19,19,0.72)', color: 'var(--vl-sage)',
            fontSize: '9px', fontWeight: 300, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '3px 8px',
          }}>
            {FASE_CONFIG[fase].label}
          </span>
        </div>
      )}

      {/* Zona corporal */}
      <div>
        <p style={{
          margin: '0 0 6px',
          fontSize: '10px', fontWeight: 300,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--vl-sage-mid)',
        }}>
          Zona corporal
        </p>
        <input
          className="vl-input"
          value={zona}
          onChange={e => setZona(e.target.value)}
          placeholder="ej: mejilla izquierda, frente..."
        />
      </div>

      {/* Notas */}
      <div>
        <p style={{
          margin: '0 0 6px',
          fontSize: '10px', fontWeight: 300,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--vl-sage-mid)',
        }}>
          Notas <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(opcional)</span>
        </p>
        <textarea
          className="vl-input"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones sobre esta foto..."
          style={{ resize: 'none' }}
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{ borderLeft: '2px solid var(--vl-taupe)', paddingLeft: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-taupe)', lineHeight: 1.6 }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* Éxito */}
      {success && (
        <div style={{ borderLeft: '2px solid var(--vl-sage-mid)', paddingLeft: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-sage-mid)', letterSpacing: '0.04em' }}>
            Foto subida correctamente
          </p>
        </div>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleSubmit}
        disabled={!archivo || uploading || disabled}
        className={!archivo || uploading || disabled ? 'vl-btn-secondary' : 'vl-btn-primary'}
        style={{
          width: '100%',
          opacity: !archivo || uploading || disabled ? 0.45 : 1,
          cursor: !archivo || uploading || disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {uploading && (
          <span style={{
            width: '12px', height: '12px',
            border: '1.5px solid currentColor',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', display: 'inline-block',
          }} />
        )}
        {uploading ? 'Subiendo…' : 'Guardar foto'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
