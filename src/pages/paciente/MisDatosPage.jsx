import { useEffect, useState } from 'react'
import { User, Pencil, Save, Lock, AlertTriangle } from 'lucide-react'
import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { supabase }  from '../../lib/supabase'

const TIPOS_PIEL = ['Seca', 'Grasa', 'Mixta', 'Normal', 'Sensible']

export default function MisDatosPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()
  const brand = clinica?.color_primario ?? '#C9A46A'

  const [paciente, setPaciente] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [draft, setDraft] = useState({})

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
    setEditando(true)
  }

  async function handleGuardar() {
    if (!supabase || !paciente?.id) return
    setGuardando(true)
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(draft)
        .eq('id', paciente.id)
      if (error) throw error
      setPaciente(p => ({ ...p, ...draft }))
      setEditando(false)
    } catch (err) {
      alert('Error guardando: ' + err.message)
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
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: '40px', borderRadius: '10px',
            background: 'linear-gradient(90deg, #F0EDE8 25%, #FAF7F3 50%, #F0EDE8 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    )
  }

  // ── Sin paciente ─────────────────────────────────────────────
  if (!paciente) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        No se encontró tu perfil
      </div>
    )
  }

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #F0EDE8',
    borderRadius: '16px',
    padding: '20px',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FAFAF9' }}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#2D2A26' }}>
            Mis Datos
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9CA3AF' }}>
            Información personal y preferencias
          </p>
        </div>

        {/* Tarjeta */}
        {!editando ? (
          <div style={cardStyle}>
            {/* Header tarjeta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} style={{ color: brand }} />
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#2D2A26' }}>
                  Datos personales
                </span>
              </div>
              <button
                onClick={startEdit}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', fontWeight: '600', color: brand,
                  background: brand + '20', border: 'none', borderRadius: '8px',
                  padding: '5px 10px', cursor: 'pointer',
                }}
              >
                <Pencil size={11} /> Editar
              </button>
            </div>

            {/* Filas de datos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DataRow label="Email"              value={paciente.email} />
              <DataRow label="WhatsApp"           value={paciente.telefono} />
              <DataRow label="Ciudad"             value={paciente.ciudad} />
              <DataRow label="Fecha nacimiento"   value={paciente.fecha_nacimiento} />
              <DataRow label="Tipo de piel"       value={paciente.tipo_piel} />
              <DataRow label="Alergias"           value={paciente.alergias} multiline />
              <DataRow label="Medicamentos"       value={paciente.medicamentos} multiline />
              <DataRow label="Motivo de consulta" value={paciente.motivo_consulta} multiline />
            </div>

            {/* Acciones cuenta */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0EDE8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleCambiarPassword}
                style={{
                  width: '100%', padding: '10px', borderRadius: '12px',
                  border: '1px solid #E5E7EB', background: '#FFFFFF',
                  color: '#374151', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <Lock size={12} /> Cambiar contraseña
              </button>
              <button
                onClick={handleEliminar}
                style={{
                  width: '100%', padding: '10px', borderRadius: '12px',
                  border: '1px solid #FECACA', background: '#FFFFFF',
                  color: '#DC2626', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <AlertTriangle size={12} /> Eliminar mi cuenta
              </button>
            </div>
          </div>
        ) : (
          /* Modo edición */
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={14} style={{ color: brand }} />
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#2D2A26' }}>
                Editar mis datos
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <EditField label="WhatsApp"    value={draft.telefono}        onChange={v => setDraft({ ...draft, telefono: v })} />
              <EditField label="Ciudad"      value={draft.ciudad}          onChange={v => setDraft({ ...draft, ciudad: v })} />

              {/* Tipo de piel */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#4B5563', marginBottom: '6px' }}>
                  Tipo de piel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {TIPOS_PIEL.map(tp => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setDraft({ ...draft, tipo_piel: tp })}
                      style={{
                        padding: '8px 4px', borderRadius: '8px', fontSize: '10px',
                        fontWeight: '600', border: '1px solid', cursor: 'pointer',
                        transition: 'all 0.15s',
                        ...(draft.tipo_piel === tp
                          ? { background: brand, borderColor: brand, color: '#FFF' }
                          : { background: '#FFF', borderColor: '#E5E7EB', color: '#6B7280' }),
                      }}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              <EditField label="Alergias"           value={draft.alergias}        onChange={v => setDraft({ ...draft, alergias: v })}        multiline />
              <EditField label="Medicamentos"       value={draft.medicamentos}    onChange={v => setDraft({ ...draft, medicamentos: v })}    multiline />
              <EditField label="Motivo de consulta" value={draft.motivo_consulta} onChange={v => setDraft({ ...draft, motivo_consulta: v })} multiline />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setEditando(false)}
                disabled={guardando}
                style={{
                  padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                  border: '1px solid #E5E7EB', background: '#FFF', color: '#4B5563', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                style={{
                  padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                  border: 'none', background: brand, color: '#FFF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <Save size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DataRow({ label, value, multiline }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex',
      flexDirection: multiline ? 'column' : 'row',
      justifyContent: multiline ? undefined : 'space-between',
      gap: '2px',
      fontSize: '12px',
    }}>
      <span style={{ color: '#9CA3AF' }}>{label}</span>
      <span style={{ color: '#374151', fontWeight: '500', textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  )
}

function EditField({ label, value, onChange, multiline }) {
  const style = {
    width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB',
    borderRadius: '10px', padding: '10px 12px', fontSize: '13px',
    color: '#1F2937', outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#4B5563', marginBottom: '4px' }}>
        {label}
      </label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2}
                  style={{ ...style, resize: 'none' }} />
      ) : (
        <input value={value || ''} onChange={e => onChange(e.target.value)} style={style} />
      )}
    </div>
  )
}
