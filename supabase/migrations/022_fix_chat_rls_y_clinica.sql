-- ═══════════════════════════════════════════════════════════════════════════
--  022_fix_chat_rls_y_clinica.sql
--
--  Fixes:
--  1. Mueve Ana y Carmen a la clínica correcta ('clinica-lumiere-Spa')
--     y actualiza su app_metadata vía el trigger existente.
--  2. Reemplaza las RLS de mensajes con políticas explícitas y correctas.
--
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Reasignar Ana y Carmen a la clínica correcta ──────────────────────
DO $$
DECLARE
  v_clinica_id uuid;
  v_medico_id  uuid;
BEGIN

  SELECT id INTO v_clinica_id
    FROM public.clinicas
   WHERE slug = 'clinica-lumiere-Spa'
   LIMIT 1;

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION
      'Clínica "clinica-lumiere-Spa" no encontrada. '
      'Ejecuta: SELECT id, slug FROM clinicas; y ajusta el slug aquí.';
  END IF;

  SELECT id INTO v_medico_id
    FROM public.usuarios
   WHERE clinica_id = v_clinica_id
     AND rol = 'medico'
   LIMIT 1;

  -- usuarios: el trigger sync_user_app_metadata se dispara al UPDATE
  -- y actualiza automáticamente auth.users.raw_app_meta_data
  UPDATE public.usuarios
     SET clinica_id = v_clinica_id
   WHERE email IN ('ana@lumiere.com', 'carmen@lumiere.com');

  -- pacientes: reasignar clínica y médico
  UPDATE public.pacientes
     SET clinica_id = v_clinica_id,
         medico_id  = v_medico_id
   WHERE email IN ('ana@lumiere.com', 'carmen@lumiere.com');

  RAISE NOTICE 'Clínica correcta: %', v_clinica_id;
  RAISE NOTICE 'Médico asignado:  %', COALESCE(v_medico_id::text, 'ninguno encontrado');

END $$;


-- ── 2. Reemplazar RLS de mensajes ─────────────────────────────────────────

-- Eliminar todas las policies existentes en mensajes
DROP POLICY IF EXISTS "msg_paciente_own"          ON public.mensajes;
DROP POLICY IF EXISTS "msg_staff_clinica"          ON public.mensajes;
DROP POLICY IF EXISTS "paciente_envia_mensajes"    ON public.mensajes;
DROP POLICY IF EXISTS "medico_envia_mensajes"      ON public.mensajes;
DROP POLICY IF EXISTS "usuarios_envian_mensajes"   ON public.mensajes;
DROP POLICY IF EXISTS "usuarios_leen_mensajes"     ON public.mensajes;
DROP POLICY IF EXISTS "mensajes_select"            ON public.mensajes;
DROP POLICY IF EXISTS "mensajes_insert"            ON public.mensajes;
DROP POLICY IF EXISTS "mensajes_update"            ON public.mensajes;


-- SELECT: ves los mensajes donde participas O eres staff de la clínica
CREATE POLICY "mensajes_select"
  ON public.mensajes FOR SELECT TO authenticated
  USING (
    remitente_id               = auth.uid()
    OR destinatario_id         = auth.uid()
    OR destinatario_usuario_id = auth.uid()
    OR clinica_id IN (
      SELECT clinica_id FROM public.usuarios
       WHERE id  = auth.uid()
         AND rol IN ('medico', 'admin', 'recepcion')
    )
  );


-- INSERT: solo puedes enviar mensajes con tu uid como remitente
CREATE POLICY "mensajes_insert"
  ON public.mensajes FOR INSERT TO authenticated
  WITH CHECK (remitente_id = auth.uid());


-- UPDATE: puedes marcar como leído si eres destinatario o staff de la clínica
CREATE POLICY "mensajes_update"
  ON public.mensajes FOR UPDATE TO authenticated
  USING (
    destinatario_id            = auth.uid()
    OR destinatario_usuario_id = auth.uid()
    OR clinica_id IN (
      SELECT clinica_id FROM public.usuarios
       WHERE id  = auth.uid()
         AND rol IN ('medico', 'admin', 'recepcion')
    )
  );
