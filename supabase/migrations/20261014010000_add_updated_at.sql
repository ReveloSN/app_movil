-- §2.8 del diseño offline-first: hora del último cambio, puesta por el cliente (resolución de conflictos).
-- Idempotente: en un proyecto creado con 20261014000000_initial_schema.sql las columnas ya existen y no
-- cambia nada. Sirve para cualquier base creada con un esquema anterior.
-- Sin trigger que la sobrescriba: el valor es la hora del cambio en el dispositivo, no la de la sincronización.

alter table public.routines      add column if not exists updated_at timestamptz not null default now();
alter table public.items         add column if not exists updated_at timestamptz not null default now();
alter table public.triggers      add column if not exists updated_at timestamptz not null default now();
alter table public.home_networks add column if not exists updated_at timestamptz not null default now();
alter table public.settings      add column if not exists updated_at timestamptz not null default now();
