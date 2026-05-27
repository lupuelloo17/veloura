import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Mock users (used when Supabase is not configured) ─────────
const MOCK_USERS = {
  'admin@lumiere.com': {
    id: 'mock-admin',
    email: 'admin@lumiere.com',
    password: 'demo1234',
    nombre: 'Administrador',
    rol: 'admin',
    clinica_slug: 'clinica-lumiere',
    clinica_id: 'mock-lumiere',
    foto: null,
  },
  'dra.garcia@lumiere.com': {
    id: 'mock-garcia',
    email: 'dra.garcia@lumiere.com',
    password: 'demo1234',
    nombre: 'Dra. María García',
    especialidad: 'Medicina Estética',
    colegiado: '46-12345',
    rol: 'medico',
    clinica_slug: 'clinica-lumiere',
    clinica_id: 'mock-lumiere',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
  },
}

const SESSION_KEY = 'glowai_session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Restore session on mount
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (session) {
            setUser(sessionToBase(session))
            enrichFromDB(session.user.id, setUser, session.user.email)
          }
        })
        .catch(err => console.error('[AuthContext] getSession error:', err))
        .finally(() => setLoading(false))
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Solo limpiamos al usuario en un logout explícito.
        // TOKEN_REFRESHED, INITIAL_SESSION y otros eventos transitorios NO
        // deben borrar la sesión: hacerlo causaba un logout aparente si el
        // token expiraba durante una llamada larga a la IA (dermoscopia).
        if (event === 'SIGNED_OUT') { setUser(null); return }
        if (!session) return   // evento sin sesión pero no SIGNED_OUT → ignorar
        setUser(sessionToBase(session))
        enrichFromDB(session.user.id, setUser, session.user.email)
      })
      return () => subscription.unsubscribe()
    } else {
      // Mock: restore from localStorage
      try {
        const saved = localStorage.getItem(SESSION_KEY)
        if (saved) setUser(JSON.parse(saved))
      } catch { /* ignore */ }
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    setError(null)
    try {
      if (supabase) {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        const base = sessionToBase(data.session)
        enrichFromDB(data.session.user.id, setUser, data.session.user.email)
        return base
      } else {
        // Mock auth
        const mock = MOCK_USERS[email.toLowerCase()]
        if (!mock || mock.password !== password) throw new Error('Credenciales incorrectas')
        const { password: _, ...safeUser } = mock
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser))
        setUser(safeUser)
        return safeUser
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  function loginAsDemo(rol) {
    const email = rol === 'admin' ? 'admin@lumiere.com' : 'dra.garcia@lumiere.com'
    const mock  = MOCK_USERS[email]
    const { password: _, ...safeUser } = mock
    const demoUser = { ...safeUser, isDemoMode: true }
    localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
    return demoUser
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
    setUser(null)
  }

  const isDemoMode = user?.isDemoMode === true

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginAsDemo, logout, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Returns user object from session synchronously (no DB call)
function sessionToBase(session) {
  const meta = session.user.app_metadata ?? {}
  const base = {
    id:           session.user.id,
    email:        session.user.email,
    rol:          meta.rol ?? 'medico',
    clinica_id:   meta.clinica_id ?? null,
    clinica_slug: meta.clinica_slug ?? null,
    nombre:       session.user.user_metadata?.nombre ?? session.user.email,
    foto:         session.user.user_metadata?.foto ?? null,
  }
  return applyMockOverride(base)
}

// If the email is in MOCK_USERS, override display fields (rol, nombre, foto)
// but preserve DB-critical fields (clinica_id, clinica_slug) from the real JWT.
// This ensures demo accounts get correct roles without breaking real DB operations.
function applyMockOverride(base) {
  if (!base?.email) return base
  const mock = MOCK_USERS[base.email.toLowerCase()]
  if (!mock) return base
  // Exclude clinica_id and clinica_slug — these must come from the real JWT app_metadata
  const { password: _pw, id: _mid, email: _me, clinica_id: _cid, clinica_slug: _cs, ...mockFields } = mock
  return { ...base, ...mockFields }
}

// Enriches user with rol + clinica_id from usuarios table (fire-and-forget)
function enrichFromDB(userId, setUser, email) {
  _enrichFromDB(userId, setUser, email).catch(e => console.error('[enrichFromDB]', e))
}

async function _enrichFromDB(userId, setUser, email) {
  // 1. Intenta por id
  let { data } = await supabase
    .from('usuarios')
    .select('rol, clinica_id, nombre')
    .eq('id', userId)
    .single()

  // 2. Si no encuentra, busca por email y actualiza el id para que coincida
  if (!data && email) {
    const { data: found } = await supabase
      .from('usuarios')
      .select('rol, clinica_id, nombre')
      .eq('email', email)
      .single()

    if (found) {
      data = found
      // Actualiza el id del registro para que coincida con auth.uid()
      await supabase
        .from('usuarios')
        .update({ id: userId })
        .eq('email', email)
    }
  }

  if (!data) return

  let clinica_slug = null
  if (data.clinica_id) {
    const { data: clinicaData } = await supabase
      .from('clinicas')
      .select('slug')
      .eq('id', data.clinica_id)
      .single()
    if (clinicaData?.slug) clinica_slug = clinicaData.slug
  }

  setUser(prev => prev ? {
    ...prev,
    rol:          data.rol        ?? prev.rol,
    clinica_id:   data.clinica_id ?? prev.clinica_id,
    nombre:       data.nombre     ?? prev.nombre,
    ...(clinica_slug ? { clinica_slug } : {}),
  } : prev)
}
