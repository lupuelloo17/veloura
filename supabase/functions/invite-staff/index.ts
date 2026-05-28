// ═══════════════════════════════════════════════════════════════════════════
//  invite-staff  —  Supabase Edge Function
//
//  Crea un miembro del equipo en dos pasos atómicos:
//    1. Crea (o invita) al usuario en auth.users vía Admin API (service_role)
//    2. Inserta la fila correspondiente en public.usuarios con el UUID devuelto
//
//  Por qué Edge Function y no INSERT directo:
//    · public.usuarios.id  es  FK → auth.users(id)  SIN default.
//      No se puede insertar sin que exista primero la fila en auth.users.
//    · La Admin API de Supabase requiere service_role, que NUNCA se expone
//      al cliente; solo está disponible en el servidor (Edge Function).
//
//  Comportamiento según email:
//    · Con email  → inviteUserByEmail()  — el usuario recibe email de bienvenida
//                   con enlace para establecer su contraseña.
//    · Sin email  → createUser() con email placeholder interno — el médico
//                   existe en la BD pero no tiene acceso hasta que se le asigne
//                   un email real.
//
//  Autorización:
//    · Solo usuarios con rol = 'admin' y misma clinica_id pueden crear staff.
//    · Se verifica leyendo public.usuarios con service_role (no RLS).
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ──────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Parsear body ──────────────────────────────────────────────────
    const { nombre, email, especialidad, foto, rol = 'medico', clinica_id } =
      await req.json()

    if (!nombre || !clinica_id) {
      return json({ error: 'nombre y clinica_id son obligatorios' }, 400)
    }

    // ── 2. Clientes Supabase ─────────────────────────────────────────────
    const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const SUPABASE_ANON            = Deno.env.get('SUPABASE_ANON_KEY')!

    // Admin client — bypasa RLS, puede llamar auth.admin.*
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Client del llamante — para verificar su sesión
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller     = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })

    // ── 3. Verificar que el llamante es admin de la clínica ──────────────
    const { data: { user: callerUser }, error: sessionErr } = await caller.auth.getUser()
    if (sessionErr || !callerUser) {
      return json({ error: 'No autenticado' }, 401)
    }

    const { data: callerProfile, error: profileErr } = await admin
      .from('usuarios')
      .select('rol, clinica_id')
      .eq('id', callerUser.id)
      .single()

    if (
      profileErr ||
      callerProfile?.rol !== 'admin' ||
      callerProfile?.clinica_id !== clinica_id
    ) {
      return json({ error: 'Solo los administradores pueden añadir personal' }, 403)
    }

    // ── 4. Crear el usuario en auth.users ────────────────────────────────
    let authUserId: string
    let wasInvited = false

    if (email) {
      // Invitar por email — el usuario recibirá un enlace para activar su cuenta
      const { data: inviteData, error: inviteErr } =
        await admin.auth.admin.inviteUserByEmail(email, {
          data: { rol, clinica_id, nombre, especialidad: especialidad ?? null },
        })

      if (inviteErr) {
        // Si el email ya existe en auth, recuperar su id para vincular la fila
        if (inviteErr.message?.toLowerCase().includes('already been registered')) {
          const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
          const existing = listData?.users?.find(u => u.email === email)
          if (!existing) return json({ error: inviteErr.message }, 400)
          authUserId = existing.id
        } else {
          return json({ error: inviteErr.message }, 400)
        }
      } else {
        authUserId = inviteData.user.id
        wasInvited = true
      }
    } else {
      // Sin email — placeholder interno (el médico no puede iniciar sesión hasta
      // que se le asigne un email real desde la configuración)
      const placeholderEmail =
        `staff-${Date.now()}@placeholder.${clinica_id.slice(0, 8)}.veloura`

      const { data: createData, error: createErr } =
        await admin.auth.admin.createUser({
          email:         placeholderEmail,
          email_confirm: true,
          user_metadata: { nombre, rol, clinica_id },
        })

      if (createErr) return json({ error: createErr.message }, 400)
      authUserId = createData.user.id
    }

    // ── 5. Insertar fila en public.usuarios ──────────────────────────────
    const { data: usuario, error: dbErr } = await admin
      .from('usuarios')
      .insert([{
        id:           authUserId,
        nombre,
        email:        email        || null,
        especialidad: especialidad || null,
        foto:         foto         || null,
        rol,
        activo:       true,
        clinica_id,
      }])
      .select()
      .single()

    if (dbErr) {
      // Rollback: eliminar el auth user recién creado para no dejar huérfanos
      await admin.auth.admin.deleteUser(authUserId)
      return json({ error: dbErr.message }, 400)
    }

    // ── 6. Respuesta ─────────────────────────────────────────────────────
    return json({ data: usuario, invited: wasInvited })

  } catch (err) {
    console.error('[invite-staff] unexpected error:', err)
    return json({ error: String(err) }, 500)
  }
})
