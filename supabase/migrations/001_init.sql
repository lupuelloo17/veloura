-- ─────────────────────────────────────────────────────────────
--  GlowAI — Esquema multi-tenant
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Extensión UUID
create extension if not exists "pgcrypto";

-- ── Enum de planes ────────────────────────────────────────────
create type plan_tipo as enum ('esencial', 'premium', 'elite');

-- ── Enum de nivel de riesgo ───────────────────────────────────
create type nivel_riesgo_tipo as enum ('bajo', 'moderado', 'alto');

-- ─────────────────────────────────────────────────────────────
--  TABLA: clinicas
-- ─────────────────────────────────────────────────────────────
create table clinicas (
  id                uuid        primary key default gen_random_uuid(),
  nombre            text        not null,
  slug              text        not null unique,
  logo_url          text,
  color_primario    text        not null default '#E8A0B0',
  plan              plan_tipo   not null default 'esencial',
  plan_activo       boolean     not null default true,
  fecha_inicio      timestamptz not null default now(),
  fecha_renovacion  timestamptz,
  max_pacientes     int         not null default 100,
  max_medicos       int         not null default 1,
  ciudad            text,
  pais              text        not null default 'Colombia',
  creado_en         timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
--  TABLA: medicos
-- ─────────────────────────────────────────────────────────────
create table medicos (
  id            uuid    primary key default gen_random_uuid(),
  clinica_id    uuid    not null references clinicas(id) on delete cascade,
  nombre        text    not null,
  especialidad  text,
  email         text    not null,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);
create index on medicos(clinica_id);

-- ─────────────────────────────────────────────────────────────
--  TABLA: pacientes
-- ─────────────────────────────────────────────────────────────
create table pacientes (
  id               uuid  primary key default gen_random_uuid(),
  clinica_id       uuid  not null references clinicas(id) on delete cascade,
  medico_id        uuid  references medicos(id) on delete set null,
  nombre           text  not null,
  apellido         text  not null,
  email            text,
  telefono         text,
  fecha_nacimiento date,
  foto_perfil_url  text,
  creado_en        timestamptz not null default now()
);
create index on pacientes(clinica_id);
create index on pacientes(medico_id);

-- ─────────────────────────────────────────────────────────────
--  TABLA: sesiones
-- ─────────────────────────────────────────────────────────────
create table sesiones (
  id                       uuid    primary key default gen_random_uuid(),
  paciente_id              uuid    not null references pacientes(id) on delete cascade,
  clinica_id               uuid    not null references clinicas(id) on delete cascade,
  medico_id                uuid    references medicos(id) on delete set null,
  tipo_tratamiento         text    not null,
  fecha                    timestamptz not null default now(),
  notas_clinicas           text,
  fotos_antes              text[]  default '{}',
  fotos_despues            text[]  default '{}',
  productos_recomendados   text[]  default '{}',
  puntuacion_dermoscopica  int,
  creado_en                timestamptz not null default now()
);
create index on sesiones(clinica_id);
create index on sesiones(paciente_id);

-- ─────────────────────────────────────────────────────────────
--  TABLA: analisis_dermoscopicos
-- ─────────────────────────────────────────────────────────────
create table analisis_dermoscopicos (
  id               uuid              primary key default gen_random_uuid(),
  paciente_id      uuid              not null references pacientes(id) on delete cascade,
  clinica_id       uuid              not null references clinicas(id) on delete cascade,
  fecha            timestamptz       not null default now(),
  imagen_url       text,
  criterios        jsonb             not null default '{}',
  puntuacion_total int               not null default 0,
  nivel_riesgo     nivel_riesgo_tipo not null default 'bajo',
  recomendaciones  text[]            default '{}',
  creado_en        timestamptz       not null default now()
);
create index on analisis_dermoscopicos(clinica_id);
create index on analisis_dermoscopicos(paciente_id);

-- ─────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table clinicas               enable row level security;
alter table medicos                enable row level security;
alter table pacientes              enable row level security;
alter table sesiones               enable row level security;
alter table analisis_dermoscopicos enable row level security;

-- clinicas: cada usuario autenticado ve solo su clínica
create policy "clinica_propia"
  on clinicas for all
  using (id::text = (auth.jwt() ->> 'clinica_id'));

-- medicos
create policy "medicos_de_clinica"
  on medicos for all
  using (clinica_id::text = (auth.jwt() ->> 'clinica_id'));

-- pacientes
create policy "pacientes_de_clinica"
  on pacientes for all
  using (clinica_id::text = (auth.jwt() ->> 'clinica_id'));

-- sesiones
create policy "sesiones_de_clinica"
  on sesiones for all
  using (clinica_id::text = (auth.jwt() ->> 'clinica_id'));

-- análisis dermoscópicos
create policy "analisis_de_clinica"
  on analisis_dermoscopicos for all
  using (clinica_id::text = (auth.jwt() ->> 'clinica_id'));

-- ─────────────────────────────────────────────────────────────
--  DATOS SEMILLA — Clínica Lumière (demo)
-- ─────────────────────────────────────────────────────────────
insert into clinicas (nombre, slug, color_primario, plan, plan_activo, max_pacientes, max_medicos, ciudad, pais, fecha_renovacion)
values (
  'Clínica Lumière',
  'clinica-lumiere',
  '#E8A0B0',
  'premium',
  true,
  300,
  4,
  'Bogotá',
  'Colombia',
  now() + interval '1 year'
);
