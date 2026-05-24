import { useState, useEffect, useRef } from 'react'
import { Navigate, Link, useParams } from 'react-router-dom'
import StaffLayout from './StaffLayout'
import { useClinic } from '../../contexts/ClinicContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { PLANES, formatEUR } from '../../config/planes'

const FRAUNCES = "'Fraunces', Georgia, serif"
const DM_SANS  = "'DM Sans', system-ui, sans-serif"
const DM_MONO  = "'DM Mono', monospace"

// ── Constantes ────────────────────────────────────────────────────
const DURACIONES = [15, 30, 45, 60, 90, 120]

const NOTIF_DEFAULTS = {
  recordatorio_24h:      true,
  recordatorio_2h:       true,
  bienvenida_paciente:   true,
  alerta_abandono_30d:   false,
  nuevo_registro_medico: true,
}

const MOCK_MEDICOS = [
  { id: 'm1', nombre: 'Dra. María García', especialidad: 'Medicina Estética', email: 'dra.garcia@lumiere.com', colegiado: '46-12345', telefono: '+34 611 222 333', activo: true,  foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face' },
  { id: 'm2', nombre: 'Dr. Carlos Ruiz',   especialidad: 'Dermatología',       email: 'dr.ruiz@lumiere.com',    colegiado: '46-67890', telefono: '+34 622 333 444', activo: true,  foto: null },
]

const MOCK_TRATAMIENTOS = [
  { id: 't1', nombre: 'Mesoterapia facial',    descripcion: 'Revitalización con vitaminas',      duracion_minutos: 45, precio: 120, color: '#C8A882', activo: true  },
  { id: 't2', nombre: 'Botox',                 descripcion: 'Tratamiento con toxina botulínica', duracion_minutos: 30, precio: 250, color: '#A89BC8', activo: true  },
  { id: 't3', nombre: 'Peeling químico',       descripcion: 'Renovación celular profunda',       duracion_minutos: 60, precio: 180, color: '#C8B8A2', activo: false },
]

// ── UI helpers ────────────────────────────────────────────────────
const card = {
  background: '#FFFFFF',
  border: '1px solid rgba(22,19,19,0.07)',
  borderRadius: '2px',
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#F7F5F2', border: '1px solid rgba(22,19,19,0.08)',
  borderRadius: '2px', fontFamily: DM_SANS, fontSize: '13px',
  fontWeight: 300, color: '#161313', outline: 'none',
  boxSizing: 'border-box',
}

function FieldLabel({ children }) {
  return (
    <span style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,19,19,0.3)', display: 'block', marginBottom: '6px' }}>
      {children}
    </span>
  )
}

function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
        background: on ? '#929C92' : 'rgba(22,19,19,0.15)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '2px',
        left: on ? '18px' : '2px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#FFFFFF', transition: 'left 0.2s',
      }} />
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
      background: '#161313', color: '#F7F5F2',
      padding: '12px 20px', borderRadius: '2px',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300,
    }}>
      <span style={{ color: toast.type === 'error' ? '#A39384' : '#929C92' }}>
        {toast.type === 'error' ? '⚠' : '✓'}
      </span>
      {toast.msg}
    </div>
  )
}

function UnsavedBanner({ dirty }) {
  if (!dirty) return null
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(22,19,19,0.95)', backdropFilter: 'blur(8px)',
      padding: '12px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '16px',
    }}>
      <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(247,245,242,0.7)' }}>
        Tienes cambios sin guardar
      </span>
    </div>
  )
}

