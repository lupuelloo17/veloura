import { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PLANES } from '../config/planes'

// ── Mock data (used when Supabase is not configured) ──────────
const MOCK_CLINICAS = {
  'clinica-lumiere': {
    id: 'mock-lumiere',
    nombre: 'Clínica Lumière',
    slug: 'clinica-lumiere',
    logo_url: null,
    color_primario: '#E8A0B0',
    plan: 'premium',
    plan_activo: true,
    max_pacientes: 300,
    max_medicos: 4,
    ciudad: 'Bogotá',
    pais: 'Colombia',
    fecha_renovacion: '2026-05-15T00:00:00Z',
  },
  'derma-bogota': {
    id: 'mock-derma',
    nombre: 'DermaCenter Bogotá',
    slug: 'derma-bogota',
    logo_url: null,
    color_primario: '#1B3A6B',
    plan: 'elite',
    plan_activo: true,
    max_pacientes: Infinity,
    max_medicos: Infinity,
    ciudad: 'Bogotá',
    pais: 'Colombia',
    fecha_renovacion: '2027-01-01T00:00:00Z',
  },
}

// ── Context ───────────────────────────────────────────────────
const ClinicContext = createContext(null)

export function ClinicProvider({ children }) {
  const { slug } = useParams()
  const [clinica, setClinica]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!slug) return
    loadClinica(slug)
  }, [slug])

  // Inject CSS variables whenever clinica changes
  useEffect(() => {
    if (!clinica) return
    const root = document.documentElement
    root.style.setProperty('--color-brand', clinica.color_primario)
    root.style.setProperty('--color-brand-light', clinica.color_primario + '22')
    if (clinica.logo_url) {
      root.style.setProperty('--logo-url', `url(${clinica.logo_url})`)
    }
    // Restore defaults on unmount
    return () => {
      root.style.setProperty('--color-brand', '#E8A0B0')
      root.style.removeProperty('--logo-url')
    }
  }, [clinica])

  async function loadClinica(slugParam) {
    setLoading(true)
    setError(null)
    try {
      if (supabase) {
        const { data, error: err } = await supabase
          .from('clinicas')
          .select('*')
          .eq('slug', slugParam)
          .single()
        if (err) throw err
        setClinica(data)
      } else {
        // Fallback to mock data
        const mock = MOCK_CLINICAS[slugParam]
        if (!mock) throw new Error(`Clínica "${slugParam}" no encontrada`)
        setClinica(mock)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const plan = clinica ? (PLANES[clinica.plan] ?? PLANES.esencial) : null

  function hasFeature(key) {
    return plan?.features?.[key] === true
  }

  return (
    <ClinicContext.Provider value={{ clinica, plan, loading, error, hasFeature }}>
      {children}
    </ClinicContext.Provider>
  )
}

export function useClinic() {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside <ClinicProvider>')
  return ctx
}
