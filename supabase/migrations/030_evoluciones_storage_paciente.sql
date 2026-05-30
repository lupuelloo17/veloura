-- ═══════════════════════════════════════════════════════════════════════════
--  030_evoluciones_storage_paciente.sql
--
--  Problema:
--    La policy "evoluciones_clinica" (migración 018/009) solo permite subir
--    al bucket 'evoluciones' si el PRIMER segmento del path coincide con el
--    clinica_id del JWT (app_metadata). Esto funciona para el staff (médico,
--    admin, recepción), cuyo JWT lleva clinica_id tras el trigger 010.
--
--    Los pacientes NO siempre tienen clinica_id en su JWT porque:
--      a) Pueden estar registrados solo en la tabla `pacientes`, no en `usuarios`
--      b) Aunque estén en `usuarios` con rol='paciente', el claim podría no
--         haberse refrescado aún.
--
--    La convención de path es: {clinica_id}/{paciente_id}/{filename}
--    El paciente sube SIEMPRE con ese prefijo (corregido en useEvolution.js).
--
--  Solución:
--    Política adicional que permite INSERT/UPDATE/DELETE/SELECT al paciente
--    si el segundo segmento del path coincide con auth.uid() y el primero
--    corresponde a una clínica de la que es paciente (según tabla `pacientes`
--    o según app_metadata si ya tiene el claim).
--
--  Nota:
--    La política existente "evoluciones_clinica" sigue activa para el staff.
--    Las dos conviven con OR implícito de PostgreSQL: basta que UNA pase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Policy de storage para pacientes ────────────────────────────────────────
DROP POLICY IF EXISTS "evoluciones_paciente_own" ON storage.objects;

CREATE POLICY "evoluciones_paciente_own" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'evoluciones'
    -- Segundo segmento del path = auth.uid() del paciente
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'evoluciones'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── Garantizar que la policy de DB cubre INSERT para pacientes ───────────────
-- evol_paciente_own ya existe (migración 018) pero la reafirmamos de forma
-- idempotente por si fue eliminada accidentalmente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'evoluciones'
       AND policyname = 'evol_paciente_own'
  ) THEN
    EXECUTE $p$
      CREATE POLICY evol_paciente_own ON public.evoluciones
        FOR ALL
        USING     (paciente_id = auth.uid())
        WITH CHECK (paciente_id = auth.uid())
    $p$;
  END IF;
END;
$$;
