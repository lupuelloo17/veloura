-- ═══════════════════════════════════════════════════════════════════
--  GlowAI — Migración completa España
--  Ejecutar en: Supabase Dashboard → SQL Editor → Run
--  Idempotente: seguro ejecutar varias veces
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensiones ────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums (ignorar si ya existen) ──────────────────────────────────
do $$ begin
  create type plan_tipo         as enum ('esencial', 'premium', 'elite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_riesgo_tipo as enum ('bajo', 'moderado', 'alto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_cita_tipo  as enum ('pendiente','confirmada','completada','cancelada','no_asistio');
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════════════
--  TABLA: clinicas
-- ════════════════════════════════════════════════════════════════════
create table if not exists clinicas (
  id               uuid        primary key default gen_random_uuid(),
  nombre           text        not null,
  slug             text        not null unique,
  logo_url         text,
  color_primario   text        not null default '#C8A882',
  plan             plan_tipo   not null default 'esencial',
  plan_activo      boolean     not null default true,
  max_pacientes    int         not null default 100,
  max_medicos      int         not null default 1,
  ciudad           text,
  pais             text        not null default 'España',
  direccion        text,
  email            text,
  telefono         text,
  fecha_renovacion timestamptz,
  creado_en        timestamptz not null default now()
);

-- Columnas añadidas en migración España (idempotentes)
alter table clinicas add column if not exists direccion  text;
alter table clinicas add column if not exists email      text;
alter table clinicas add column if not exists telefono   text;

-- ════════════════════════════════════════════════════════════════════
--  TABLA: medicos
-- ════════════════════════════════════════════════════════════════════
create table if not exists medicos (
  id           uuid    primary key default gen_random_uuid(),
  clinica_id   uuid    not null references clinicas(id) on delete cascade,
  nombre       text    not null,
  especialidad text,
  colegiado    text,
  email        text    not null unique,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);
create index if not exists medicos_clinica_idx on medicos(clinica_id);

alter table medicos add column if not exists colegiado text;

-- ════════════════════════════════════════════════════════════════════
--  TABLA: usuarios  (vincula auth.users con clínica y rol)
-- ════════════════════════════════════════════════════════════════════
create table if not exists usuarios (
  id          uuid    primary key references auth.users(id) on delete cascade,
  clinica_id  uuid    not null references clinicas(id) on delete cascade,
  nombre      text    not null,
  rol         text    not null check (rol in ('admin', 'medico', 'recepcion')),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
create index if not exists usuarios_clinica_idx on usuarios(clinica_id);
create index if not exists usuarios_rol_idx     on usuarios(rol);

-- ════════════════════════════════════════════════════════════════════
--  TABLA: pacientes
-- ════════════════════════════════════════════════════════════════════
create table if not exists pacientes (
  id                   uuid    primary key default gen_random_uuid(),
  clinica_id           uuid    not null references clinicas(id) on delete cascade,
  medico_id            uuid    references medicos(id) on delete set null,
  nombre               text    not null,
  apellido             text    not null,
  email                text,
  telefono             text,
  fecha_nacimiento     date,
  tipo_piel            text,
  alergias             text,
  medicamentos         text,
  motivo_consulta      text,
  tratamientos_previos text[]  default '{}',
  como_nos_conocio     text,
  rgpd_aceptado        boolean not null default false,
  rgpd_fecha           timestamptz,
  marketing_aceptado   boolean not null default false,
  riesgo               text    not null default 'bajo' check (riesgo in ('bajo','moderado','alto')),
  foto_perfil          text,
  total_visitas        int     not null default 0,
  ultima_visita        date,
  creado_en            timestamptz not null default now()
);
create index if not exists pacientes_clinica_idx on pacientes(clinica_id);
create index if not exists pacientes_medico_idx  on pacientes(medico_id);

-- Columnas en versiones anteriores del esquema
alter table pacientes add column if not exists tipo_piel            text;
alter table pacientes add column if not exists alergias             text;
alter table pacientes add column if not exists medicamentos         text;
alter table pacientes add column if not exists motivo_consulta      text;
alter table pacientes add column if not exists tratamientos_previos text[] default '{}';
alter table pacientes add column if not exists como_nos_conocio     text;
alter table pacientes add column if not exists rgpd_aceptado        boolean not null default false;
alter table pacientes add column if not exists rgpd_fecha           timestamptz;
alter table pacientes add column if not exists marketing_aceptado   boolean not null default false;
alter table pacientes add column if not exists riesgo               text    not null default 'bajo';
alter table pacientes add column if not exists foto_perfil          text;
alter table pacientes add column if not exists total_visitas        int not null default 0;
alter table pacientes add column if not exists ultima_visita        date;

-- ════════════════════════════════════════════════════════════════════
--  TABLA: citas
-- ════════════════════════════════════════════════════════════════════
create table if not exists citas (
  id                        uuid              primary key default gen_random_uuid(),
  clinica_id                uuid              not null references clinicas(id) on delete cascade,
  paciente_id               uuid              not null references pacientes(id) on delete cascade,
  medico_id                 uuid              references medicos(id) on delete set null,
  tratamiento               text              not null,
  precio                    numeric(10,2),
  fecha                     timestamptz       not null,
  duracion_minutos          int               not null default 30,
  estado                    estado_cita_tipo  not null default 'pendiente',
  notas_previas             text,
  recordatorio_24h_enviado  boolean           not null default false,
  recordatorio_2h_enviado   boolean           not null default false,
  creado_en                 timestamptz       not null default now()
);
create index if not exists citas_clinica_idx         on citas(clinica_id);
create index if not exists citas_paciente_idx        on citas(paciente_id);
create index if not exists citas_medico_fecha_idx    on citas(medico_id, fecha);

-- ════════════════════════════════════════════════════════════════════
--  TABLA: sesiones
-- ════════════════════════════════════════════════════════════════════
create table if not exists sesiones (
  id                      uuid    primary key default gen_random_uuid(),
  paciente_id             uuid    not null references pacientes(id) on delete cascade,
  clinica_id              uuid    not null references clinicas(id) on delete cascade,
  medico_id               uuid    references medicos(id) on delete set null,
  tipo_tratamiento        text    not null,
  fecha                   timestamptz not null default now(),
  notas_clinicas          text,
  fotos_antes             text[]  default '{}',
  fotos_despues           text[]  default '{}',
  productos_recomendados  text[]  default '{}',
  puntuacion_dermoscopica int,
  creado_en               timestamptz not null default now()
);
create index if not exists sesiones_clinica_idx   on sesiones(clinica_id);
create index if not exists sesiones_paciente_idx  on sesiones(paciente_id);

-- ════════════════════════════════════════════════════════════════════
--  TABLA: analisis_dermoscopicos
-- ════════════════════════════════════════════════════════════════════
create table if not exists analisis_dermoscopicos (
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
create index if not exists analisis_clinica_idx   on analisis_dermoscopicos(clinica_id);
create index if not exists analisis_paciente_idx  on analisis_dermoscopicos(paciente_id);

-- ════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
alter table clinicas               enable row level security;
alter table medicos                enable row level security;
alter table usuarios               enable row level security;
alter table pacientes              enable row level security;
alter table citas                  enable row level security;
alter table sesiones               enable row level security;
alter table analisis_dermoscopicos enable row level security;

-- Eliminar políticas previas (ignorar errores si no existen)
drop policy if exists "clinica_propia"            on clinicas;
drop policy if exists "medicos_de_clinica"        on medicos;
drop policy if exists "pacientes_de_clinica"      on pacientes;
drop policy if exists "sesiones_de_clinica"       on sesiones;
drop policy if exists "analisis_de_clinica"       on analisis_dermoscopicos;
drop policy if exists "usuario_ve_su_clinica"     on usuarios;
drop policy if exists "citas_de_clinica"          on citas;

-- ── Helper: clínica del usuario autenticado ───────────────────────
-- La política lee la tabla `usuarios` para obtener el clinica_id
-- del usuario logueado. No necesita JWT custom claims.

create policy "clinicas_propias"
  on clinicas for all to authenticated
  using (id in (select clinica_id from usuarios where id = auth.uid()));

create policy "medicos_de_clinica"
  on medicos for all to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

create policy "usuario_ve_su_clinica"
  on usuarios for select to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

create policy "pacientes_de_clinica"
  on pacientes for all to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

create policy "citas_de_clinica"
  on citas for all to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

create policy "sesiones_de_clinica"
  on sesiones for all to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

create policy "analisis_de_clinica"
  on analisis_dermoscopicos for all to authenticated
  using (clinica_id in (select clinica_id from usuarios where id = auth.uid()));

-- ════════════════════════════════════════════════════════════════════
--  SEED: Clínica Lumière Valencia
-- ════════════════════════════════════════════════════════════════════
insert into clinicas (nombre, slug, color_primario, plan, plan_activo, max_pacientes, max_medicos,
                      ciudad, pais, direccion, email, telefono, fecha_renovacion)
values (
  'Clínica Lumière Valencia', 'clinica-lumiere', '#C8A882',
  'premium', true, 300, 4,
  'Valencia', 'España', 'Calle Colón 12, 46004 Valencia',
  'info@clinicalumiere.es', '+34 963 123 456',
  now() + interval '1 year'
)
on conflict (slug) do update set
  nombre           = excluded.nombre,
  color_primario   = excluded.color_primario,
  plan             = excluded.plan,
  ciudad           = excluded.ciudad,
  pais             = excluded.pais,
  direccion        = excluded.direccion,
  email            = excluded.email,
  telefono         = excluded.telefono,
  fecha_renovacion = excluded.fecha_renovacion;

-- ════════════════════════════════════════════════════════════════════
--  SEED: Médico — Dra. María García
-- ════════════════════════════════════════════════════════════════════
with cli as (select id from clinicas where slug = 'clinica-lumiere')
insert into medicos (clinica_id, nombre, especialidad, colegiado, email, activo)
select cli.id, 'Dra. María García', 'Medicina Estética', '46-12345', 'dra.garcia@lumiere.com', true
from cli
on conflict (email) do update set
  nombre       = excluded.nombre,
  especialidad = excluded.especialidad,
  colegiado    = excluded.colegiado;

-- ════════════════════════════════════════════════════════════════════
--  SEED: Pacientes — 6 pacientes de Valencia
-- ════════════════════════════════════════════════════════════════════
-- Ana Martínez
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, total_visitas, ultima_visita)
select cli.id, med.id,
  'Ana', 'Martínez', 'ana.martinez@email.es', '+34 612 345 678',
  '1990-03-15', 'Mixta', 'Ninguna conocida', 'Ninguno',
  'Manchas solares y líneas de expresión',
  ARRAY['Radiofrecuencia'], 'Instagram',
  true, true, 'bajo', 6, '2025-11-12'
from cli, med
on conflict do nothing;

-- Carmen López
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, foto_perfil, total_visitas, ultima_visita)
select cli.id, med.id,
  'Carmen', 'López', 'carmen.lopez@email.es', '+34 698 765 432',
  '1985-07-22', 'Seca', 'Retinol en concentraciones altas', 'Anticonceptivos orales',
  'Flacidez facial y ojeras',
  ARRAY['Ácido hialurónico', 'Mesoterapia'], 'Recomendación',
  true, false, 'moderado',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  3, '2025-12-05'
from cli, med
on conflict do nothing;

-- María Fernández
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, total_visitas, ultima_visita)
select cli.id, med.id,
  'María', 'Fernández', 'maria.fdez@email.es', '+34 655 123 456',
  '1978-03-07', 'Grasa', 'Penicilina', 'Omeprazol',
  'Hiperpigmentación y poros dilatados',
  ARRAY['Peeling químico'], 'Google',
  true, true, 'alto', 9, '2026-01-18'
