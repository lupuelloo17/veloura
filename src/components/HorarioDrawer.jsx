import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

/* ─── UUID guard ─────────────────────────────────────────────────────────── */
const isValidUUID = id =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')

/* ─── Days of week (0 = lunes … 6 = domingo) ────────────────────────────── */
const DIAS = [
  { key: 0, label: 'Lunes',     short: 'LUN' },
  { key: 1, label: 'Martes',    short: 'MAR' },
  { key: 2, label: 'Miércoles', short: 'MIÉ' },
  { key: 3, label: 'Jueves',    short: 'JUE' },
  { key: 4, label: 'Viernes',   short: 'VIE' },
  { key: 5, label: 'Sábado',    short: 'SÁB' },
  { key: 6, label: 'Domingo',   short: 'DOM' },
]

/* ─── Break-time options (minutes) ──────────────────────────────────────── */
const DESCANSO_OPTS = [0, 15, 30, 45, 60, 90, 120]

/* ─── Time options 06:00–22:00 in 15-min steps ──────────────────────────── */
function genHoras() {
  const horas = []
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break
      horas.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      )
    }
  }
  return horas
}
const HORAS = genHoras()

/* ─── Default day schedule ───────────────────────────────────────────────── */
const DEFAULT_DIA = {
  activo: false,
  hora_inicio: '09:00',
  hora_fin: '18:00',
  tiempo_descanso: 60,
}

/* ─── Mock schedule (lunes–viernes full, sábado half, domingo off) ───────── */
const MOCK_HORARIOS = {
  0: { activo: true,  hora_inicio: '09:00', hora_fin: '18:00', tiempo_descanso: 60 },
  1: { activo: true,  hora_inicio: '09:00', hora_fin: '18:00', tiempo_descanso: 60 },
  2: { activo: true,  hora_inicio: '09:00', hora_fin: '18:00', tiempo_descanso: 60 },
  3: { activo: true,  hora_inicio: '09:00', hora_fin: '18:00', tiempo_descanso: 60 },
  4: { activo: true,  hora_inicio: '09:00', hora_fin: '14:00', tiempo_descanso: 0  },
  5: { activo: false, hora_inicio: '10:00', hora_fin: '14:00', tiempo_descanso: 0  },
  6: { activo: false, hora_inicio: '10:00', hora_fin: '14:00', tiempo_descanso: 0  },
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeToMinutes(t = '00:00') {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function calcHorasTrabajadas(dia) {
  if (!dia.activo) return 0
  const mins =
    timeToMinutes(dia.hora_fin) -
    timeToMinutes(dia.hora_inicio) -
    (dia.tiempo_descanso ?? 0)
  return Math.max(0, mins / 60)
}

function formatHoras(h) {
  if (h === 0) return '0 h'
  const entero = Math.floor(h)
  const min    = Math.round((h - entero) * 60)
  return min > 0 ? `${entero}h ${min}m` : `${entero}h`
}

function buildEmptySchedule() {
  return Object.fromEntries(DIAS.map(d => [d.key, { ...DEFAULT_DIA }]))
}

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

/* ─── Subcomponents ──────────────────────────────────────────────────────── */
function Select({ value, options, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '7px 10px',
        borderRadius: 8,
        border: '1px solid rgba(22,19,19,0.14)',
        background: disabled ? 'rgba(22,19,19,0.04)' : '#fff',
        fontFamily: 'DM Mono, monospace',
        fontSize: 13,
        color: disabled ? '#929C92' : '#161313',
        cursor: disabled ? 'default' : 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: disabled ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23929C92' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: disabled ? 10 : 28,
        minWidth: 90,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? '#161313' : 'rgba(22,19,19,0.14)',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background 0.18s',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.18s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  )
}

function DayRow({ dia, schedule, onChange }) {
  const entry = schedule[dia.key] ?? DEFAULT_DIA

  const horasHoy = calcHorasTrabajadas(entry)

  const horaInicioOpts = HORAS.map(h => ({ value: h, label: h }))
  const horaFinOpts    = HORAS.filter(h => h > entry.hora_inicio).map(h => ({ value: h, label: h }))
  const descansoOpts   = DESCANSO_OPTS.map(m => ({
    value: m,
    label: m === 0 ? 'Sin descanso' : m < 60 ? `${m} min` : `${m / 60}h`,
  }))

  function update(key, val) {
    onChange(dia.key, { ...entry, [key]: val })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid rgba(22,19,19,0.06)',
        opacity: entry.activo ? 1 : 0.55,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Toggle */}
      <Toggle
        checked={entry.activo}
        onChange={val => update('activo', val)}
      />

      {/* Day label */}
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 11,
          fontWeight: 600,
          color: entry.activo ? '#161313' : '#929C92',
          letterSpacing: '0.06em',
          width: 30,
          flexShrink: 0,
          textTransform: 'uppercase',
          transition: 'color 0.15s',
        }}
      >
        {dia.short}
      </span>

      {/* Time selects */}
      <Select
        value={entry.hora_inicio}
        options={horaInicioOpts}
        onChange={val => {
          const newEntry = { ...entry, hora_inicio: val }
          // ensure hora_fin > hora_inicio
          if (val >= entry.hora_fin) {
            const idx = HORAS.indexOf(val)
            newEntry.hora_fin = HORAS[Math.min(idx + 4, HORAS.length - 1)]
          }
          onChange(dia.key, newEntry)
        }}
        disabled={!entry.activo}
      />

      <span style={{ fontSize: 12, color: '#929C92', flexShrink: 0 }}>—</span>

      <Select
        value={entry.hora_fin}
        options={horaFinOpts.length ? horaFinOpts : [{ value: entry.hora_fin, label: entry.hora_fin }]}
        onChange={val => update('hora_fin', val)}
        disabled={!entry.activo}
      />

      {/* Break */}
      <Select
        value={entry.tiempo_descanso}
        options={descansoOpts}
        onChange={val => update('tiempo_descanso', Number(val))}
        disabled={!entry.activo}
      />

      {/* Hours summary */}
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 11,
          color: entry.activo ? '#3d6b4f' : '#929C92',
          marginLeft: 'auto',
          flexShrink: 0,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {entry.activo ? formatHoras(horasHoy) : '—'}
      </span>
    </div>
  )
}

