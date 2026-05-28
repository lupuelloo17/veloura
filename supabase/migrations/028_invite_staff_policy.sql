-- ═══════════════════════════════════════════════════════════════════════════
--  028_invite_staff_policy.sql
--
--  Permite que la Edge Function `invite-staff` (que corre con service_role)
--  inserte filas en public.usuarios sin que RLS se lo impida.
--
--  Contexto:
--    El flujo de creación de personal pasó de un INSERT directo desde el
--    cliente a una Edge Function con service_role. Esto resuelve dos problemas:
--
--      1. usuarios.id es FK → auth.users(id) sin DEFAULT — no se puede crear
--         una fila en usuarios sin que exista antes el registro en auth.users.
--         La Edge Function llama a auth.admin.inviteUserByEmail() primero y
--         luego inserta en usuarios con el UUID devuelto.
--
--      2. La policy `usuarios_propios` (FOR ALL, id = auth.uid()) solo permite
--         que cada usuario gestione su propia fila — un admin no puede crear
--         una fila para otra persona desde el cliente.
--
--  Por qué service_role ignora RLS sin política extra:
--    En Supabase, el rol `service_role` tiene BYPASSRLS implícito en la
--    configuración del proyecto. Las Edge Functions ya usan ese privilegio
--    cuando se instancian con SUPABASE_SERVICE_ROLE_KEY.
--    Esta migración es por tanto documentación explícita + guardas opcionales.
--
--  Política adicional (por si acaso):
--    Creamos una policy explícita para el rol `service_role` que permite
--    INSERT y UPDATE irrestrictos — útil si el proyecto tiene BYPASSRLS
--    desactivado en versiones futuras o en entornos self-hosted.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Política de INSERT/UPDATE para service_role ──────────────────────────
-- (No tiene efecto en Supabase Cloud porque service_role ya bypasa RLS,
--  pero garantiza compatibilidad con setups self-hosted y Postgres puro)

DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'usuarios'
       AND policyname = 'service_role_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY service_role_insert ON public.usuarios
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $p$;
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'usuarios'
       AND policyname = 'service_role_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY service_role_update ON public.usuarios
        FOR UPDATE
        TO service_role
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;

  -- DELETE (para rollback en caso de error en la Edge Function)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'usuarios'
       AND policyname = 'service_role_delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY service_role_delete ON public.usuarios
        FOR DELETE
        TO service_role
        USING (true)
    $p$;
  END IF;
END;
$$;

-- ── Política SELECT para service_role (necesario para la verificación de admin) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'usuarios'
       AND policyname = 'service_role_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY service_role_select ON public.usuarios
        FOR SELECT
        TO service_role
        USING (true)
    $p$;
  END IF;
END;
$$;