from cli, med
on conflict do nothing;

-- Laura Sánchez
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, total_visitas, ultima_visita)
select cli.id, med.id,
  'Laura', 'Sánchez', 'laura.sanchez@email.es', '+34 677 234 567',
  '1995-08-14', 'Sensible', 'Ninguna conocida', 'Ninguno',
  'Manchas por fotoenvejecimiento',
  ARRAY[]::text[], 'Instagram',
  true, false, 'bajo', 2, '2026-02-02'
from cli, med
on conflict do nothing;

-- Isabel Torres
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, total_visitas, ultima_visita)
select cli.id, med.id,
  'Isabel', 'Torres', 'isabel.torres@email.es', '+34 634 456 789',
  '1982-06-30', 'Normal', 'Látex', 'Ninguno',
  'Arrugas de expresión en frente',
  ARRAY['Toxina botulínica'], 'Recomendación',
  true, true, 'bajo', 5, '2026-03-14'
from cli, med
on conflict do nothing;

-- Patricia Ruiz
with cli as (select id from clinicas where slug = 'clinica-lumiere'),
     med as (select id from medicos  where email = 'dra.garcia@lumiere.com')
insert into pacientes (clinica_id, medico_id, nombre, apellido, email, telefono,
  fecha_nacimiento, tipo_piel, alergias, medicamentos, motivo_consulta,
  tratamientos_previos, como_nos_conocio, rgpd_aceptado, marketing_aceptado,
  riesgo, total_visitas, ultima_visita)
