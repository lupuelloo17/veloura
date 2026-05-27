-- ============================================================
--  Migración 024 — Tabla horarios_empleados
--  Fase 2: Gestión de Personal y Horarios
-- ============================================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS horarios_empleados (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id      uuid        NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  clinica_id       uuid        NOT NULL REFERENCES clinicas(id)  ON DELETE CASCADE,
  dia_semana       smallint    NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=lunes … 6=domingo
  hora_inicio      time        NOT NULL,
  hora_fin         time        NOT NULL,
  tiempo_descanso  smallint    NOT NULL DEFAULT 0,  -- minutos
  activo           boolean     NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),

  -- Un único registro por empleado por día
  UNIQUE (empleado_id, dia_semana),

  -- Validación: hora_fin > hora_inicio
  CONSTRAINT chk_horario_valido CHECK (hora_fin > hora_inicio),

  -- Descanso razonable (0–240 min)
  CONSTRAINT chk_descanso CHECK (tiempo_descanso >= 0 AND tiempo_descanso <= 240)
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_horarios_empleado   ON horarios_empleados (empleado_id);
CREATE INDEX IF NOT EXISTS idx_horarios_clinica    ON horarios_empleados (clinica_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia        ON horarios_empleados (dia_semana);

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_horarios_updated_at ON horarios_empleados;
CREATE TRIGGER trg_horarios_updated_at
  BEFORE UPDATE ON horarios_empleados
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE horarios_empleados ENABLE ROW LEVEL SECURITY;

-- Staff de la misma clínica puede leer y gestionar todos los horarios
CREATE POLICY "staff_clinica_rw_horarios" ON horarios_empleados
  FOR ALL
  USING (
    clinica_id IN (
      SELECT clinica_id FROM usuarios WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinica_id IN (
      SELECT clinica_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- ── Columna 'activo' en usuarios (si no existe) ──────────────
-- La tabla usuarios puede no tener la columna 'activo' todavía.
-- La agregamos de forma idempotente.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS activo       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS especialidad text;

-- ── Columnas AI en analisis_dermoscopicos (pendiente sesión anterior) ──
-- Aplicar si aún no se ha hecho.
ALTER TABLE analisis_dermoscopicos
  ADD COLUMN IF NOT EXISTS diagnostico_preliminar       text,
  ADD COLUMN IF NOT EXISTS tipo_piel                    text,
  ADD COLUMN IF NOT EXISTS confianza                    text,
  ADD COLUMN IF NOT EXISTS requiere_atencion_urgente    boolean,
  ADD COLUMN IF NOT EXISTS alertas_detectadas           text[],
  ADD COLUMN IF NOT EXISTS recomendaciones_tratamiento  text[];
