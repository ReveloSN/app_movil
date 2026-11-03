-- Esquema de datos v2:
-- 1. forgot_events: los olvidos ("Olvidé algo") dejan de vivir solo en el teléfono y se sincronizan.
--    Como records, no se editan: solo se insertan, con id generado por el cliente (reintentar no duplica).
-- 2. routines.kind: si la rutina es para salir ('departure') o para llegar ('arrival'). Lo escribe el
--    cliente como el resto de la rutina (outbox, "gana el más reciente" con updated_at).
-- Idempotente: se puede ejecutar más de una vez. No toca ai_usage.

-- ─── Olvidos ─────────────────────────────────────────────────────────────────

create table if not exists public.forgot_events (
  -- Lo genera el cliente para que reintentar no duplique el olvido.
  id uuid primary key,
  -- Borrar una rutina borra sus olvidos, como su historial.
  routine_id uuid not null references public.routines (id) on delete cascade,
  -- Verificación en la que se notó (si se anotó desde su resumen). Si se borra, el olvido se queda.
  record_id uuid references public.records (id) on delete set null,
  label text not null check (char_length(label) between 1 and 60),
  date timestamptz not null
);
create index if not exists forgot_events_routine_id_date_idx on public.forgot_events (routine_id, date desc);
create index if not exists forgot_events_record_id_idx on public.forgot_events (record_id);

alter table public.forgot_events enable row level security;

drop policy if exists "Owners manage forgot events of their routines" on public.forgot_events;
create policy "Owners manage forgot events of their routines" on public.forgot_events
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid()))
    and (
      record_id is null
      or exists (
        select 1 from public.records rec
          join public.routines r on r.id = rec.routine_id
         where rec.id = record_id and r.user_id = (select auth.uid())
      )
    )
  );

grant select, insert, update, delete on public.forgot_events to authenticated;

-- ─── Tipo de rutina ──────────────────────────────────────────────────────────

-- Las rutinas que ya existen eran todas de salida.
alter table public.routines add column if not exists kind text not null default 'departure';

alter table public.routines drop constraint if exists routines_kind_check;
alter table public.routines
  add constraint routines_kind_check
  check (kind in ('departure', 'arrival'));