select cli.id, med.id,
  'Patricia', 'Ruiz', 'patricia.ruiz@email.es', '+34 612 789 012',
  '1993-01-19', 'Mixta', 'Ninguna conocida', 'Ninguno',
  'Manchas solares en frente y mejillas',
  ARRAY[]::text[], 'Instagram',
  true, true, 'moderado', 1, '2026-03-28'
from cli, med
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
--  SEED: Sesiones de Ana Martínez
-- ════════════════════════════════════════════════════════════════════
with
  p   as (select id from pacientes where email = 'ana.martinez@email.es'),
  cli as (select id from clinicas  where slug  = 'clinica-lumiere'),
  med as (select id from medicos   where email = 'dra.garcia@lumiere.com')
insert into sesiones (paciente_id, clinica_id, medico_id, tipo_tratamiento, fecha, notas_clinicas)
values
  ((select id from p),(select id from cli),(select id from med),
   'Radiofrecuencia facial', '2025-11-12 14:00:00+01',
   'Sesión 2 de 4. Piel sensible — potencia al 70 %.'),
  ((select id from p),(select id from cli),(select id from med),
   'Revisión y seguimiento', '2025-10-15 10:00:00+01',
   'Control post radiofrecuencia. Evolución favorable.'),
  ((select id from p),(select id from cli),(select id from med),
   'Consulta inicial', '2025-09-01 09:00:00+01',
   'Primera visita. Se planifica serie de radiofrecuencia.')
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
--  SEED: Sesiones de Carmen López
-- ════════════════════════════════════════════════════════════════════
with
  p   as (select id from pacientes where email = 'carmen.lopez@email.es'),
  cli as (select id from clinicas  where slug  = 'clinica-lumiere'),
  med as (select id from medicos   where email = 'dra.garcia@lumiere.com')
