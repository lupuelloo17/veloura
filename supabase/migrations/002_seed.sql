-- ─────────────────────────────────────────────────────────────
--  GlowAI — Seed data + tabla de usuarios con roles
--  Requiere ejecutar 001_init.sql primero
-- ─────────────────────────────────────────────────────────────

-- ── Tabla de usuarios con roles ───────────────────────────────
-- Vincula auth.users de Supabase con clínica y rol
create table if not exists usuarios (
  id          uuid    primary key references auth.users(id) on delete cascade,
  clinica_id  uuid    not null references clinicas(id) on delete cascade,
  nombre      text    not null,
  rol         text    not null check (rol in ('admin', 'medico', 'recepcion')),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
create index if not exists on usuarios(clinica_id);
create index if not exists on usuarios(rol);

alter table usuarios enable row level security;
create policy "usuario_ve_su_clinica"
  on usuarios for all
  using (clinica_id::text = (auth.jwt() ->> 'clinica_id'));

-- ─────────────────────────────────────────────────────────────
--  SEED: Clínica Lumière (actualiza si ya existe)
-- ─────────────────────────────────────────────────────────────
insert into clinicas (nombre, slug, color_primario, plan, plan_activo, max_pacientes, max_medicos, ciudad, pais, fecha_renovacion)
values (
  'Clínica Lumière', 'clinica-lumiere', '#C8A882',
  'premium', true, 300, 4, 'Bogotá', 'Colombia',
  now() + interval '1 year'
)
on conflict (slug) do update set
  color_primario   = excluded.color_primario,
  plan             = excluded.plan,
  plan_activo      = excluded.plan_activo,
  max_pacientes    = excluded.max_pacientes,
  max_medicos      = excluded.max_medicos;

-- ─────────────────────────────────────────────────────────────
--  SEED: Médico
-- ─────────────────────────────────────────────────────────────
-- Inserta en medicos (el auth.user se crea vía Supabase Dashboard
-- o con el script de Node al final de este archivo)
with cli as (select id from clinicas where slug = 'clinica-lumiere')
insert into medicos (clinica_id, nombre, especialidad, email, activo)
select cli.id, 'Dra. García', 'Medicina Estética', 'dra.garcia@lumiere.com', true
from cli
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
--  SEED: Pacientes
-- ─────────────────────────────────────────────────────────────
with
  cli as (select id from clinicas where slug = 'clinica-lumiere'),
  med as (select id from medicos where email = 'dra.garcia@lumiere.com')
insert into pacientes
  (clinica_id, medico_id, nombre, apellido, email, telefono, fecha_nacimiento, foto_perfil_url)
select
  cli.id, med.id,
  'Valentina', 'Morales',
  'valentina.morales@email.com', '+57 310 555 0101',
  '1994-03-15',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face'
from cli, med
on conflict do nothing;

with
  cli as (select id from clinicas where slug = 'clinica-lumiere'),
  med as (select id from medicos where email = 'dra.garcia@lumiere.com')
insert into pacientes
  (clinica_id, medico_id, nombre, apellido, email, telefono, fecha_nacimiento, foto_perfil_url)
select
  cli.id, med.id,
  'Sofía', 'Restrepo',
  'sofia.restrepo@email.com', '+57 321 555 0202',
  '1990-07-22',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'
from cli, med
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
--  SEED: Sesiones de Valentina
-- ─────────────────────────────────────────────────────────────
with
  p1  as (select id from pacientes where email = 'valentina.morales@email.com'),
  cli as (select id from clinicas  where slug  = 'clinica-lumiere'),
  med as (select id from medicos   where email = 'dra.garcia@lumiere.com')
insert into sesiones (paciente_id, clinica_id, medico_id, tipo_tratamiento, fecha, notas_clinicas, productos_recomendados, puntuacion_dermoscopica)
values
  ((select id from p1), (select id from cli), (select id from med),
   'Peeling Enzimático', '2025-10-18 11:00:00+00',
   'Piel notablemente más uniforme. Reducción visible de poros en un 40%.',
   ARRAY['ZO Brightalive', 'SkinCeuticals C E Ferulic'], 3),
  ((select id from p1), (select id from cli), (select id from med),
   'Vitamina C + Ácido Hialurónico', '2025-09-05 10:00:00+00',
   'Mejora en tono y luminosidad. Ojeras menos pronunciadas.',
   ARRAY['Obagi Nu-Derm Clear Fx'], null);

-- ─────────────────────────────────────────────────────────────
--  SEED: Cita futura de Sofía
-- ─────────────────────────────────────────────────────────────
with
  p2  as (select id from pacientes where email = 'sofia.restrepo@email.com'),
  cli as (select id from clinicas  where slug  = 'clinica-lumiere'),
  med as (select id from medicos   where email = 'dra.garcia@lumiere.com')
insert into sesiones (paciente_id, clinica_id, medico_id, tipo_tratamiento, fecha, notas_clinicas)
values
  ((select id from p2), (select id from cli), (select id from med),
   'Consulta inicial + Dermoscopia', '2026-05-22 09:00:00+00',
   'Primera visita. Pendiente análisis dermoscópico.');

-- ─────────────────────────────────────────────────────────────
--  SEED: Análisis dermoscópico de Valentina
-- ─────────────────────────────────────────────────────────────
with
  p1  as (select id from pacientes where email = 'valentina.morales@email.com'),
  cli as (select id from clinicas  where slug  = 'clinica-lumiere')
insert into analisis_dermoscopicos
  (paciente_id, clinica_id, criterios, puntuacion_total, nivel_riesgo, recomendaciones)
values
  ((select id from p1), (select id from cli),
   '{"1":"absent","2":"absent","3":"uncertain","4":"absent","5":"present","6":"uncertain","7":"absent"}',
   3, 'moderado',
   ARRAY['Valoración presencial en 4-6 semanas', 'Fotoprotección SPF50+ diaria']);

-- ─────────────────────────────────────────────────────────────
--  CREAR USUARIOS AUTH (ejecutar con service_role desde Node/CLI)
-- ─────────────────────────────────────────────────────────────
-- Ejecutar este script Node.js UNA SOLA VEZ para crear los usuarios:
--
--   node supabase/create-demo-users.js
--
-- El archivo está en supabase/create-demo-users.js
-- ─────────────────────────────────────────────────────────────
