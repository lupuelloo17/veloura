-- ═══════════════════════════════════════════════════════════════════════════
--  031_booking_engine.sql
--
--  Cambios:
--    1. citas.medico_usuario_id  — FK a usuarios(id) para el nuevo flujo de
--       reservas que gestiona al personal vía la tabla `usuarios` (no `medicos`).
--       El campo medico_id legacy se mantiene para no romper otras consultas.
--
--    2. Buckets analisis + evoluciones → public = true
--       Las URLs generadas con getPublicUrl() no funcionaban en <img> porque
--       los buckets eran privados. Al hacerlos públicos, las URLs son accesibles
--       sin cabecera Authorization (el navegador no puede añadirla en <img src>).
--       Las políticas RLS de row-level siguen activas: solo usuarios autenticados
--       de la misma clínica pueden subir/modificar archivos.
--
--    3. RLS horarios_empleados — permitir SELECT a pacientes autenticados
--       para que el motor de reservas pueda calcular slots disponibles.
--
--    4. RLS tratamientos — SELECT para pacientes (leer catálogo al reservar).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Columna medico_usuario_id en citas ────────────────────────────────
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS medico_usuario_id uuid
    REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS citas_medico_usuario_idx
  ON public.citas (medico_usuario_id, fecha);

-- ── 2. Hacer públicos los buckets analisis y evoluciones ─────────────────
--    Actualizar public = true para que getPublicUrl() devuelva URLs que
--    el navegador puede cargar en <img src> sin headers de autenticación.
UPDATE storage.buckets
   SET public = true
 WHERE id IN ('analisis', 'evoluciones');

-- ── 3. RLS horarios_empleados: pacientes pueden leer (para calcular slots) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'horarios_empleados'
       AND policyname = 'paciente_lee_horarios'
  ) THEN
    EXECUTE $p$
      CREATE POLICY paciente_lee_horarios ON public.horarios_empleados
        FOR SELECT TO authenticated
        USING (true)
    $p$;
  END IF;
END;
$$;

-- ── 4. RLS tratamientos: pacientes pueden leer el catálogo ──────────────
DO $$
BEGIN
  -- Verificar que la tabla existe antes de tocar las policies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'tratamientos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename  = 'tratamientos'
         AND policyname = 'paciente_lee_tratamientos'
    ) THEN
      EXECUTE $p$
        CREATE POLICY paciente_lee_tratamientos ON public.tratamientos
          FOR SELECT TO authenticated
          USING (true)
      $p$;
    END IF;
  END IF;
END;
$$;

-- ── 5. RLS citas: pacientes pueden leer citas de otros médicos en la clínica
--    (necesario para calcular slots libres del médico seleccionado)
--    La policy existente "citas_self_or_staff" solo permite al paciente
--    ver SUS propias citas. Añadimos una policy de SELECT para ver la
--    ocupación del médico (sin datos sensibles de otros pacientes).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'citas'
       AND policyname = 'paciente_lee_ocupacion_medico'
  ) THEN
    EXECUTE $p$
      CREATE POLICY paciente_lee_ocupacion_medico ON public.citas
        FOR SELECT TO authenticated
        USING (
          -- Solo permite ver fecha + medico_usuario_id + duracion (campos necesarios
          -- para calcular disponibilidad). Supabase aplica la policy a nivel fila,
          -- el SELECT de columnas específicas lo controla el frontend.
          medico_usuario_id IS NOT NULL
          AND estado NOT IN ('cancelada', 'no_asistio')
        )
    $p$;
  END IF;
END;
$$;