insert into sesiones (paciente_id, clinica_id, medico_id, tipo_tratamiento, fecha, notas_clinicas)
values
  ((select id from p),(select id from cli),(select id from med),
   'Mesoterapia facial', '2026-05-14 11:00:00+01',
   'Cóctel vitamínico C + ácido hialurónico. Zona periocular.'),
  ((select id from p),(select id from cli),(select id from med),
   'Consulta inicial', '2025-12-05 10:00:00+01',
   'Primera visita. Piel seca con ptosis palpebral leve.')
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
--  NOTA: Crear usuarios de autenticación
--  ─────────────────────────────────────
--  Los usuarios de login (admin@lumiere.com, dra.garcia@lumiere.com)
--  deben crearse en Supabase Dashboard → Authentication → Users →
--  "Invite user" o "Add user".
--
--  Después de crearlos, ejecutar este bloque sustituyendo los UUIDs
--  reales que aparecen en el dashboard:
--
--  insert into usuarios (id, clinica_id, nombre, rol) values
--    ('<UUID-admin>',    (select id from clinicas where slug='clinica-lumiere'), 'Administrador',    'admin'),
--    ('<UUID-dra-garcia',(select id from clinicas where slug='clinica-lumiere'), 'Dra. María García','medico');
-- ════════════════════════════════════════════════════════════════════