/* ─── Main Drawer ────────────────────────────────────────────────────────── */
export default function HorarioDrawer({ empleado, clinicaId, onClose }) {
  const isMock = !isValidUUID(empleado?.id) || !isValidUUID(clinicaId)

  const [schedule, setSchedule] = useState(buildEmptySchedule)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [saveErr,  setSaveErr]  = useState(null)

  /* ── Load horarios ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!empleado?.id) return

    async function load() {
      setLoading(true)

      if (isMock) {
        await new Promise(r => setTimeout(r, 300))
        setSchedule({ ...MOCK_HORARIOS })
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('horarios_empleados')
        .select('dia_semana, hora_inicio, hora_fin, tiempo_descanso, activo')
        .eq('empleado_id', empleado.id)
        .eq('clinica_id', clinicaId)

      if (error) {
        console.error('[HorarioDrawer] load error:', error)
        // fall back to empty schedule
        setSchedule(buildEmptySchedule())
      } else {
        const base = buildEmptySchedule()
        ;(data ?? []).forEach(row => {
          base[row.dia_semana] = {
            activo:           row.activo,
            hora_inicio:      row.hora_inicio.slice(0, 5),
            hora_fin:         row.hora_fin.slice(0, 5),
            tiempo_descanso:  row.tiempo_descanso,
          }
        })
        setSchedule(base)
      }

      setLoading(false)
    }

    load()
  }, [empleado?.id, clinicaId, isMock])

  /* ── Update a day ────────────────────────────────────────────────────── */
  const handleChange = useCallback((dayKey, newEntry) => {
    setSchedule(prev => ({ ...prev, [dayKey]: newEntry }))
    setSaved(false)
    setSaveErr(null)
  }, [])

  /* ── Save ────────────────────────────────────────────────────────────── */
  async function handleSave() {
    setSaving(true)
    setSaveErr(null)

    if (isMock) {
      await new Promise(r => setTimeout(r, 500))
      setSaved(true)
      setSaving(false)
      return
    }

    const rows = DIAS.map(d => ({
      empleado_id:     empleado.id,
      clinica_id:      clinicaId,
      dia_semana:      d.key,
      hora_inicio:     schedule[d.key]?.hora_inicio ?? DEFAULT_DIA.hora_inicio,
      hora_fin:        schedule[d.key]?.hora_fin    ?? DEFAULT_DIA.hora_fin,
      tiempo_descanso: schedule[d.key]?.tiempo_descanso ?? DEFAULT_DIA.tiempo_descanso,
      activo:          schedule[d.key]?.activo ?? false,
    }))

    const { error } = await supabase
      .from('horarios_empleados')
      .upsert(rows, { onConflict: 'empleado_id,dia_semana' })

    if (error) {
      console.error('[HorarioDrawer] save error:', error)
      setSaveErr('No se pudo guardar. Por favor, intenta de nuevo.')
    } else {
      setSaved(true)
    }

    setSaving(false)
  }

  /* ── Weekly totals ───────────────────────────────────────────────────── */
  const diasActivos  = DIAS.filter(d => schedule[d.key]?.activo).length
  const totalHoras   = DIAS.reduce((acc, d) => acc + calcHorasTrabajadas(schedule[d.key] ?? DEFAULT_DIA), 0)

  /* ── Kbd close ───────────────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(22,19,19,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 400,
        }}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          maxWidth: '100vw',
          background: '#FAFAF8',
          boxShadow: '-4px 0 32px rgba(22,19,19,0.14)',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid rgba(22,19,19,0.08)',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: empleado?.foto ? 'transparent' : '#A39384',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {empleado?.foto ? (
              <img
                src={empleado.foto}
                alt={empleado.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(empleado?.nombre ?? '')
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 17,
                fontWeight: 700,
                color: '#161313',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {empleado?.nombre}
            </div>
            <div style={{ fontSize: 12, color: '#929C92', marginTop: 2 }}>
              Horario semanal
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid rgba(22,19,19,0.10)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 16, color: '#929C92' }} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: 12,
                color: '#929C92',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: '2.5px solid rgba(22,19,19,0.12)',
                  borderTopColor: '#161313',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              <span style={{ fontSize: 13 }}>Cargando horarios…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Column labels */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 4,
                  paddingLeft: 50,
                }}
              >
                {['Inicio', 'Fin', 'Descanso'].map((l, i) => (
                  <span
                    key={l}
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: 10,
                      color: '#929C92',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      flex: i < 2 ? '0 0 90px' : '0 0 110px',
                      marginLeft: i === 0 ? 30 : 0,
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>

              {/* Day rows */}
              {DIAS.map(dia => (
                <DayRow
                  key={dia.key}
                  dia={dia}
                  schedule={schedule}
                  onChange={handleChange}
                />
              ))}

              {/* Weekly summary */}
              <div
                style={{
                  marginTop: 20,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid rgba(22,19,19,0.08)',
                  display: 'flex',
                  gap: 0,
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#161313',
                      lineHeight: 1,
                    }}
                  >
                    {diasActivos}
                  </div>
                  <div style={{ fontSize: 11, color: '#929C92', marginTop: 4 }}>
                    días activos
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    background: 'rgba(22,19,19,0.08)',
                    margin: '0 4px',
                  }}
                />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#161313',
                      lineHeight: 1,
                    }}
                  >
                    {formatHoras(totalHoras)}
                  </div>
                  <div style={{ fontSize: 11, color: '#929C92', marginTop: 4 }}>
                    horas / semana
                  </div>
                </div>
              </div>

              {/* Demo note */}
              {isMock && (
                <p
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: '#A39384',
                    textAlign: 'center',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Modo demo — los cambios no se guardan en base de datos.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Footer / Save ───────────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(22,19,19,0.08)',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {saveErr && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(220,53,69,0.06)',
                border: '1px solid rgba(220,53,69,0.18)',
                color: '#b91c1c',
                fontSize: 13,
              }}
            >
              <i className="ti ti-alert-circle" style={{ fontSize: 15 }} />
              {saveErr}
            </div>
          )}

          {saved && !saveErr && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(61,107,79,0.08)',
                border: '1px solid rgba(61,107,79,0.18)',
                color: '#3d6b4f',
                fontSize: 13,
              }}
            >
              <i className="ti ti-circle-check" style={{ fontSize: 15 }} />
              Horario guardado correctamente.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 10,
                border: '1px solid rgba(22,19,19,0.14)',
                background: 'transparent',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: '#929C92',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                flex: 2,
                padding: '11px 0',
                borderRadius: 10,
                border: 'none',
                background: saving ? 'rgba(22,19,19,0.5)' : '#161313',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#F7F5F2',
                cursor: saving || loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.18s',
              }}
            >
              {saving ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  Guardando…
                </>
              ) : (
                <>
                  <i className="ti ti-device-floppy" style={{ fontSize: 15 }} />
                  Guardar horario
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
