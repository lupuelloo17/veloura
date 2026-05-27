import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PLANES } from '../config/planes'
import { applyClinicTheme, resetTheme } from '../lib/theme'

// ── Mock data (used when Supabase is not configured) ──────────
const MOCK_CLINICAS = {
  'clinica-lumiere': {
    id: 'mock-lumiere',
    _isMock: true,
    nombre: 'Clínica Lumière Valencia',
    slug: 'clinica-lumiere',
    logo_url: null,
    color_primario: '#929C92',
    plan: 'premium',
    plan_activo: true,
    max_pacientes: 300,
    max_medicos: 4,
    ciudad: 'Valencia',
    pais: 'España',
    direccion: 'Calle Colón 12, 46004 Valencia',
    email: 'info@clinicalumiere.es',
    telefono: '+34 963 123 456',
    fecha_renovacion: '2027-05-15T00:00:00Z',
  },
  'derma-madrid': {
    id: 'mock-derma',
    _isMock: true,
    nombre: 'DermaCenter Madrid',
    slug: 'derma-madrid',
    logo_url: null,
    color_primario: '#1B3A6B',
    plan: 'elite',
    plan_activo: true,
    max_pacientes: Infinity,
    max_medicos: Infinity,
    ciudad: 'Madrid',
    pais: 'España',
    direccion: 'Calle Serrano 45, 28001 Madrid',
    email: 'info@dermacenter.es',
    telefono: '+34 913 456 789',
    fecha_renovacion: '2028-01-01T00:00:00Z',
  },
}

// ── Context ───────────────────────────────────────────────────
const ClinicContext = createContext(null)

export function ClinicProvider({ children }) {
  const { slug } = useParams()
  const [clinica, setClinica]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const loadedSlugRef = useRef(null)

  useEffect(() => {
    if (!slug) return
    // Guard: skip if this slug is already loaded to prevent infinite re-renders
    if (loadedSlugRef.current === slug) return
    loadClinica(slug)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Inject CSS variables whenever clinica changes
  useEffect(() => {
    if (!clinica) return
    const root = document.documentElement
    root.style.setProperty('--color-brand', clinica.color_primario)
    root.style.setProperty('--color-brand-light', clinica.color_primario + '22')
    if (clinica.logo_url) {
      root.style.setProperty('--logo-url', `url(${clinica.logo_url})`)
    }
    applyClinicTheme(clinica.color_primario)
    // Restore defaults on unmount
    return () => {
      root.style.setProperty('--color-brand', '#E8A0B0')
      root.style.removeProperty('--logo-url')
      resetTheme()
    }
  }, [clinica])

  async function loadClinica(slugParam) {
    setLoading(true)
    setError(null)
    console.log('[ClinicContext] loading slug:', slugParam)
    try {
      // Demo slugs (mock-*) resolve immediately from local data — no Supabase call
      if (slugParam.startsWith('mock-')) {
        const mock = MOCK_CLINICAS[slugParam]
        if (!mock) throw new Error(`Clínica demo "${slugParam}" no encontrada`)
        setClinica(mock)
        loadedSlugRef.current = slugParam
        return
      }

      if (supabase) {
        const { data, error: err } = await supabase
          .from('clinicas')
          .select('*')
          .eq('slug', slugParam)
          .single()

        console.log('[ClinicContext] Supabase result:', { data, err })

        if (data) {
          setClinica(data)
          loadedSlugRef.current = slugParam
          return
        }

        // Supabase failed (RLS / not found) — fall back to mock
        console.warn('[ClinicContext] Supabase error, falling back to mock:', err?.message)
      }

      // Mock fallback
      const mock = MOCK_CLINICAS[slugParam]
      if (!mock) throw new Error(`Clínica "${slugParam}" no encontrada`)
      setClinica(mock)
      loadedSlugRef.current = slugParam
    } catch (err) {
      setError(err.message)
      loadedSlugRef.current = null  // Allow retry on next render if errored
    } finally {
      setLoading(false)
    }
  }

  const plan = clinica ? (PLANES[clinica.plan] ?? PLANES.esencial) : null

  function hasFeature(key) {
    return plan?.features?.[key] === true
  }

  function refreshClinica() {
    if (slug) {
      loadedSlugRef.current = null  // Reset guard to force a fresh load
      loadClinica(slug)
    }
  }

  return (
    <ClinicContext.Provider value={{ clinica, setClinica, plan, loading, error, hasFeature, refreshClinica }}>
      {children}
    </ClinicContext.Provider>
  )
}

export function useClinic() {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside <ClinicProvider>')
  return ctx
}
