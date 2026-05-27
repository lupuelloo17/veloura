-- ════════════════════════════════════════════════════════════════════════════
--  023_multitenancy_tenant_id.sql
--
--  Establece el patrón de Multi-tenancy explícito con tenant_id en Veloura.
--
--  Contexto:
--  ─────────
--  El proyecto ya usa clinica_id como identificador de tenant (via
--  app_metadata.clinica_id en el JWT). Esta migración introduce el claim
--  'tenant_id' como alias canónico del tenant, alineado con el estándar
--  multi-tenant de Supabase, y lo conecta al flujo existente mediante:
--
--    1. Función helper: get_tenant_id()
--       Resuelve el tenant del usuario actual desde el JWT con fallback:
--         a) auth.jwt() ->> 'tenant_id'          (claim directo / nuevo)
--         b) auth.jwt() -> 'app_metadata' ->> 'clinica_id'  (legado)
--
--    2. Columna notas_medicas en pacientes (campo solicitado, aún ausente).
--
--    3. Política RLS unificada en pacientes que soporta tenant_id + rol:
--         - paciente → solo ve su propia fila (id = auth.uid())
--         - staff    → ve todos los pacientes de su tenant
--
--    4. Guía de configuración: cómo emitir tenant_id en el JWT de Supabase.
--
--  NOTA: Las tablas clinicas y pacientes ya existen (migration 001).
--        Esta migración es puramente aditiva — no elimina ni modifica
--        columnas existentes.
--
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════


-- ── 0. Verificación de extensiones ───────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ════════════════════════════════════════════════════════════════════════════
--  REFERENCIA: Esquema de las tablas multi-tenant
--  (ya existen en producción — se documenta aquí para claridad)
-- ════════════════════════════════════════════════════════════════════════════

/*
  CREATE TABLE public.clinicas (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          text        NOT NULL,
    slug            text        NOT NULL UNIQUE,
    logo_url        text,
    color_primario  text        NOT NULL DEFAULT '#E8A0B0',
    plan            plan_tipo   NOT NULL DEFAULT 'esencial',
    plan_activo     boolean     NOT NULL DEFAULT true,
    max_pacientes   int         NOT NULL DEFAULT 100,
    max_medicos     int         NOT NULL DEFAULT 1,
    ciudad          text,
    pais            text        NOT NULL DEFAULT 'Colombia',
    creado_en       timestamptz NOT NULL DEFAULT now()
  );
  -- clinica.id  ←→  tenant_id en el JWT

  CREATE TABLE public.pacientes (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id      uuid        NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,  -- = tenant_id
    medico_id       uuid        REFERENCES medicos(id) ON DELETE SET NULL,
    nombre          text        NOT NULL,
    apellido        text        NOT NULL,
    email           text,
    telefono        text,
    notas_medicas   text,       -- ← añadido en esta migración
    fecha_nacimiento date,
    foto_perfil_url text,
    creado_en       timestamptz NOT NULL DEFAULT now()
  );
*/


-- ── 1. Añadir columna notas_medicas a pacientes ───────────────────────────────
alter table public.pacientes
  add column if not exists notas_medicas text;

comment on column public.pacientes.notas_medicas is
  'Notas clínicas privadas del paciente. Solo visible para staff de la clínica (tenant).';


-- ════════════════════════════════════════════════════════════════════════════
--  2. Helper: get_tenant_id()
--
--  Resuelve el tenant_id del usuario autenticado con doble fallback:
--    - Primero busca el claim 'tenant_id' en la raíz del JWT
--      (emitido por el hook after_sign_in / custom claims)
--    - Fallback al claim legado app_metadata.clinica_id
--
--  Uso en policies: get_tenant_id() = clinica_id::text
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.get_tenant_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'tenant_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'clinica_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
  );
$$;

comment on function public.get_tenant_id() is
  'Devuelve el tenant_id del JWT del usuario actual. '
  'Prioriza el claim tenant_id de primer nivel; '
  'cae al claim app_metadata.clinica_id si no existe.';


-- ════════════════════════════════════════════════════════════════════════════
--  3. Row Level Security — pacientes
--
--  Política unificada que soporta:
--    a) tenant_id en JWT (nuevo modelo)
--    b) app_metadata.clinica_id (modelo legado — fallback via get_tenant_id())
--    c) Separación por rol: pacientes ven solo sus datos; staff ve toda la clínica
-- ════════════════════════════════════════════════════════════════════════════

-- Habilitar RLS (idempotente si ya está activo)
alter table public.pacientes enable row level security;

-- Eliminar policies anteriores para reemplazarlas limpiamente
drop policy if exists "pacientes_de_clinica"    on public.pacientes;
drop policy if exists "pacientes_self_or_staff" on public.pacientes;
drop policy if exists "pacientes_tenant_id"     on public.pacientes;

-- ── 3a. SELECT: ver registros ──────────────────────────────────────────────
create policy "pacientes_tenant_select"
  on public.pacientes
  for select
  to authenticated
  using (
    case (auth.jwt() -> 'app_metadata' ->> 'rol')
      -- Paciente: solo ve SU propia fila
      when 'paciente'  then id = auth.uid()
      -- Staff: ve todos los pacientes de su tenant
      when 'admin'     then clinica_id::text = public.get_tenant_id()
      when 'medico'    then clinica_id::text = public.get_tenant_id()
      when 'recepcion' then clinica_id::text = public.get_tenant_id()
      -- Sin rol válido → sin acceso
      else false
    end
  );

