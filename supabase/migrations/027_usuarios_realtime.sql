-- ═══════════════════════════════════════════════════════════════════════════
--  027_usuarios_realtime.sql
--
--  Activa Supabase Realtime sobre la tabla `usuarios` para que los
--  cambios en el equipo (INSERT / UPDATE / DELETE) se propaguen al
--  frontend de inmediato — sin necesidad de recargar la página.
--
--  Qué hace:
--    1. REPLICA IDENTITY FULL  →  los eventos Realtime incluyen la fila
--       completa (no solo el PK), lo que permite que los filtros del lado
--       del servidor (`clinica_id=eq.X`) funcionen de forma fiable.
--
--    2. ADD TABLE a la publicación  →  Supabase Realtime usa la publicación
--       `supabase_realtime` para decidir qué tablas emite. Sin esta línea
--       los canales supabase.channel() nunca recibirán eventos de `usuarios`.
--
--  Contexto de uso:
--    - EquipoPage.jsx  — supabase.channel(`equipo-${clinicaId}`)
--    - AgendaPage.jsx  — supabase.channel(`especialistas-${clinicaId}`)
--    Ambos filtran por `clinica_id=eq.{id}` en postgres_changes.
--
--  Nota de seguridad:
--    Realtime respeta las políticas RLS. Un usuario solo recibirá eventos
--    de filas que podría leer mediante SELECT ordinario (policy
--    `staff_ve_colegas` de la migración 025).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Replica identity completa para filtros server-side en Realtime
ALTER TABLE public.usuarios REPLICA IDENTITY FULL;

-- 2. Publicar la tabla en el canal Realtime de Supabase
--    (ALTER PUBLICATION ... ADD TABLE es idempotente en PostgreSQL 15+,
--     pero lo protegemos con DO para compatibilidad con versiones anteriores)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename  = 'usuarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios;
  END IF;
END;
$$;
