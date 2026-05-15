/**
 * GlowAI — Creación de usuarios demo en Supabase Auth
 *
 * Ejecutar UNA SOLA VEZ con service_role key:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node supabase/create-demo-users.js
 */

import { createClient } from '@supabase/supabase-js'

const url        = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  {
    email: 'admin@lumiere.com',
    password: 'demo1234',
    nombre: 'Admin Lumière',
    rol: 'admin',
  },
  {
    email: 'dra.garcia@lumiere.com',
    password: 'demo1234',
    nombre: 'Dra. García',
    rol: 'medico',
  },
]

async function run() {
  // Get clinic id
  const { data: clinica, error: cErr } = await supabase
    .from('clinicas')
    .select('id')
    .eq('slug', 'clinica-lumiere')
    .single()
  if (cErr) { console.error('Clínica no encontrada:', cErr.message); process.exit(1) }

  for (const u of USERS) {
    // Create auth user
    const { data: authUser, error: aErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      app_metadata: { clinica_id: clinica.id, rol: u.rol },
    })
    if (aErr) { console.error(`Error creando ${u.email}:`, aErr.message); continue }

    // Insert into usuarios table
    const { error: uErr } = await supabase
      .from('usuarios')
      .insert({ id: authUser.user.id, clinica_id: clinica.id, nombre: u.nombre, rol: u.rol })
    if (uErr) console.error(`Error en usuarios para ${u.email}:`, uErr.message)
    else console.log(`✓ Creado: ${u.email} (${u.rol})`)
  }
}

run()
