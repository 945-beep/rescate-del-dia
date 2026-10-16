-- Rescate del Día: estado privado de inventario por cuenta autenticada.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.
-- No contiene políticas para anon: visitantes no pueden leer ni escribir estos datos.

create table if not exists public.rescate_state (
  user_id uuid primary key references auth.users(id),
  payload jsonb not null default '{"inventory":[],"offers":[],"reservations":[],"movements":[],"demoStock":{}}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint rescate_state_payload_is_object check (jsonb_typeof(payload) = 'object')
);

alter table public.rescate_state enable row level security;

create policy "rescate_state_select_own"
  on public.rescate_state for select to authenticated
  using (user_id = auth.uid());

create policy "rescate_state_insert_own"
  on public.rescate_state for insert to authenticated
  with check (user_id = auth.uid());

create policy "rescate_state_update_own"
  on public.rescate_state for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.rescate_state to authenticated;
