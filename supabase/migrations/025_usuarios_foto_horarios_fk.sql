-- ============================================================
--  Migración 025 — foto en usuarios, RLS equipo, FK horarios
-- ============================================================
--
--  Problema 1: EquipoPage hace SELECT foto FROM usuarios pero la
--  columna foto nunca fue añadida a la tabla usuarios (sí existe en
--  medicos). PostgreSQL devuelve error 42703 → "No se pudo cargar
--  el equipo."
--
--  Problema 2: La política RLS "usuarios_propios" es FOR ALL con
--  USING (auth.uid() = id). Eso significa que un admin solo puede
--  leer SU PROPIA fila en usuarios, por lo que EquipoPage devuelve
--  siempre 0 empleados (o 1, el propio admin).
--
--  Problema 3: horarios_empleados.empleado_id tiene FK a usuarios(id).
--  ConfiguracionPage gestiona médicos desde la tabla medicos (IDs
--  distintos a usuarios). Al guardar horario con un medicos.id se
--  produce una violación de clave foránea.
--
--  Soluciones:
--  1. ADD COLUMN foto text  en usuarios.
--  2. Añadir policy de SELECT que permite a staff ver colegas de su
--     misma clínica usando el JWT claim 'clinica_id' (sin recursión).
--  3. DROP FK horarios_empleados_empleado_id_fkey (el campo se mantiene
--     uuid NOT NULL; el UNIQUE (empleado_id, dia_semana) se conserva).
-- ============================================================

-- ── 1. Columna foto en usuarios ───────────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto text;

-- ── 2. Garantizar activo y especialidad (idempotente respecto a 024) ─
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS activo       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS especialidad text;

-- ── 3. RLS: staff puede listar colegas de la misma clínica ────
--
--  La policy existente "usuarios_propios" (FOR ALL, USING auth.uid()=id)
--  sigue activa para INSERT/UPDATE/DELETE.
--  Añadimos una policy FOR SELECT con OR lógico (Postgres usa OR entre
--  políticas permisivas del mismo tipo): si el JWT dice que eres staff
--  de una clínica, ves a todos los usuarios de esa clínica.
DROP POLICY IF EXISTS "staff_ve_colegas" ON public.usuarios;

CREATE POLICY "staff_ve_colegas" ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    CASE (auth.jwt() -> 'app_metadata' ->> 'rol')
      WHEN 'admin'     THEN clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      WHEN 'medico'    THEN clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      WHEN 'recepcion' THEN clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      ELSE id = auth.uid()
    END
  );

-- ── 4. Eliminar FK de horarios_empleados → usuarios ───────────
--  Nombre autogenerado por PostgreSQL para el inline REFERENCES:
--  horarios_empleados_empleado_id_fkey.
--  La columna, el índice y el UNIQUE (empleado_id, dia_semana) quedan
--  intactos — solo se elimina la validación de clave foránea, lo que
--  permite usar tanto usuarios.id como medicos.id como empleado_id.
ALTER TABLE horarios_empleados
  DROP CONSTRAINT IF EXISTS horarios_empleados_empleado_id_fkey;