-- ── 3b. INSERT: crear pacientes ────────────────────────────────────────────
create policy "pacientes_tenant_insert"
  on public.pacientes
  for insert
  to authenticated
  with check (
    -- Solo staff puede crear pacientes; el tenant debe coincidir
    (auth.jwt() -> 'app_metadata' ->> 'rol') in ('admin', 'medico', 'recepcion')
    and clinica_id::text = public.get_tenant_id()
  );

-- ── 3c. UPDATE: modificar pacientes ───────────────────────────────────────
create policy "pacientes_tenant_update"
  on public.pacientes
  for update
  to authenticated
  using (
    case (auth.jwt() -> 'app_metadata' ->> 'rol')
      -- Paciente: puede actualizar sus propios datos básicos
      when 'paciente'  then id = auth.uid()
      -- Staff: puede actualizar cualquier paciente del tenant
      when 'admin'     then clinica_id::text = public.get_tenant_id()
      when 'medico'    then clinica_id::text = public.get_tenant_id()
      when 'recepcion' then clinica_id::text = public.get_tenant_id()
      else false
    end
  )
  with check (
    case (auth.jwt() -> 'app_metadata' ->> 'rol')
      when 'paciente'  then id = auth.uid()
      when 'admin'     then clinica_id::text = public.get_tenant_id()
      when 'medico'    then clinica_id::text = public.get_tenant_id()
      when 'recepcion' then clinica_id::text = public.get_tenant_id()
      else false
    end
  );

-- ── 3d. DELETE: eliminar pacientes ─────────────────────────────────────────
create policy "pacientes_tenant_delete"
  on public.pacientes
  for delete
  to authenticated
  using (
    -- Solo admin puede eliminar pacientes
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
    and clinica_id::text = public.get_tenant_id()
  );


-- ════════════════════════════════════════════════════════════════════════════
--  4. RLS — clinicas
--
--  Cada usuario solo puede ver/editar la clínica a la que pertenece.
--  El admin puede actualizar datos de su clínica; nadie puede borrar.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.clinicas enable row level security;

drop policy if exists "clinica_propia"          on public.clinicas;
drop policy if exists "clinicas_tenant_select"  on public.clinicas;
drop policy if exists "clinicas_tenant_update"  on public.clinicas;

create policy "clinicas_tenant_select"
  on public.clinicas
  for select
  to authenticated
  using (
    id::text = public.get_tenant_id()
  );

create policy "clinicas_tenant_update"
  on public.clinicas
  for update
  to authenticated
  using (
    id::text = public.get_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
  )
  with check (
    id::text = public.get_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
  );


-- ════════════════════════════════════════════════════════════════════════════
--  5. Hook / Custom Claims — instrucciones para emitir tenant_id en el JWT
--
--  Para que auth.jwt() ->> 'tenant_id' funcione, necesitas configurar un
--  Custom Access Token Hook en Supabase que inyecte el claim. Ejemplo:
-- ════════════════════════════════════════════════════════════════════════════

/*
  ── Crear la función hook ────────────────────────────────────────────────────

  create or replace function public.custom_access_token_hook(event jsonb)
  returns jsonb
  language plpgsql
  stable
  security definer
  set search_path = public
  as $$
  declare
    v_clinica_id  text;
    v_rol         text;
    v_user_id     uuid;
    v_claims      jsonb;
  begin
    v_user_id := (event ->> 'user_id')::uuid;
    v_claims  := event -> 'claims';

    -- Obtener el tenant del usuario desde la tabla usuarios
    select u.clinica_id::text, u.rol
      into v_clinica_id, v_rol
      from public.usuarios u
     where u.id = v_user_id
     limit 1;

    -- Inyectar tenant_id como claim de primer nivel (nuevo modelo)
    v_claims := jsonb_set(v_claims, '{tenant_id}', to_jsonb(coalesce(v_clinica_id, '')));

    -- Mantener app_metadata.clinica_id para compatibilidad hacia atrás
    v_claims := jsonb_set(
      v_claims,
      '{app_metadata, clinica_id}',
      to_jsonb(coalesce(v_clinica_id, ''))
    );

    -- Inyectar rol
    v_claims := jsonb_set(
      v_claims,
      '{app_metadata, rol}',
      to_jsonb(coalesce(v_rol, ''))
    );

    return jsonb_set(event, '{claims}', v_claims);
  end;
  $$;

  -- Otorgar permisos al hook
  grant execute
    on function public.custom_access_token_hook
    to supabase_auth_admin;

  revoke execute
    on function public.custom_access_token_hook
    from authenticated, anon, public;

  ── En Supabase Dashboard ────────────────────────────────────────────────────
  Authentication → Hooks → Enable "Custom Access Token Hook"
  → Function: public.custom_access_token_hook

  Una vez activo, cada JWT contendrá:
  {
    "tenant_id": "uuid-de-la-clinica",    ← get_tenant_id() lo lee aquí primero
    "app_metadata": {
      "clinica_id": "uuid-de-la-clinica", ← fallback legado
      "rol": "admin | medico | recepcion | paciente"
    }
  }
*/


-- ════════════════════════════════════════════════════════════════════════════
--  6. Verificación post-migración
--
--  Ejecuta estas queries para confirmar que todo quedó bien:
-- ════════════════════════════════════════════════════════════════════════════

/*
  -- Ver columnas actuales de pacientes
  select column_name, data_type, is_nullable
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'pacientes'
   order by ordinal_position;

  -- Ver las políticas RLS activas en pacientes
  select policyname, cmd, roles, qual
    from pg_policies
   where schemaname = 'public'
     and tablename  = 'pacientes';

  -- Probar la función helper (como superuser, simula un JWT específico)
  select public.get_tenant_id();

  -- Confirmar que RLS está activo
  select tablename, rowsecurity
    from pg_tables
   where schemaname = 'public'
     and tablename in ('clinicas', 'pacientes');
*/
