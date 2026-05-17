-- ════════════════════════════════════════════════════════════════════
--  Fix: RLS de tratamientos — eliminar subquery recursiva a usuarios
-- ════════════════════════════════════════════════════════════════════
--
--  La policy original de migration 006 usaba:
--    (select clinica_id from usuarios where id = auth.uid()) = clinica_id
--
--  Ese patrón puede desencadenar recursión infinita si la tabla
--  usuarios tiene a su vez una policy que consulta tratamientos,
--  o si Postgres evalúa ambas en el mismo plan. El mismo problema
--  fue resuelto en migrations 008 y 011 para el resto de tablas.
--
--  Solución: leer clinica_id directamente desde app_metadata del JWT,
--  igual que hacen todas las demás policies del proyecto.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "tratamientos_clinica" on public.tratamientos;

create policy "tratamientos_acceso" on public.tratamientos
  for all to authenticated
  using (
    case (auth.jwt() -> 'app_metadata' ->> 'rol')
      when 'admin'     then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      when 'medico'    then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      when 'recepcion' then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      else false
    end
  )
  with check (
    case (auth.jwt() -> 'app_metadata' ->> 'rol')
      when 'admin'     then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      when 'medico'    then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      when 'recepcion' then clinica_id::text = (auth.jwt() -> 'app_metadata' ->> 'clinica_id')
      else false
    end
  );
