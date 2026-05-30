import { useState } from 'react'
import { useAuth }         from '../../contexts/AuthContext'
import { useClinic }       from '../../contexts/ClinicContext'
import { useEvolution }    from '../../hooks/useEvolution'
import EvolutionUploader   from '../../components/evolution/EvolutionUploader'
import BeforeAfterSlider   from '../../components/evolution/BeforeAfterSlider'

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const FASE_LABEL = {
  antes:    'Antes',
  despues:  'Después',
  progreso: 'Progreso',
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
  const safeUserId    = user?.id    && isValidUUID(user.id)    ? user.id    : null
  const safeClinicaId = clinica?.id && isValidUUID(clinica.id) ? clinica.id : null
  const { fotosPorSesion, loading, error, subirFoto } = useEvolution(safeUserId, safeClinicaId)

  const [tabActiva,    setTabActiva]    = useState('Comparador')
  const [sesionActiva, setSesionActiva] = useState(null)

  const sesiones = Object.keys(fotosPorSesion).map(Number).sort((a, b) => b - a)
  const sesionSeleccionada = sesionActiva ?? sesiones[0] ?? null
  const fotosActivas = sesionSeleccionada !== null ? (fotosPorSesion[sesionSeleccionada] ?? []) : []
  const totalFotos = Object.values(fotosPorSesion).reduce((acc, arr) => acc + arr.length, 0)

  // La columna en DB es 'tipo' — el SELECT la devuelve como f.tipo
  const fotoAntes     = fotosActivas.find(f => f.tipo === 'antes')
  const fotoDespues   = fotosActivas.find(f => f.tipo === 'despues')
  const fotosProgreso = fotosActivas.filter(f => f.tipo === 'progreso')

  const tabs = ['Comparador', 'Galería', 'Subir foto']

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minHeight: '100vh', background: 'var(--vl-page-dark)' }}>
        <div className="vl-skeleton" style={{ height: '160px' }} />
        <div className="vl-skeleton" style={{ height: '52px' }} />
        <div style={{ background: 'var(--vl-page)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="vl-skeleton" style={{ height: '220px', borderRadius: '4px' }} />
          <div className="vl-skeleton" style={{ height: '60px', borderRadius: '4px' }} />
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: 'var(--vl-carbon)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ borderLeft: '2px solid var(--vl-taupe)', paddingLeft: '14px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-taupe)', lineHeight: 1.7 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--vl-font-body)', background: 'var(--vl-page)', paddingBottom: '88px' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '32px 24px 0', overflow: 'hidden', position: 'relative' }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          width: '120px', height: '120px', borderRadius: '50%',
          border: '1px solid rgba(201,211,202,0.06)', pointerEvents: 'none',
        }} />

        {/* Eyebrow */}
        <p className="vl-eyebrow" style={{ margin: '0 0 16px' }}>Registro fotográfico</p>

        {/* Title + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <h1 style={{
            fontFamily: 'var(--vl-font-display)',
            fontSize: '40px', fontWeight: 400, lineHeight: 1.0,
            letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--vl-page)',
          }}>
            Mi Evolución<br />
            <em style={{ color: 'var(--vl-sage)', fontStyle: 'italic' }}>Fotográfica</em>
          </h1>
          {totalFotos > 0 && (
            <span className="vl-badge-dark" style={{ marginTop: '6px', flexShrink: 0 }}>
              {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'}
            </span>
          )}
        </div>

        <p style={{ margin: '0 0 28px', fontSize: '12px', fontWeight: 300, color: 'rgba(247,245,242,0.35)', letterSpacing: '0.06em' }}>
          Progreso visual de tu tratamiento
        </p>
      </div>

      {/* ── TAB SELECTOR ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-carbon)', padding: '0 24px 20px' }}>
        <div style={{
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '2px', overflow: 'hidden', display: 'flex',
        }}>
          {tabs.map((tab, i) => {
            const activa = tabActiva === tab
            return (
              <button
                key={tab}
                onClick={() => setTabActiva(tab)}
                style={{
                  flex: 1, padding: '14px 4px', border: 'none',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  background: activa ? 'rgba(201,211,202,0.08)' : 'transparent',
                  color: activa ? 'var(--vl-sage)' : 'rgba(255,255,255,0.2)',
                  fontSize: '11px', fontWeight: 300,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'var(--vl-transition)',
                  fontFamily: 'var(--vl-font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {tab}
                {activa && (
                  <span style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: 'var(--vl-sage)', opacity: 0.6, flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vl-page)' }}>

        {/* ── TAB: COMPARADOR ── */}
        {tabActiva === 'Comparador' && (
          <div style={{ padding: '24px' }}>
            {sesiones.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '56px 0', gap: '16px', textAlign: 'center',
              }}>
                <p style={{
                  margin: 0, fontFamily: 'var(--vl-font-display)',
                  fontSize: '20px', fontStyle: 'italic', color: 'var(--vl-sage-mid)',
                }}>
                  Sin fotos de evolución aún
                </p>
                <p style={{
                  margin: 0, fontSize: '12px', fontWeight: 300,
                  color: 'var(--vl-carbon-soft)', letterSpacing: '0.04em',
                }}>
                  Sube tu primera foto para comenzar a registrar tu progreso
                </p>
                <button
                  className="vl-btn-primary"
                  onClick={() => setTabActiva('Subir foto')}
                  style={{ marginTop: '8px' }}
                >
                  Subir primera foto
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Session selector */}
                {sesiones.length > 1 && (
                  <div style={{
                    display: 'flex', gap: '1px',
                    border: '1px solid var(--vl-page-border)',
                    borderRadius: '2px', overflow: 'hidden',
                  }}>
                    {sesiones.map(num => (
                      <button
                        key={num}
                        onClick={() => setSesionActiva(num)}
                        style={{
                          flex: 1, padding: '10px 8px', border: 'none',
                          background: sesionSeleccionada === num ? 'var(--vl-carbon)' : 'transparent',
                          color: sesionSeleccionada === num ? 'var(--vl-sage)' : 'var(--vl-sage-mid)',
                          fontSize: '10px', fontWeight: 300,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          cursor: 'pointer', fontFamily: 'var(--vl-font-body)',
                          transition: 'var(--vl-transition)',
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
                    antesUrl={fotoAntes.foto_url}
                    despuesUrl={fotoDespues.foto_url}
                    label={`Sesión ${sesionSeleccionada}`}
                    zona={fotoAntes.zona_corporal || fotoDespues.zona_corporal}
                    fecha_antes={formatFecha(fotoAntes.creado_en)}
                    fecha_despues={formatFecha(fotoDespues.creado_en)}
                  />
                ) : (
                  <div style={{
                    background: 'var(--vl-white)',
                    border: '1px solid var(--vl-page-border)',
                    borderRadius: '2px', padding: '20px', textAlign: 'center',
                  }}>
                    {(fotoAntes || fotoDespues) && (
                      <img
                        src={(fotoAntes || fotoDespues).foto_url}
                        alt="Evolución"
                        style={{ width: '100%', borderRadius: '2px', objectFit: 'cover', maxHeight: '260px' }}
                      />
                    )}
                    <p style={{ margin: '16px 0 0', fontSize: '12px', fontWeight: 300, color: 'var(--vl-sage-mid)', letterSpacing: '0.04em' }}>
                      {fotoAntes
                        ? 'Foto "antes" registrada. Sube una foto "después" para activar el comparador.'
                        : 'Foto "después" registrada. Sube una foto "antes" para activar el comparador.'}
                    </p>
                  </div>
                )}

                {/* Progress photos */}
                {fotosProgreso.length > 0 && (
                  <div>
                    <p className="vl-section-label" style={{ margin: '0 0 12px' }}>
                      Fotos de progreso
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {fotosProgreso.map(f => (
                        <div key={f.id} style={{ position: 'relative', borderRadius: '2px', overflow: 'hidden', aspectRatio: '1' }}>
                          <img src={f.foto_url} alt="Progreso" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <span style={{
                            position: 'absolute', bottom: '4px', left: '4px',
                            background: 'rgba(22,19,19,0.72)', color: 'var(--vl-sage)',
                            fontSize: '9px', fontWeight: 300, letterSpacing: '0.04em',
                            padding: '2px 6px',
                          }}>
                            {formatFecha(f.creado_en)}
                          </span>
                          {f.notas && (
                            <span style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: 'rgba(22,19,19,0.6)', color: 'var(--vl-sage)',
                              fontSize: '10px', padding: '1px 5px',
                            }} title={f.notas}>·</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: GALERÍA ── */}
        {tabActiva === 'Galería' && (
          <div style={{ padding: '24px' }}>
            {totalFotos === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{
                  margin: 0, fontFamily: 'var(--vl-font-display)',
                  fontSize: '18px', fontStyle: 'italic', color: 'var(--vl-sage-mid)',
                }}>
                  No hay fotos aún
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '10px' }}>
                {Object.entries(fotosPorSesion)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .flatMap(([sesNum, fotos]) =>
                    fotos.map(f => ({ ...f, sesNum: Number(sesNum) }))
                  )
                  .map(f => {
                    const faseLabel = FASE_LABEL[f.tipo] ?? 'Progreso'
                    return (
                      <div key={f.id} style={{
                        background: 'var(--vl-white)',
                        border: '1px solid var(--vl-page-border)',
                        borderRadius: '2px', overflow: 'hidden',
                      }}>
                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img src={f.foto_url} alt={f.tipo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{
                              fontSize: '9px', fontWeight: 300,
                              letterSpacing: '0.1em', textTransform: 'uppercase',
                              color: 'var(--vl-carbon)',
                            }}>
                              {faseLabel}
                            </span>
                            <span style={{ color: 'var(--vl-sage-mid)', fontSize: '9px', fontWeight: 300 }}>
                              S{f.sesNum}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 2px', color: 'var(--vl-carbon-soft)', fontSize: '10px', fontWeight: 300 }}>
                            {formatFecha(f.creado_en)}
                          </p>
                          {f.zona_corporal && (
                            <p style={{ margin: 0, color: 'var(--vl-sage-mid)', fontSize: '10px', fontWeight: 300 }}>
                              {f.zona_corporal}
                            </p>
                          )}
                          {f.notas && (
                            <p style={{
                              margin: '4px 0 0', color: 'var(--vl-carbon-soft)', fontSize: '10px', fontWeight: 300,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {f.notas}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SUBIR FOTO ── */}
        {tabActiva === 'Subir foto' && (
          <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ borderLeft: '2px solid var(--vl-page-border)', paddingLeft: '14px', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 300, color: 'var(--vl-carbon-soft)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
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
