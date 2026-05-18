-- ═══════════════════════════════════════════════════════════════════════════
--  021_pacientes_prueba.sql
--  Crea dos pacientes de prueba con login real en Supabase Auth.
--
--  Credenciales:
--    ana@lumiere.com    / demo1234
--    carmen@lumiere.com / demo1234
--
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_clinica_id uuid;
  v_medico_id  uuid;
  v_ana_id     uuid := gen_random_uuid();
  v_carmen_id  uuid := gen_random_uuid();
BEGIN

  -- ── 0. Obtener IDs necesarios ────────────────────────────────────────────
  SELECT id INTO v_clinica_id
    FROM public.clinicas
   WHERE slug = 'clinica-lumiere';

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'Clínica "clinica-lumiere" no encontrada. Ajusta el slug.';
  END IF;

  SELECT id INTO v_medico_id
    FROM public.usuarios
   WHERE clinica_id = v_clinica_id
     AND rol = 'medico'
   LIMIT 1;

  -- ── 1a. ANA MARTÍNEZ — auth.users ────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES (
    v_ana_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'ana@lumiere.com',
    crypt('demo1234', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider',     'email',
      'providers',    ARRAY['email'],
      'rol',          'paciente',
      'clinica_id',   v_clinica_id::text,
      'clinica_slug', 'clinica-lumiere'
    ),
    '{"nombre": "Ana Martínez"}'::jsonb,
    false, now(), now(), '', ''
  ) ON CONFLICT (id) DO NOTHING;

  -- 1b. ANA — auth.identities
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_ana_id, v_ana_id,
    'ana@lumiere.com', 'email',
    jsonb_build_object(
      'sub',            v_ana_id::text,
      'email',          'ana@lumiere.com',
      'email_verified', true
    ),
    now(), now(), now()
  ) ON CONFLICT DO NOTHING;

  -- 1c. ANA — public.usuarios  (el trigger sync_user_app_metadata actualizará app_metadata)
  INSERT INTO public.usuarios (id, clinica_id, nombre, email, rol, activo)
  VALUES (v_ana_id, v_clinica_id, 'Ana', 'ana@lumiere.com', 'paciente', true)
  ON CONFLICT (id) DO NOTHING;

  -- 1d. ANA — public.pacientes
  INSERT INTO public.pacientes (
    id, clinica_id, medico_id,
    nombre, apellido, email,
    tipo_piel, alergias, motivo_consulta,
    riesgo, total_visitas,
    rgpd_aceptado, marketing_aceptado,
    genero
  ) VALUES (
    v_ana_id, v_clinica_id, v_medico_id,
    'Ana', 'Martínez', 'ana@lumiere.com',
    'Mixta', 'Ninguna conocida',
    'Manchas solares y líneas de expresión',
    'bajo', 3,
    true, true,
    'Mujer'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Ana Martínez creada con id %', v_ana_id;

  -- ── 2a. CARMEN LÓPEZ — auth.users ────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES (
    v_carmen_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'carmen@lumiere.com',
    crypt('demo1234', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider',     'email',
      'providers',    ARRAY['email'],
      'rol',          'paciente',
      'clinica_id',   v_clinica_id::text,
      'clinica_slug', 'clinica-lumiere'
    ),
    '{"nombre": "Carmen López"}'::jsonb,
    false, now(), now(), '', ''
  ) ON CONFLICT (id) DO NOTHING;

  -- 2b. CARMEN — auth.identities
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_carmen_id, v_carmen_id,
    'carmen@lumiere.com', 'email',
    jsonb_build_object(
      'sub',            v_carmen_id::text,
      'email',          'carmen@lumiere.com',
      'email_verified', true
    ),
    now(), now(), now()
  ) ON CONFLICT DO NOTHING;

  -- 2c. CARMEN — public.usuarios
  INSERT INTO public.usuarios (id, clinica_id, nombre, email, rol, activo)
  VALUES (v_carmen_id, v_clinica_id, 'Carmen', 'carmen@lumiere.com', 'paciente', true)
  ON CONFLICT (id) DO NOTHING;

  -- 2d. CARMEN — public.pacientes
  INSERT INTO public.pacientes (
    id, clinica_id, medico_id,
    nombre, apellido, email,
    tipo_piel, alergias, motivo_consulta,
    riesgo, total_visitas,
    rgpd_aceptado, marketing_aceptado,
    genero
  ) VALUES (
    v_carmen_id, v_clinica_id, v_medico_id,
    'Carmen', 'López', 'carmen@lumiere.com',
    'Seca', 'Penicilina',
    'Flacidez facial y manchas de edad',
    'moderado', 7,
    true, false,
    'Mujer'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Carmen López creada con id %', v_carmen_id;

END $$;
