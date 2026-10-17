-- P11 / P03-1: nombre opcional de la persona para el saludo de Inicio ("Ajustes: nombre" en el modelo
-- de contenido). Nulo = sin nombre. Lo escribe el cliente como el resto de ajustes (outbox, "gana el
-- más reciente" con updated_at). Idempotente: se puede ejecutar más de una vez.

alter table public.settings add column if not exists display_name text;

alter table public.settings drop constraint if exists settings_display_name_length;
alter table public.settings
  add constraint settings_display_name_length
  check (display_name is null or char_length(display_name) between 1 and 24);