// ── SECCIÓN 1: IDENTIDAD ─────────────────────────────────────────
function SecIdentidad({ clinica, onSave }) {
  const [form, setForm] = useState({
    nombre:    clinica?.nombre    ?? '',
    slug:      clinica?.slug      ?? '',
    direccion: clinica?.direccion ?? '',
    ciudad:    clinica?.ciudad    ?? '',
    telefono:  clinica?.telefono  ?? '',
    email:     clinica?.email     ?? '',
    web:       clinica?.web       ?? '',
    horario:   clinica?.horario   ?? '',
  })
  const [color,       setColor]       = useState(clinica?.color_primario ?? '#C8A882')
  const [logoPreview, setLogoPreview] = useState(clinica?.logo_url ?? null)
  const [logoFile,    setLogoFile]    = useState(null)
  const [dirty,       setDirty]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [focusKey,    setFocusKey]    = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    if (!clinica) return
    setForm({
      nombre:    clinica.nombre    ?? '',
      slug:      clinica.slug      ?? '',
      direccion: clinica.direccion ?? '',
      ciudad:    clinica.ciudad    ?? '',
      telefono:  clinica.telefono  ?? '',
      email:     clinica.email     ?? '',
      web:       clinica.web       ?? '',
      horario:   clinica.horario   ?? '',
    })
    setColor(clinica.color_primario ?? '#C8A882')
    setLogoPreview(clinica.logo_url ?? null)
    setDirty(false)
  }, [clinica?.id])

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setDirty(true) }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    let logo_url = clinica?.logo_url ?? null
    if (logoFile && supabase && !clinica._isMock) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${clinica.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data } = supabase.storage.from('logos').getPublicUrl(path)
        logo_url = data.publicUrl
      }
    }
    await onSave({ ...form, color_primario: color, logo_url })
    setSaving(false)
    setDirty(false)
  }

  const FIELDS = [
    { label: 'Nombre de la clínica', key: 'nombre',   placeholder: 'Clínica Lumière' },
    { label: 'Ciudad',               key: 'ciudad',   placeholder: 'Valencia' },
    { label: 'Dirección',            key: 'direccion', placeholder: 'Calle Colón 12, 46004' },
    { label: 'Teléfono de contacto', key: 'telefono', placeholder: '+34 963 123 456' },
    { label: 'Email de contacto',    key: 'email',    placeholder: 'info@clinica.es', type: 'email' },
    { label: 'Sitio web (opcional)', key: 'web',      placeholder: 'https://clinica.es', type: 'url' },
  ]

  return (
    <div style={{ ...card, padding: '32px', marginBottom: '16px' }}>
      {/* Logo */}
      <div style={{ marginBottom: '28px' }}>
        <FieldLabel>Logotipo</FieldLabel>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: '120px', height: '80px',
            border: '1px dashed rgba(22,19,19,0.15)', borderRadius: '2px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: 'rgba(22,19,19,0.02)', overflow: 'hidden',
          }}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <i className="ti ti-upload" style={{ fontSize: '20px', color: 'rgba(22,19,19,0.2)' }} />
              <span style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.3)', marginTop: '4px' }}>
                Subir logo
              </span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
      </div>

      {/* Campos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {FIELDS.map(({ label, key, placeholder, type = 'text' }) => (
          <div key={key}>
            <FieldLabel>{label}</FieldLabel>
            <input
              type={type}
              value={form[key]}
              onChange={e => setField(key, e.target.value)}
              onFocus={() => setFocusKey(key)}
              onBlur={() => setFocusKey(null)}
              placeholder={placeholder}
              style={{
                ...inputStyle,
                borderColor: focusKey === key ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.08)',
                background: focusKey === key ? '#FFFFFF' : '#F7F5F2',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            />
          </div>
        ))}
        <div>
          <FieldLabel>Slug (URL)</FieldLabel>
          <input
            type="text"
            value={form.slug}
            readOnly
            style={{ ...inputStyle, background: 'rgba(22,19,19,0.02)', color: 'rgba(22,19,19,0.4)', cursor: 'default' }}
          />
        </div>
        <div>
          <FieldLabel>Horario de atención</FieldLabel>
          <input
            type="text"
            value={form.horario}
            onChange={e => setField('horario', e.target.value)}
            onFocus={() => setFocusKey('horario')}
            onBlur={() => setFocusKey(null)}
            placeholder="Lunes a Viernes 9:00-20:00"
            style={{
              ...inputStyle,
              borderColor: focusKey === 'horario' ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.08)',
              background: focusKey === 'horario' ? '#FFFFFF' : '#F7F5F2',
            }}
          />
        </div>
      </div>

      {/* Color */}
      <div style={{ marginBottom: '28px' }}>
        <FieldLabel>Color corporativo</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); setDirty(true) }}
            style={{ width: '40px', height: '28px', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', cursor: 'pointer', padding: '2px' }}
          />
          <span style={{ fontFamily: DM_MONO, fontSize: '12px', color: 'rgba(22,19,19,0.5)' }}>{color}</span>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: '#161313', color: '#F7F5F2', border: 'none',
          borderRadius: '2px', padding: '12px 24px',
          fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── SECCIÓN 2: EQUIPO ────────────────────────────────────────────
const EMPTY_MEDICO = { nombre: '', especialidad: '', colegiado: '', email: '', telefono: '', foto: '' }

function SecEquipo({ clinica, showToast }) {
  const [medicos, setMedicos] = useState([])
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY_MEDICO)
  const [saving,  setSaving]  = useState(false)
  const [focusKey, setFocusKey] = useState(null)

  useEffect(() => {
    if (supabase && clinica?.id && !clinica._isMock) {
      supabase.from('medicos').select('*').eq('clinica_id', clinica.id)
        .then(({ data }) => { if (data?.length) setMedicos(data) })
    } else {
      setMedicos(MOCK_MEDICOS)
    }
  }, [clinica?.id])

  function openAdd()   { setForm(EMPTY_MEDICO); setModal({ mode: 'add' }) }
  function openEdit(m) { setForm({ nombre: m.nombre, especialidad: m.especialidad ?? '', colegiado: m.colegiado ?? '', email: m.email ?? '', telefono: m.telefono ?? '', foto: m.foto ?? '' }); setModal({ mode: 'edit', id: m.id }) }

  async function toggleActivo(m) {
    const updated = { ...m, activo: !m.activo }
    setMedicos(prev => prev.map(x => x.id === m.id ? updated : x))
    if (supabase && !clinica._isMock) await supabase.from('medicos').update({ activo: !m.activo }).eq('id', m.id)
  }

  async function handleSave() {
    setSaving(true)
    if (modal.mode === 'add') {
      if (supabase && clinica?.id && !clinica._isMock) {
        const { data, error } = await supabase.from('medicos').insert([{ ...form, clinica_id: clinica.id, activo: true }]).select().single()
        if (error) { showToast('Error al añadir médico: ' + error.message, 'error'); setSaving(false); return }
        if (data) setMedicos(prev => [...prev, data])
      } else {
        setMedicos(prev => [...prev, { ...form, id: 'm' + Date.now(), activo: true }])
      }
    } else {
      setMedicos(prev => prev.map(m => m.id === modal.id ? { ...m, ...form } : m))
      if (supabase && !clinica._isMock) {
        const { error } = await supabase.from('medicos').update(form).eq('id', modal.id)
        if (error) { showToast('Error al guardar: ' + error.message, 'error'); setSaving(false); return }
      }
    }
    setSaving(false)
    setModal(null)
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const MEDICO_FIELDS = [
    ['Nombre completo',    'nombre'],
    ['Especialidad',       'especialidad'],
    ['Nº de colegiado',    'colegiado'],
    ['Email',              'email'],
    ['Teléfono directo',   'telefono'],
    ['URL foto de perfil', 'foto'],
  ]

  return (
    <>
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Equipo médico</span>
          <button
            onClick={openAdd}
            style={{
              background: 'transparent', color: '#161313',
              border: '1px solid rgba(22,19,19,0.15)', borderRadius: '2px',
              padding: '7px 14px', fontFamily: DM_SANS, fontSize: '11px',
              fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: '13px' }} />
            Nuevo médico
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(22,19,19,0.06)', background: 'rgba(22,19,19,0.01)' }}>
              {['MÉDICO', 'ESPECIALIDAD', 'COLEGIADO', 'ESTADO', 'ACCIONES'].map(col => (
                <th key={col} style={{ fontFamily: DM_MONO, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.3)', padding: '10px 20px', textAlign: 'left', fontWeight: 400 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicos.map(m => {
              const inicial = m.nombre?.[0]?.toUpperCase() ?? '?'
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(22,19,19,0.04)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {m.foto ? (
                        <img src={m.foto} alt={m.nombre} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(22,19,19,0.06)', border: '1px solid rgba(22,19,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: FRAUNCES, fontSize: '13px', color: 'rgba(22,19,19,0.4)' }}>{inicial}</span>
                        </div>
                      )}
                      <div>
                        <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0 }}>{m.nombre}</p>
                        {m.email && <p style={{ fontFamily: DM_SANS, fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: '1px 0 0' }}>{m.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.5)' }}>{m.especialidad}</td>
                  <td style={{ padding: '14px 20px', fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.4)' }}>{m.colegiado}</td>
                  <td style={{ padding: '14px 20px' }}><Toggle on={m.activo} onClick={() => toggleActivo(m)} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(m)} style={{ width: '28px', height: '28px', borderRadius: '2px', border: '1px solid rgba(22,19,19,0.1)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(22,19,19,0.4)' }}>
                        <i className="ti ti-pencil" style={{ fontSize: '13px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal médico */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,19,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ ...card, width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: '#161313' }}>
                {modal.mode === 'add' ? 'Añadir médico' : 'Editar médico'}
              </span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,19,19,0.4)', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {MEDICO_FIELDS.map(([label, key]) => (
                <div key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setF(key, e.target.value)}
                    onFocus={() => setFocusKey(key)}
                    onBlur={() => setFocusKey(null)}
                    style={{ ...inputStyle, borderColor: focusKey === key ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.08)', background: focusKey === key ? '#FFFFFF' : '#F7F5F2' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 1, padding: '11px', background: '#161313', border: 'none', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F7F5F2', cursor: saving || !form.nombre ? 'not-allowed' : 'pointer', opacity: saving || !form.nombre ? 0.5 : 1 }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── SECCIÓN 3: CATÁLOGO ──────────────────────────────────────────
const EMPTY_TRAT = { nombre: '', descripcion: '', duracion_minutos: 60, precio: '', color: '#C8A882', activo: true }

function SecCatalogo({ clinica, showToast }) {
  const [lista,   setLista]   = useState([])
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY_TRAT)
  const [saving,  setSaving]  = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [focusKey, setFocusKey] = useState(null)

  async function cargarTratamientos() {
    if (supabase && clinica?.id && !clinica._isMock) {
      const { data, error } = await supabase.from('tratamientos').select('*').eq('clinica_id', clinica.id).order('nombre')
      if (!error && data) setLista(data)
    } else {
      setLista(MOCK_TRATAMIENTOS)
    }
  }

  useEffect(() => { cargarTratamientos() }, [clinica?.id])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function toggleActivo(t) {
    setLista(prev => prev.map(x => x.id === t.id ? { ...x, activo: !x.activo } : x))
    if (supabase && !clinica._isMock) await supabase.from('tratamientos').update({ activo: !t.activo }).eq('id', t.id)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, precio: parseFloat(form.precio) || null }
    if (modal.mode === 'add') {
      if (supabase && clinica?.id && !clinica._isMock) {
        const { data, error } = await supabase.from('tratamientos').insert([{ ...payload, clinica_id: clinica.id }]).select().single()
        if (error) { showToast('Error al añadir tratamiento: ' + error.message, 'error'); setSaving(false); return }
        await cargarTratamientos()
      } else {
        setLista(prev => [...prev, { ...payload, id: 't' + Date.now() }])
      }
    } else {
      if (supabase && clinica?.id && !clinica._isMock) {
        const { error } = await supabase.from('tratamientos').update(payload).eq('id', modal.id)
        if (error) { showToast('Error al guardar: ' + error.message, 'error'); setSaving(false); return }
        await cargarTratamientos()
      } else {
        setLista(prev => prev.map(x => x.id === modal.id ? { ...x, ...payload } : x))
      }
    }
    setSaving(false)
    setModal(null)
  }

  async function handleDelete(id) {
    setLista(prev => prev.filter(x => x.id !== id))
    if (supabase && !clinica._isMock) await supabase.from('tratamientos').delete().eq('id', id)
    setConfirm(null)
  }

  function openAdd()   { setForm(EMPTY_TRAT); setModal({ mode: 'add' }) }
  function openEdit(t) { setForm({ nombre: t.nombre, descripcion: t.descripcion ?? '', duracion_minutos: t.duracion_minutos, precio: t.precio ?? '', color: t.color ?? '#C8A882', activo: t.activo }); setModal({ mode: 'edit', id: t.id }) }

  return (
    <>
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(22,19,19,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FRAUNCES, fontSize: '16px', fontWeight: 400, color: '#161313' }}>Catálogo de tratamientos</span>
          <button
            onClick={openAdd}
            style={{ background: 'transparent', color: '#161313', border: '1px solid rgba(22,19,19,0.15)', borderRadius: '2px', padding: '7px 14px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="ti ti-plus" style={{ fontSize: '13px' }} />
            Nuevo tratamiento
          </button>
        </div>

        {lista.map(t => (
          <div key={t.id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(22,19,19,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color ?? '#C8A882', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nombre}</p>
              <p style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.4)', margin: '2px 0 0' }}>{t.duracion_minutos}min · {t.precio ? formatEUR(t.precio) : 'Sin precio'}</p>
            </div>
            <Toggle on={t.activo} onClick={() => toggleActivo(t)} />
            <button onClick={() => openEdit(t)} style={{ width: '28px', height: '28px', borderRadius: '2px', border: '1px solid rgba(22,19,19,0.1)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(22,19,19,0.4)' }}>
              <i className="ti ti-pencil" style={{ fontSize: '13px' }} />
            </button>
            <button onClick={() => setConfirm(t.id)} style={{ width: '28px', height: '28px', borderRadius: '2px', border: '1px solid rgba(163,147,132,0.2)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A39384' }}>
              <i className="ti ti-trash" style={{ fontSize: '13px' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm delete */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,19,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ ...card, padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <i className="ti ti-trash" style={{ fontSize: '28px', color: '#A39384', display: 'block', marginBottom: '12px' }} />
            <p style={{ fontFamily: DM_SANS, fontSize: '15px', fontWeight: 400, color: '#161313', margin: '0 0 6px' }}>¿Eliminar tratamiento?</p>
            <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: '0 0 24px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleDelete(confirm)} style={{ flex: 1, padding: '11px', background: '#A39384', border: 'none', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F7F5F2', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tratamiento */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,19,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ ...card, width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontFamily: FRAUNCES, fontSize: '20px', fontWeight: 300, color: '#161313' }}>
                {modal.mode === 'add' ? 'Añadir tratamiento' : 'Editar tratamiento'}
              </span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,19,19,0.4)', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <FieldLabel>Nombre</FieldLabel>
                <input type="text" value={form.nombre} onChange={e => setF('nombre', e.target.value)} onFocus={() => setFocusKey('tn')} onBlur={() => setFocusKey(null)} style={{ ...inputStyle, borderColor: focusKey === 'tn' ? 'rgba(22,19,19,0.2)' : 'rgba(22,19,19,0.08)', background: focusKey === 'tn' ? '#FFFFFF' : '#F7F5F2' }} />
              </div>
              <div>
                <FieldLabel>Descripción corta</FieldLabel>
                <textarea value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <FieldLabel>Duración</FieldLabel>
                <select value={form.duracion_minutos} onChange={e => setF('duracion_minutos', +e.target.value)} style={{ ...inputStyle }}>
                  {DURACIONES.map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Precio (€)</FieldLabel>
                <input type="number" value={form.precio} onChange={e => setF('precio', e.target.value)} min="0" style={{ ...inputStyle }} />
              </div>
              <div>
                <FieldLabel>Color en agenda</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="color" value={form.color} onChange={e => setF('color', e.target.value)} style={{ width: '40px', height: '28px', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', cursor: 'pointer', padding: '2px' }} />
                  <span style={{ fontFamily: DM_MONO, fontSize: '12px', color: 'rgba(22,19,19,0.5)' }}>{form.color}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 1, padding: '11px', background: '#161313', border: 'none', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F7F5F2', cursor: saving || !form.nombre ? 'not-allowed' : 'pointer', opacity: saving || !form.nombre ? 0.5 : 1 }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── SECCIÓN 4: NOTIFICACIONES ────────────────────────────────────
const NOTIF_CONFIG = [
  { key: 'recordatorio_24h',      title: 'Recordatorio 24 horas',   desc: 'Aviso automático el día anterior a la cita'      },
  { key: 'recordatorio_2h',       title: 'Recordatorio 2 horas',    desc: 'Segundo aviso antes de la cita'                  },
  { key: 'alerta_abandono_30d',   title: 'Alerta de abandono',      desc: 'Notifica pacientes sin actividad en 60 días'     },
  { key: 'bienvenida_paciente',   title: 'Resumen diario',          desc: 'Email con agenda del día cada mañana'            },
  { key: 'nuevo_registro_medico', title: 'Nuevas reseñas',          desc: 'Alerta cuando llega una reseña de Google'        },
]

function SecNotificaciones({ clinica, onSave }) {
  const init = { ...NOTIF_DEFAULTS, ...(clinica?.notificaciones ?? {}) }
  const [toggles, setToggles] = useState(init)
  const [wapp,    setWapp]    = useState(clinica?.whatsapp_numero ?? '')
  const [dirty,   setDirty]   = useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!clinica) return
    setToggles({ ...NOTIF_DEFAULTS, ...(clinica.notificaciones ?? {}) })
    setWapp(clinica.whatsapp_numero ?? '')
    setDirty(false)
  }, [clinica?.id])

  function setToggle(k) { setToggles(t => ({ ...t, [k]: !t[k] })); setDirty(true) }

  async function handleSave() {
    setSaving(true)
    await onSave({ notificaciones: toggles, whatsapp_numero: wapp })
    setSaving(false)
    setDirty(false)
  }

  return (
    <div style={{ ...card, padding: '32px' }}>
      {NOTIF_CONFIG.map((n, i) => (
        <div key={n.key} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < NOTIF_CONFIG.length - 1 ? '1px solid rgba(22,19,19,0.05)' : 'none' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 400, color: '#161313', margin: 0 }}>{n.title}</p>
            <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: '2px 0 0' }}>{n.desc}</p>
          </div>
          <Toggle on={toggles[n.key]} onClick={() => setToggle(n.key)} />
        </div>
      ))}

      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(22,19,19,0.06)' }}>
        <FieldLabel>WhatsApp de la clínica</FieldLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="tel"
            value={wapp}
            onChange={e => { setWapp(e.target.value); setDirty(true) }}
            placeholder="+34 600 000 000"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => alert('Verificación de WhatsApp Business disponible próximamente.')}
            style={{ padding: '11px 16px', background: 'transparent', border: '1px solid rgba(22,19,19,0.1)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.4)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Verificar
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: '24px', background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '12px 24px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── SECCIÓN 5: SUSCRIPCIÓN ───────────────────────────────────────
function SecSuscripcion({ clinica, plan }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const isMock = clinica?._isMock

  async function handlePortal() {
    if (isMock || !clinica?.stripe_customer_id) {
      setError('Esta función requiere una suscripción activa en producción. Usa "Cambiar de plan" para activar uno.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: clinica.stripe_customer_id }),
      })
      if (!res.ok) {
        if (res.status === 404) throw new Error('API no disponible localmente. Ejecuta "vercel dev" para probar.')
        throw new Error(`Error ${res.status}`)
      }
      const { url, error: e } = await res.json()
      if (e) throw new Error(e)
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const renovacion = clinica?.fecha_renovacion
    ? new Date(clinica.fecha_renovacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const planFeatures = plan?.features ? Object.entries(plan.features).filter(([, v]) => v) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Plan actual */}
      <div style={{ ...card, padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span style={{ fontFamily: DM_MONO, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(146,156,146,0.3)', color: '#929C92', padding: '3px 10px', borderRadius: '2px' }}>
              {plan?.nombre ?? 'Sin plan'}
            </span>
            <p style={{ fontFamily: FRAUNCES, fontSize: '36px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '12px 0 0' }}>
              {plan?.precio ? formatEUR(plan.precio) : '—'}
              <span style={{ fontFamily: DM_SANS, fontSize: '14px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginLeft: '6px' }}>/mes + IVA</span>
            </p>
          </div>
        </div>

        <p style={{ fontFamily: DM_MONO, fontSize: '11px', color: 'rgba(22,19,19,0.3)', margin: '0 0 24px' }}>
          Renueva el {renovacion}
        </p>

        {/* Features */}
        {planFeatures.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {planFeatures.map(([key]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#929C92', fontFamily: DM_MONO, fontSize: '12px' }}>✓</span>
                <span style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.6)', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: '#A39384', margin: '0 0 16px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isMock && (
            <button
              onClick={handlePortal}
              disabled={loading}
              style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(22,19,19,0.15)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#161313', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <i className="ti ti-external-link" style={{ fontSize: '13px' }} />
              {loading ? 'Abriendo…' : 'Gestionar suscripción'}
            </button>
          )}
          <Link
            to="/precios"
            style={{ padding: '12px', background: '#161313', border: 'none', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F7F5F2', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}
          >
            {isMock ? 'Ver planes y activar suscripción' : 'Cambiar de plan'}
          </Link>
        </div>
      </div>

      {/* Zona de gestión */}
      <div style={{ ...card, padding: '24px', border: '1px solid rgba(163,147,132,0.2)' }}>
        <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 400, color: '#A39384', margin: '0 0 4px' }}>Zona de gestión</p>
        <p style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: '0 0 16px' }}>
          Para cancelar tu suscripción, contacta con soporte o gestiona desde el portal de Stripe.
        </p>
        <button style={{ padding: '9px 16px', background: 'none', border: '1px solid rgba(163,147,132,0.3)', borderRadius: '2px', fontFamily: DM_SANS, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A39384', cursor: 'pointer' }}>
          Cancelar suscripción
        </button>
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────
const TABS = [
  { id: 'identidad',      label: 'Identidad'           },
  { id: 'equipo',         label: 'Equipo'               },
  { id: 'catalogo',       label: 'Catálogo'             },
  { id: 'notificaciones', label: 'Notificaciones'       },
  { id: 'suscripcion',    label: 'Suscripción'          },
]

export default function ConfiguracionPage() {
  const { slug }                                    = useParams()
  const { clinica, setClinica, plan, refreshClinica } = useClinic()
  const { user }                                    = useAuth()
  const [tab,   setTab]   = useState('identidad')
  const [toast, setToast] = useState(null)

  if (user && user.rol !== 'admin') {
    return <Navigate to={`/clinica/${slug}/dashboard`} replace />
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveClinica(fields) {
    if (supabase && clinica?.id && !clinica._isMock) {
      const { data, error } = await supabase
        .from('clinicas')
        .update(fields)
        .eq('id', clinica.id)
        .select()
        .single()
      if (error) { showToast('Error al guardar: ' + error.message, 'error'); return }
      setClinica(data)
      showToast('Cambios guardados correctamente')
    } else {
      setClinica(prev => ({ ...prev, ...fields }))
      showToast('Cambios guardados correctamente')
    }
  }

  return (
    <StaffLayout>
      <div style={{ padding: '32px 40px', minHeight: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: DM_MONO, fontSize: '10px', color: 'rgba(22,19,19,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
            Configuración
          </p>
          <h1 style={{ fontFamily: FRAUNCES, fontSize: '32px', fontWeight: 300, color: '#161313', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Configuración
          </h1>
          <p style={{ fontFamily: DM_SANS, fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', marginTop: '4px', marginBottom: 0 }}>
            {clinica?.nombre}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(22,19,19,0.08)', marginBottom: '32px' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: DM_SANS, fontSize: '13px',
                letterSpacing: '0.02em', transition: 'all 0.15s',
                borderBottom: `2px solid ${tab === t.id ? '#161313' : 'transparent'}`,
                color: tab === t.id ? '#161313' : 'rgba(22,19,19,0.35)',
                fontWeight: tab === t.id ? 400 : 300,
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {tab === 'identidad'      && <SecIdentidad      clinica={clinica} onSave={handleSaveClinica} />}
        {tab === 'equipo'         && <SecEquipo          clinica={clinica} showToast={showToast} />}
        {tab === 'catalogo'       && <SecCatalogo        clinica={clinica} showToast={showToast} />}
        {tab === 'notificaciones' && <SecNotificaciones  clinica={clinica} onSave={handleSaveClinica} />}
        {tab === 'suscripcion'    && <SecSuscripcion     clinica={clinica} plan={plan} />}
      </div>

      <Toast toast={toast} />
    </StaffLayout>
  )
}
