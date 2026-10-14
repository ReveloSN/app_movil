-- Esquema inicial de Verificador de Salida.
-- Reconstruido desde el código (src/db/repositories/*, validaciones y tipos): el proyecto anterior
-- no tenía migraciones en el repo. Ya incluye updated_at (Fase 2 del diseño offline-first).
-- Se ejecuta una sola vez, completo, en el SQL Editor de un proyecto vacío.

-- ─── Tablas ──────────────────────────────────────────────────────────────────

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  icon text,
  color text,
  active boolean not null default true,
  -- Lo actualiza el trigger de records (solo verificaciones completas).
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routines_user_id_idx on public.routines (user_id);

create table public.home_networks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) > 0),
  ssid text not null check (char_length(ssid) > 0),
  place text,
  updated_at timestamptz not null default now(),
  -- resolveNetwork reutiliza la red con el mismo SSID: nunca hay dos iguales por usuario.
  unique (user_id, ssid)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  label text not null check (char_length(label) > 0),
  icon text,
  type text check (type in ('carry', 'do', 'check')),
  critical boolean not null default false,
  note text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create index items_routine_id_idx on public.items (routine_id, sort_order);

create table public.triggers (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  type text not null check (type in ('schedule', 'wifi_exit', 'wifi_enter')),
  -- Hora local "HH:MM:SS".
  time time,
  -- 0 = domingo … 6 = sábado.
  days smallint[] check (days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  -- La app no deja borrar una red que usa un aviso: la base tampoco.
  network_id uuid references public.home_networks (id) on delete restrict,
  window_start time,
  window_end time,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create index triggers_routine_id_idx on public.triggers (routine_id);
create index triggers_network_id_idx on public.triggers (network_id);

create table public.records (
  -- Lo genera el cliente para que reintentar no duplique el registro.
  id uuid primary key default gen_random_uuid(),
  -- Borrar una rutina borra su historial (DC-01).
  routine_id uuid not null references public.routines (id) on delete cascade,
  date timestamptz not null default now(),
  result text not null check (result in ('completed', 'partial', 'skipped', 'no_response')),
  items_checked jsonb,
  duration_seconds integer check (duration_seconds >= 0)
);
create index records_routine_id_date_idx on public.records (routine_id, date desc);

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  do_not_disturb boolean not null default false,
  snooze_minutes integer not null default 5 check (snooze_minutes in (2, 5, 10)),
  sound boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Catálogo global (hoy la app usa sus plantillas locales; la tabla queda para el modelo de datos).
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  suggested_items jsonb not null default '[]'::jsonb,
  suggested_trigger text,
  category text
);

-- ─── Límites del modelo: ítems 1–12 y avisos 0–3 por rutina ──────────────────

create function public.enforce_routine_child_limit() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  max_rows integer := tg_argv[0]::integer;
  row_count integer;
begin
  execute format('select count(*) from public.%I where routine_id = $1', tg_table_name)
    into row_count
    using new.routine_id;
  if row_count > max_rows then
    raise exception 'Routine % exceeds % rows in %', new.routine_id, max_rows, tg_table_name
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create trigger items_limit after insert on public.items
  for each row execute function public.enforce_routine_child_limit('12');
create trigger triggers_limit after insert on public.triggers
  for each row execute function public.enforce_routine_child_limit('3');

-- ─── "Última vez" de la rutina: la app la muestra pero nunca la escribe ──────

create function public.touch_routine_last_completed() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.result = 'completed' then
    update public.routines
       set last_completed_at = new.date
     where id = new.routine_id
       and (last_completed_at is null or last_completed_at < new.date);
  end if;
  return null;
end;
$$;

create trigger records_touch_routine after insert on public.records
  for each row execute function public.touch_routine_last_completed();

-- ─── Seguridad (RLS): cada usuario, invitados incluidos, solo ve lo suyo ─────
-- Los invitados (inicio de sesión anónimo) también tienen el rol "authenticated".

alter table public.routines enable row level security;
alter table public.home_networks enable row level security;
alter table public.items enable row level security;
alter table public.triggers enable row level security;
alter table public.records enable row level security;
alter table public.settings enable row level security;
alter table public.templates enable row level security;

create policy "Owners manage their routines" on public.routines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage their home networks" on public.home_networks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage their settings" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage items of their routines" on public.items
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

create policy "Owners manage triggers of their routines" on public.triggers
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid()))
    and (
      network_id is null
      or exists (select 1 from public.home_networks n where n.id = network_id and n.user_id = (select auth.uid()))
    )
  );

create policy "Owners manage records of their routines" on public.records
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

create policy "Signed-in users read templates" on public.templates
  for select to authenticated
  using (true);

-- Acceso por la API (por si el proyecto no expone las tablas nuevas automáticamente).
grant select, insert, update, delete
  on public.routines, public.home_networks, public.items, public.triggers, public.records, public.settings
  to authenticated;
grant select on public.templates to authenticated;
