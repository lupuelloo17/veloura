import { useState } from 'react'
import { useAuth }         from '../../contexts/AuthContext'
import { useClinic }       from '../../contexts/ClinicContext'
import { useEvolution }    from '../../hooks/useEvolution'
import EvolutionUploader   from '../../components/evolution/EvolutionUploader'
import BeforeAfterSlider   from '../../components/evolution/BeforeAfterSlider'

const FASE_BADGE = {
  antes:    { color: '#6B7280', bg: '#F3F4F6', label: 'Antes' },
  despues:  { color: '#059669', bg: '#ECFDF5', label: 'Después' },
  progreso: { color: '#C9A46A', bg: '#FDF8F0', label: 'Progreso' },
}

function formatFecha(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function MiEvolucionPage() {
  const { user }    = useAuth()
  const { clinica } = useClinic()
  const { fotosPorSesion, loading, error, subirFoto } = useEvolution(user?.id, clinica?.id)

  const [tabActiva,    setTabActiva]    = useState('Comparador')
  const [sesionActiva, setSesionActiva] = useState(null)

  const sesiones = Object.keys(fotosPorSesion).map(Number).sort((a, b) => b - a)
  const sesionSeleccionada = sesionActiva ?? sesiones[0] ?? null
  const fotosActivas = sesionSeleccionada !== null ? (fotosPorSesion[sesionSeleccionada] ?? []) : []
  const totalFotos = Object.values(fotosPorSesion).reduce((acc, arr) => acc + arr.length, 0)

  const fotoAntes   = fotosActivas.find(f => f.fase === 'antes')
  const fotoDespues = fotosActivas.find(f => f.fase === 'despues')
  const fotosProgreso = fotosActivas.filter(f => f.fase === 'progreso')

  const tabs = ['Comparador', 'Galería', 'Subir foto']

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: i === 1 ? '200px' : '60px', borderRadius: '12px',
            background: 'linear-gradient(90deg, #F0EDE8 25%, #FAF7F3 50%, #F0EDE8 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        margin: '16px', padding: '12px 16px', background: '#FEE2E2',
        border: '1px solid #FECACA', borderRadius: '10px', color: '#991B1B', fontSize: '14px',
      }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FAFAF9' }}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#2D2A26' }}>
              Mi Evolución
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
              Registro fotográfico de tu progreso con la Dra. García
            </p>
          </div>
          {totalFotos > 0 && (
            <span style={{
              background: '#FDF8F0', color: '#C9A46A', fontSize: '12px',
              fontWeight: '700', padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
            }}>
              {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#F0EDE8', borderRadius: '12px', padding: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setTabActiva(tab)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                background: tabActiva === tab ? '#2D2A26' : 'transparent',
                color:      tabActiva === tab ? '#C9A46A' : '#9CA3AF',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB: COMPARADOR ── */}
        {tabActiva === 'Comparador' && (
          <>
            {sesiones.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '48px 16px', gap: '12px', textAlign: 'center',
              }}>
                <span style={{ fontSize: '48px' }}>🌿</span>
                <p style={{ margin: 0, fontWeight: '700', color: '#2D2A26', fontSize: '16px' }}>
                  Sin fotos de evolución aún
                </p>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '13px' }}>
                  Sube tu primera foto para comenzar a registrar tu progreso
                </p>
                <button
                  onClick={() => setTabActiva('Subir foto')}
                  style={{
                    marginTop: '8px', padding: '12px 24px', borderRadius: '12px',
                    background: '#C9A46A', color: '#2D2A26', border: 'none',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  Subir primera foto
                </button>
              </div>
            ) : (
              <>
                {/* Selector de sesión */}
                {sesiones.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {sesiones.map(num => (
                      <button
                        key={num}
                        onClick={() => setSesionActiva(num)}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', border: 'none',
                          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          background: sesionSeleccionada === num ? '#2D2A26' : '#F0EDE8',
                          color:      sesionSeleccionada === num ? '#C9A46A' : '#6B7280',
                        }}
                      >
                        Sesión {num}
                      </button>
                    ))}
                  </div>
                )}

                {/* Slider antes/después */}
                {fotoAntes && fotoDespues ? (
                  <BeforeAfterSlider
                    antesUrl={fotoAntes.url}
                    despuesUrl={fotoDespues.url}
                    label={`Sesión ${sesionSeleccionada}`}
                    zona={fotoAntes.zona_corporal || fotoDespues.zona_corporal}
                    fecha_antes={formatFecha(fotoAntes.created_at)}
                    fecha_despues={formatFecha(fotoDespues.created_at)}
                  />
                ) : (
                  <div style={{
                    background: '#FFFFFF', border: '1px solid #F0EDE8',
                    borderRadius: '16px', padding: '20px', textAlign: 'center',
                  }}>
                    {(fotoAntes || fotoDespues) && (
                      <img
                        src={(fotoAntes || fotoDespues).url}
                        alt="Evolución"
                        style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '260px' }}
                      />
                    )}
                    <p style={{ margin: '12px 0 0', color: '#9CA3AF', fontSize: '13px' }}>
                      {fotoAntes
                        ? 'Foto "antes" registrada. Sube una foto "después" para activar el comparador.'
                        : 'Foto "después" registrada. Sube una foto "antes" para activar el comparador.'}
                    </p>
                  </div>
                )}

                {/* Fotos de progreso */}
                {fotosProgreso.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#2D2A26' }}>
                      Fotos de progreso
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {fotosProgreso.map(f => (
                        <div key={f.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                          <img src={f.url} alt="Progreso" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{
                            position: 'absolute', bottom: '4px', left: '4px',
                            background: 'rgba(0,0,0,0.5)', color: '#FFF',
                            fontSize: '9px', padding: '2px 6px', borderRadius: '6px',
                          }}>
                            {formatFecha(f.created_at)}
                          </span>
                          {f.notas && (
                            <span style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: 'rgba(0,0,0,0.4)', color: '#FFF',
                              fontSize: '9px', padding: '2px 5px', borderRadius: '6px',
                            }} title={f.notas}>📝</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── TAB: GALERÍA ── */}
        {tabActiva === 'Galería' && (
          <>
            {totalFotos === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: '14px' }}>
                No hay fotos aún
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                {Object.entries(fotosPorSesion)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .flatMap(([sesNum, fotos]) =>
                    fotos.map(f => ({ ...f, sesNum: Number(sesNum) }))
                  )
                  .map(f => {
                    const badge = FASE_BADGE[f.fase] ?? FASE_BADGE.progreso
                    return (
                      <div key={f.id} style={{
                        background: '#FFFFFF', border: '1px solid #F0EDE8',
                        borderRadius: '12px', overflow: 'hidden',
                      }}>
                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img src={f.url} alt={f.fase} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{
                              background: badge.bg, color: badge.color,
                              fontSize: '10px', fontWeight: '700',
                              padding: '2px 7px', borderRadius: '20px',
                            }}>
                              {badge.label}
                            </span>
                            <span style={{ color: '#9CA3AF', fontSize: '10px' }}>S{f.sesNum}</span>
                          </div>
                          <p style={{ margin: '0 0 2px', color: '#6B7280', fontSize: '11px' }}>
                            {formatFecha(f.created_at)}
                          </p>
                          {f.zona_corporal && (
                            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '10px' }}>{f.zona_corporal}</p>
                          )}
                          {f.notas && (
                            <p style={{
                              margin: '4px 0 0', color: '#6B7280', fontSize: '10px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{f.notas}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </>
        )}

        {/* ── TAB: SUBIR FOTO ── */}
        {tabActiva === 'Subir foto' && (
          <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
            <div style={{
              background: '#FDF8F0', borderLeft: '3px solid #C9A46A',
              borderRadius: '0 10px 10px 0', padding: '10px 14px', marginBottom: '16px',
            }}>
              <p style={{ margin: 0, color: '#4B4540', fontSize: '13px', lineHeight: '1.5' }}>
                Sube fotos de tu evolución para llevar un registro visual de tu tratamiento.
                Tu médico también puede añadir fotos desde su panel.
              </p>
            </div>
            <EvolutionUploader
              onUpload={subirFoto}
              sesion_numero={(sesiones[0] ?? 0) + 1}
            />
          </div>
        )}

      </div>
    </div>
  )
}
