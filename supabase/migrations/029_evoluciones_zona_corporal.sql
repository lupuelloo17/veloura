-- ═══════════════════════════════════════════════════════════════════════════
--  029_evoluciones_zona_corporal.sql
--
--  Añade la columna zona_corporal a public.evoluciones para permitir:
--    · Agrupar fotos por zona (frente, mejillas, cuello, etc.)
--    · Comparar Antes/Después filtrando por la misma zona_corporal
--
--  Contexto:
--    La tabla evoluciones ya existe (migración 018) con los campos:
--    id, paciente_id, clinica_id, medico_id, tipo, foto_url,
--    tratamiento, fecha, notas, sesion_numero
--
--    zona_corporal es independiente de tratamiento: un mismo tratamiento
--    puede afectar varias zonas y viceversa. Ambas columnas coexisten.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.evoluciones
  ADD COLUMN IF NOT EXISTS zona_corporal text;

-- Índice parcial para acelerar la consulta de pares Antes/Después
-- agrupados por paciente + zona
CREATE INDEX IF NOT EXISTS idx_evoluciones_zona
  ON public.evoluciones (paciente_id, zona_corporal, tipo, fecha DESC);
