-- Cuota diaria de la IA (Edge Function `ai-routine`): una fila por usuario y día con el número de
-- llamadas. Solo la toca la función con la clave secreta (service role); la app no la lee ni la escribe.
-- No guarda el contenido de las solicitudes. Idempotente: se puede ejecutar más de una vez.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Día en Colombia (UTC−5): la cuota se reinicia a la medianoche local.
  day date not null,
  calls integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);

-- RLS activado y sin políticas: ningún rol de la app (anon / authenticated) puede leerla ni escribirla.
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Suma una llamada de forma atómica si cabe en el límite. Devuelve el total del día o null si ya
-- estaba agotado (el `where` del upsert impide pasar el límite aunque lleguen llamadas a la vez).
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calls integer;
begin
  if p_limit is null or p_limit <= 0 then
    return null;
  end if;

  insert into public.ai_usage as usage (user_id, day, calls)
  values (p_user_id, (now() at time zone 'America/Bogota')::date, 1)
  on conflict (user_id, day) do update
    set calls = usage.calls + 1
    where usage.calls < p_limit
  returning usage.calls into v_calls;

  return v_calls;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;
