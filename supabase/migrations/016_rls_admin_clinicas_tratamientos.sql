-- ════════════════════════════════════════════════════════════════════
--  RLS: admin puede actualizar su clínica y gestionar tratamientos
--  Usa subquery a la tabla usuarios en lugar de JWT app_metadata
--  para evitar fallos cuando el token no lleva clinica_id.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Clínicas: UPDATE para admin ──────────────────────────────
drop policy if exists "clinicas_propia_edicion"    on public.clinicas;
drop policy if exists "admin_actualiza_clinica"    on public.clinicas;

create policy "admin_actualiza_clinica" on public.clinicas
  for update to authenticated
  using (
    id in (
      select clinica_id from public.usuarios
      where usuarios.id = auth.uid()
        and usuarios.rol = 'admin'
    )
  )
  with check (
    id in (
      select clinica_id from public.usuarios
      where usuarios.id = auth.uid()
        and usuarios.rol = 'admin'
    )
  );


-- ── 2. Tratamientos: ALL para admin de la clínica ───────────────
drop policy if exists "tratamientos_acceso"         on public.tratamientos;
drop policy if exists "admin_gestiona_tratamientos" on public.tratamientos;

create policy "admin_gestiona_tratamientos" on public.tratamientos
  for all to authenticated
  using (
    clinica_id in (
      select clinica_id from public.usuarios
      where usuarios.id = auth.uid()
        and usuarios.rol = 'admin'
    )
  )
  with check (
    clinica_id in (
      select clinica_id from public.usuarios
      where usuarios.id = auth.uid()
        and usuarios.rol = 'admin'
    )
  );
