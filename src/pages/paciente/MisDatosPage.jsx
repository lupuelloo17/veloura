import { useEffect, useState } from 'react'
import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase }  from '../../lib/supabase'

const TIPOS_PIEL = ['Seca', 'Grasa', 'Mixta', 'Normal', 'Sensible']

export default function MisDatosPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()

  const [paciente,  setPaciente]  = useState(null)
  const [cargando,  setCargando]  = useState(true)
  const [editando,  setEditando]  = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [draft,     setDraft]     = useState({})
  const [msgOk,     setMsgOk]     = useState('')
  const [msgErr,    setMsgErr]    = useState('')

  useEffect(() => {
    if (!user?.id) { setCargando(false); return }
    supabase
      .from('pacientes')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPaciente(data)
        setCargando(false)
      })
  }, [user?.id])

  function startEdit() {
    setDraft({
      telefono:        paciente?.telefono        ?? '',
      ciudad:          paciente?.ciudad          ?? '',
      tipo_piel:       paciente?.tipo_piel       ?? '',
      alergias:        paciente?.alergias        ?? '',
      medicamentos:    paciente?.medicamentos    ?? '',
      motivo_consulta: paciente?.motivo_consulta ?? '',
    })
    setMsgOk('')
    setMsgErr('')
    setEditando(true)
  }

  async function handleGuardar() {
    if (!supabase || !paciente?.id) return
    setGuardando(true)
    setMsgErr('')
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(draft)
        .eq('id', paciente.id)
      if (error) throw error
      setPaciente(p => ({ ...p, ...draft }))
      setEditando(false)
      setMsgOk('Datos actualizados correctamente')
      setTimeout(() => setMsgOk(''), 4000)
    } catch (err) {
      setMsgErr('Error guardando: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  function handleCambiarPassword() {
    const nueva = prompt('Nueva contraseña (mínimo 8 caracteres):')
    if (!nueva) return
    if (nueva.length < 8) return alert('La contraseña debe tener al menos 8 caracteres.')
    if (!supabase) return alert('Modo demo: no se puede cambiar la contraseña.')
    supabase.auth.updateUser({ password: nueva })
      .then(({ error }) => alert(error ? 'Error: ' + error.message : 'Contraseña actualizada.'))
  }

  function handleEliminar() {
    if (!confirm('¿Eliminar tu cuenta permanentemente? Esto borrará tu historial completo. No se puede deshacer.')) return
    if (!confirm('Confirma una vez más: ¿eliminar cuenta y todos los datos asociados (RGPD)?')) return
    alert('La eliminación de cuentas debe gestionarla tu clínica para cumplir con auditoría RGPD. Contacta con ellos.')
  }

  // ── Loading ──────────────────────────────────────────────────
  if (cargando) {
    return (
      <div style={{ background: 'var(--vl-page)', minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="vl-skeleton" style={{ height: '14px', width: '100px', borderRadius: '2px' }} />
        <div className="vl-skeleton" style={{ height: '40px', width: '160px', borderRadius: '2px' }} />
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="vl-skeleton" style={{ height: '10px', width: '80px', borderRadius: '2px' }} />
              <div className="vl-skeleton" style={{ height: '44px', borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Sin paciente ─────────────────────────────────────────────
  if (!paciente) {
    return (
      <div style={{
        background: 'var(--vl-page)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <p style={{
          margin: 0,
          fontFamily: 'var(--vl-font-display)',
          fontSize: '18px', fontStyle: 'italic', fontWeight: 300,
          color: 'var(--vl-sage-mid)',
        }}>
          No se encontró tu perfil
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background:    'var(--vl-page)',
      minHeight:     '100vh',
      paddingBottom: '80px',
      fontFamily:    'var(--vl-font-body)',
    }}>

      {/* ── Encabezado ───────────────────────────────────────── */}
      <div style={{ padding: '32px 24px 0' }}>
        <p className="vl-eyebrow" style={{ margin: '0 0 12px' }}>
          Mi cuenta
        </p>
        <h1 style={{
          margin:        0,
          fontFamily:    'var(--vl-font-display)',
          fontSize:      '36px',
          fontWeight:    400,
          lineHeight:    1.05,
          letterSpacing: '-0.02em',
          color:         'var(--vl-carbon)',
        }}>
          Mis datos<br />
          <em style={{ color: 'var(--vl-sage-mid)', fontStyle: 'italic' }}>personales</em>
        </h1>
      </div>

      {/* ── Feedback ─────────────────────────────────────────── */}
      {msgOk && (
        <div style={{ margin: '16px 24px 0', borderLeft: '2px solid var(--vl-sage-mid)', paddingLeft: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-sage-mid)', letterSpacing: '0.04em' }}>
            {msgOk}
          </p>
        </div>
      )}
      {msgErr && (
        <div style={{ margin: '16px 24px 0', borderLeft: '2px solid var(--vl-taupe)', paddingLeft: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-taupe)', lineHeight: 1.6 }}>
            {msgErr}
          </p>
        </div>
      )}

      {/* ── Contenido ────────────────────────────────────────── */}
      <div style={{ padding: '28px 24px 0', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {!editando ? (
          /* ── Vista lectura ──── */
          <>
            {/* Email — solo lectura */}
            <DatoFila label="Email" value={paciente.email} />
            <DatoFila label="WhatsApp" value={paciente.telefono} />
            <DatoFila label="Ciudad" value={paciente.ciudad} />
            <DatoFila label="Fecha de nacimiento" value={paciente.fecha_nacimiento} />
            <DatoFila label="Tipo de piel" value={paciente.tipo_piel} />
            <DatoFila label="Alergias" value={paciente.alergias} multiline />
            <DatoFila label="Medicamentos" value={paciente.medicamentos} multiline />
            <DatoFila label="Motivo de consulta" value={paciente.motivo_consulta} multiline />

            {/* Botón editar */}
            <div style={{ marginTop: '28px' }}>
              <button onClick={startEdit} className="vl-btn-primary" style={{ width: '100%' }}>
                Editar datos
              </button>
            </div>

            {/* Acciones de cuenta */}
            <div style={{
              marginTop:  '32px',
              paddingTop: '24px',
              borderTop:  '1px solid var(--vl-page-border)',
              display:    'flex',
              flexDirection: 'column',
              gap:        '12px',
            }}>
              <p className="vl-eyebrow" style={{ margin: '0 0 4px' }}>Seguridad</p>
              <button
                onClick={handleCambiarPassword}
                className="vl-btn-secondary"
                style={{ width: '100%' }}
              >
                Cambiar contraseña
              </button>

              <div style={{
                marginTop:  '8px',
                paddingTop: '20px',
                borderTop:  '1px solid var(--vl-page-border)',
              }}>
                <p className="vl-eyebrow" style={{ margin: '0 0 8px', color: 'var(--vl-taupe)' }}>
                  Zona de riesgo
                </p>
                <button
                  onClick={handleEliminar}
                  style={{
                    width:         '100%',
                    padding:       '10px 0',
                    background:    'transparent',
                    border:        '1px solid var(--vl-taupe)',
                    borderRadius:  '2px',
                    cursor:        'pointer',
                    fontFamily:    'var(--vl-font-body)',
                    fontSize:      '11px',
                    fontWeight:    300,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:         'var(--vl-taupe)',
                    transition:    'var(--vl-transition)',
                  }}
                >
                  Eliminar mi cuenta
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Modo edición ──── */
          <>
            <p className="vl-eyebrow" style={{ margin: '0 0 20px' }}>Editando datos</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <CampoEdit
                label="WhatsApp"
                value={draft.telefono}
                onChange={v => setDraft({ ...draft, telefono: v })}
                placeholder="ej: +34 612 345 678"
              />

              <CampoEdit
                label="Ciudad"
                value={draft.ciudad}
                onChange={v => setDraft({ ...draft, ciudad: v })}
                placeholder="ej: Madrid"
              />

              {/* Tipo de piel */}
              <div>
                <p style={{
                  margin:        '0 0 8px',
                  fontSize:      '10px',
                  fontWeight:    300,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         'var(--vl-sage-mid)',
                }}>
                  Tipo de piel
                </p>
                <div style={{
                  display:      'flex',
                  border:       '1px solid var(--vl-page-border)',
                  borderRadius: '2px',
                  overflow:     'hidden',
                }}>
                  {TIPOS_PIEL.map((tp, i) => {
                    const activo = draft.tipo_piel === tp
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setDraft({ ...draft, tipo_piel: tp })}
                        style={{
                          flex:          1,
                          padding:       '10px 4px',
                          border:        'none',
                          borderLeft:    i > 0 ? '1px solid var(--vl-page-border)' : 'none',
                          cursor:        'pointer',
                          fontFamily:    'var(--vl-font-body)',
                          fontSize:      '9px',
                          fontWeight:    300,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          transition:    'var(--vl-transition)',
                          background:    activo ? 'var(--vl-carbon)' : 'transparent',
                          color:         activo ? 'var(--vl-sage)' : 'var(--vl-sage-mid)',
                        }}
                      >
                        {tp}
                      </button>
                    )
                  })}
                </div>
              </div>

              <CampoEdit
                label="Alergias"
                value={draft.alergias}
                onChange={v => setDraft({ ...draft, alergias: v })}
                placeholder="Describe tus alergias conocidas..."
                multiline
              />

              <CampoEdit
                label="Medicamentos"
                value={draft.medicamentos}
                onChange={v => setDraft({ ...draft, medicamentos: v })}
                placeholder="Medicamentos actuales..."
                multiline
              />

              <CampoEdit
                label="Motivo de consulta"
                value={draft.motivo_consulta}
                onChange={v => setDraft({ ...draft, motivo_consulta: v })}
                placeholder="¿Por qué acudes a la clínica?"
                multiline
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '28px' }}>
              <button
                onClick={() => { setEditando(false); setMsgErr('') }}
                disabled={guardando}
                className="vl-btn-secondary"
                style={{ opacity: guardando ? 0.45 : 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="vl-btn-primary"
                style={{
                  opacity: guardando ? 0.65 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {guardando && (
                  <span style={{
                    width: '11px', height: '11px',
                    border: '1.5px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                )}
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function DatoFila({ label, value, multiline }) {
  return (
    <div style={{
      padding:       '14px 0',
      borderBottom:  '1px solid var(--vl-page-border)',
      display:       'flex',
      flexDirection: multiline ? 'column' : 'row',
      alignItems:    multiline ? 'flex-start' : 'baseline',
      justifyContent: multiline ? undefined : 'space-between',
      gap:           multiline ? '4px' : '12px',
    }}>
      <span style={{
        fontFamily:    'var(--vl-font-body)',
        fontSize:      '10px',
        fontWeight:    300,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         'var(--vl-sage-mid)',
        flexShrink:    0,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily:  'var(--vl-font-body)',
        fontSize:    '13px',
        fontWeight:  300,
        color:       value ? 'var(--vl-carbon)' : 'rgba(22,19,19,0.25)',
        letterSpacing: '0.01em',
        lineHeight:  1.5,
        textAlign:   multiline ? 'left' : 'right',
      }}>
        {value || '—'}
      </span>
    </div>
  )
}

function CampoEdit({ label, value, onChange, placeholder, multiline }) {
  return (
    <div>
      <p style={{
        margin:        '0 0 6px',
        fontSize:      '10px',
        fontWeight:    300,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color:         'var(--vl-sage-mid)',
      }}>
        {label}
      </p>
      {multiline ? (
        <textarea
          className="vl-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ resize: 'none' }}
        />
      ) : (
        <input
          className="vl-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}
