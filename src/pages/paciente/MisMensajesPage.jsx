import { useAuth }   from '../../contexts/AuthContext'
import { useClinic } from '../../contexts/ClinicContext'
import { useChat }   from '../../hooks/useChat'
import ChatWindow    from '../../components/chat/ChatWindow'

function SkeletonBurbuja({ esMio }) {
  return (
    <div
      style={{
        alignSelf:    esMio ? 'flex-end' : 'flex-start',
        width:        `${esMio ? 55 : 65}%`,
        height:       44,
        borderRadius: 12,
        background:   '#F0EDE8',
        marginBottom: 8,
        animation:    'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* cabecera gris */}
      <div
        style={{
          height:       68,
          background:   '#F0EDE8',
          borderBottom: '1px solid #E5E0D8',
          flexShrink:   0,
          animation:    'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* burbujas */}
      <div
        style={{
          flex:          1,
          padding:       16,
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        {[false, true, false, true, false].map((esMio, i) => (
          <SkeletonBurbuja key={i} esMio={esMio} />
        ))}
      </div>
    </div>
  )
}

export default function MisMensajesPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()

  const {
    mensajes,
    medico,
    pacienteId,
    sending,
    error,
    loading,
    enviarMensaje,
  } = useChat(user?.email, clinica?.id)

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ height: 560, borderRadius: 16, overflow: 'hidden', border: '1px solid #F0EDE8' }}>
          <Skeleton />
        </div>
      </div>
    )
  }

  if (!medico && !error) {
    return (
      <div
        style={{
          padding:        '48px 16px',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            12,
          color:          '#9CA3AF',
        }}
      >
        <span style={{ fontSize: 48 }}>👩‍⚕️</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#2D2A26', margin: 0 }}>
          Sin especialista asignado
        </p>
        <p style={{ fontSize: 14, margin: 0 }}>
          Aún no tienes un médico asignado en esta clínica.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2D2A26', margin: '0 0 4px' }}>
        Mis Mensajes
      </h1>
      <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 20px' }}>
        Consulta directa con tu especialista
      </p>

      <div
        style={{
          border:       '1px solid #F0EDE8',
          borderRadius: 16,
          height:       560,
          overflow:     'hidden',
        }}
      >
        <ChatWindow
          mensajes={mensajes}
          medico={medico}
          pacienteId={pacienteId}
          sending={sending}
          error={error}
          onSend={enviarMensaje}
        />
      </div>

      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'center' }}>
        Tus mensajes son privados y solo visibles para ti y tu especialista.
      </p>
    </div>
  )
}
