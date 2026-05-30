import { useEffect } from 'react'
import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { useChat }   from '../../hooks/useChat'
import { supabase }  from '../../lib/supabase'
import ChatWindow    from '../../components/chat/ChatWindow'

const isUUID = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? '')

export default function MisMensajesPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()

  const {
    mensajes,
    medico,
    medicoUltimaConexion,
    pacienteId,
    sending,
    error,
    loading,
    enviarMensaje,
  } = useChat(user?.email, clinica?.id)

  // ── Actualizar ultima_conexion del paciente al abrir el chat ──
  useEffect(() => {
    if (!supabase || !isUUID(user?.id)) return
    supabase
      .from('usuarios')
      .update({ ultima_conexion: new Date().toISOString() })
      .eq('id', user.id)
      .then(({ error: e }) => {
        if (e) console.warn('[Chat] No se pudo actualizar ultima_conexion:', e.message)
      })
  }, [user?.id])

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minHeight: '100vh', background: 'var(--vl-page-dark)' }}>
        <div className="vl-skeleton" style={{ height: '80px' }} />
        <div style={{ background: 'var(--vl-page)', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="vl-skeleton" style={{ height: '44px', borderRadius: '2px', width: '60%', alignSelf: 'flex-start' }} />
          <div className="vl-skeleton" style={{ height: '44px', borderRadius: '2px', width: '55%', alignSelf: 'flex-end' }} />
          <div className="vl-skeleton" style={{ height: '44px', borderRadius: '2px', width: '65%', alignSelf: 'flex-start' }} />
          <div className="vl-skeleton" style={{ height: '44px', borderRadius: '2px', width: '50%', alignSelf: 'flex-end' }} />
        </div>
        <div className="vl-skeleton" style={{ height: '68px' }} />
      </div>
    )
  }

  // ── Sin médico ───────────────────────────────────────────────
  if (!medico && !error) {
    return (
      <div style={{
        background: 'var(--vl-carbon)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            margin: '0 0 8px',
            fontFamily: 'var(--vl-font-display)',
            fontSize: '20px', fontStyle: 'italic', color: 'var(--vl-sage-mid)',
          }}>
            Sin especialista asignado
          </p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.35)', letterSpacing: '0.04em' }}>
            Aún no tienes un médico asignado en esta clínica.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: 'var(--vl-font-body)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', paddingBottom: '72px',
      overflow: 'hidden',
    }}>
      <ChatWindow
        mensajes={mensajes}
        medico={medico}
        medicoUltimaConexion={medicoUltimaConexion}
        pacienteId={pacienteId}
        sending={sending}
        error={error}
        onSend={enviarMensaje}
      />
    </div>
  )
}
