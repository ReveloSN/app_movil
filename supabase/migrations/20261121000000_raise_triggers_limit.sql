-- Una rutina admite hasta 20 avisos (antes 3). Mismo límite que MAX_TRIGGERS en la app.
drop trigger triggers_limit on public.triggers;
create trigger triggers_limit after insert on public.triggers
  for each row execute function public.enforce_routine_child_limit('20');
