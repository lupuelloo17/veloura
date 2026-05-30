-- ═══════════════════════════════════════════════════════════════════════════
--  032_ultima_conexion.sql
--
--  Añade el campo ultima_conexion a public.usuarios para:
--    · Mostrar "• En línea" o "Conectado hace X min" en el chat del paciente
--    · Actualizar el timestamp cada vez que el usuario abre la app
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS ultima_conexion timestamptz;

-- Inicializar con now() para todos los usuarios existentes
UPDATE public.usuarios
   SET ultima_conexion = now()
 WHERE ultima_conexion IS NULL;

-- Índice para consultas de estado online (se filtra por fecha reciente)
CREATE INDEX IF NOT EXISTS idx_usuarios_ultima_conexion
  ON public.usuarios (ultima_conexion DESC);
