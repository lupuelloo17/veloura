-- ═══════════════════════════════════════════════════════════════════
--  GlowAI — Fix RLS policies
--  Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Fix usuarios (infinite recursion) ───────────────────────────
-- La política anterior hacía SELECT FROM usuarios dentro de usuarios
-- → bucle infinito. La nueva solo compara auth.uid() = id.
DROP POLICY IF EXISTS "usuario_ve_su_clinica"  ON usuarios;
DROP POLICY IF EXISTS "usuarios_propios"        ON usuarios;

CREATE POLICY "usuarios_propios" ON usuarios
  FOR ALL
  USING (auth.uid() = id);

-- ── 2. Fix clinicas — permitir lectura por slug sin autenticación ──
-- La clínica se carga ANTES del login (para mostrar el color/logo).
-- La query de negocio sensible sigue protegida por las otras tablas.
DROP POLICY IF EXISTS "clinicas_propias" ON clinicas;

-- Lectura pública por slug (nombre, colores, plan) — no datos sensibles
CREATE POLICY "clinicas_lectura_publica" ON clinicas
  FOR SELECT
  USING (true);

-- Modificación solo para usuarios autenticados de esa clínica
CREATE POLICY "clinicas_edicion_propia" ON clinicas
  FOR ALL
  TO authenticated
  USING (
    id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid())
  );

-- ── 3. Fix otras tablas — misma subquery sobre usuarios ────────────
-- Ahora usuarios tiene política no-recursiva → estas son seguras.

DROP POLICY IF EXISTS "medicos_de_clinica"   ON medicos;
DROP POLICY IF EXISTS "pacientes_de_clinica" ON pacientes;
DROP POLICY IF EXISTS "citas_de_clinica"     ON citas;
DROP POLICY IF EXISTS "sesiones_de_clinica"  ON sesiones;
DROP POLICY IF EXISTS "analisis_de_clinica"  ON analisis_dermoscopicos;

CREATE POLICY "medicos_de_clinica" ON medicos
  FOR ALL TO authenticated
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "pacientes_de_clinica" ON pacientes
  FOR ALL TO authenticated
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "citas_de_clinica" ON citas
  FOR ALL TO authenticated
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "sesiones_de_clinica" ON sesiones
  FOR ALL TO authenticated
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "analisis_de_clinica" ON analisis_dermoscopicos
  FOR ALL TO authenticated
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));
