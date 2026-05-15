-- ── Tabla de citas ─────────────────────────────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase

create type estado_cita as enum (
  'pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'
);

create table citas (
  id                        uuid primary key default gen_random_uuid(),
  clinica_id                uuid not null references clinicas(id) on delete cascade,
  paciente_id               uuid not null references pacientes(id) on delete cascade,
  medico_id                 uuid not null references usuarios(id),
  tratamiento               text not null,
  fecha                     timestamptz not null,
  duracion_minutos          int not null check (duracion_minutos in (30, 45, 60, 90, 120)),
  estado                    estado_cita not null default 'pendiente',
  notas_previas             text default '',
  recordatorio_24h_enviado  boolean not null default false,
  recordatorio_2h_enviado   boolean not null default false,
  creado_en                 timestamptz not null default now()
);

-- Índices para consultas frecuentes
create index citas_clinica_fecha    on citas(clinica_id, fecha);
create index citas_medico_fecha     on citas(medico_id, fecha);
create index citas_paciente_fecha   on citas(paciente_id, fecha);
create index citas_estado           on citas(estado);

-- RLS: solo usuarios de la misma clínica pueden ver/editar sus citas
alter table citas enable row level security;

create policy "Ver citas de la clínica"
  on citas for select
  using (
    clinica_id = (select clinica_id from usuarios where id = auth.uid())
  );

create policy "Crear citas en su clínica"
  on citas for insert
  with check (
    clinica_id = (select clinica_id from usuarios where id = auth.uid())
  );

create policy "Editar citas de su clínica"
  on citas for update
  using (
    clinica_id = (select clinica_id from usuarios where id = auth.uid())
  );
