-- ============================================================
--  Migración 026 — tipo_negocio en clinicas
-- ============================================================
--
--  Activa el sistema de verticales modulares de Veloura.
--  useVertical() ya lee clinica.tipo_negocio desde el contexto;
--  mientras la columna no existía caía al default 'medicina_estetica'.
--  Con esta migración cada clínica puede tener su propio vertical.
--
--  Valores válidos (definidos en src/config/verticals.js):
--    'medicina_estetica' | 'psicologia' | 'nutricion'
--    'odontologia'       | 'veterinaria'
-- ============================================================

ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS tipo_negocio text NOT NULL DEFAULT 'medicina_estetica';
