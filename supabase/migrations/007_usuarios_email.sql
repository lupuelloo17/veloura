-- ═══════════════════════════════════════════════════════════════════
--  GlowAI — Añadir email a tabla usuarios + seed emails
--  Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email text;

UPDATE usuarios SET email = 'admin@lumiere.com'       WHERE nombre = 'Administrador';
UPDATE usuarios SET email = 'dra.garcia@lumiere.com'  WHERE nombre = 'Dra. María García';
