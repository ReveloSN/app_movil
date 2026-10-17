import type { CreateHomeNetworkInput, HomeNetwork } from '@/shared/types/home-network.types';
import type { CreateItemInput, Item } from '@/shared/types/item.types';
import type { CreateRoutineInput, Routine } from '@/shared/types/routine.types';
import type { CreateSettingsInput, Settings } from '@/shared/types/settings.types';
import type { CreateTriggerInput, Trigger } from '@/shared/types/trigger.types';

import type { LocalTableConfig } from './local.repository';

// Cada tabla local: dónde vive en el documento, sus valores por defecto (los mismos de la migración
// supabase/migrations/20261014000000_initial_schema.sql) y el orden del repositorio de Supabase.

export const routinesTable: LocalTableConfig<Routine, CreateRoutineInput> = {
  table: 'routines',
  select: (tables) => tables.routines,
  replace: (tables, routines) => ({ ...tables, routines }),
  idOf: (routine) => routine.id,
  build: (input, { id, userId, now }) => ({
    id,
    userId,
    name: input.name,
    icon: input.icon ?? null,
    color: input.color ?? null,
    active: input.active ?? true,
    lastCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  }),
  compare: (a, b) => a.createdAt.localeCompare(b.createdAt),
};

export const itemsTable: LocalTableConfig<Item, CreateItemInput> = {
  table: 'items',
  select: (tables) => tables.items,
  replace: (tables, items) => ({ ...tables, items }),
  idOf: (item) => item.id,
  build: (input, { id, now }) => ({
    id,
    routineId: input.routineId,
    label: input.label,
    icon: input.icon ?? null,
    type: input.type ?? null,
    critical: input.critical ?? false,
    note: input.note ?? null,
    sortOrder: input.sortOrder ?? 0,
    updatedAt: now,
  }),
  compare: (a, b) => a.sortOrder - b.sortOrder,
};

export const triggersTable: LocalTableConfig<Trigger, CreateTriggerInput> = {
  table: 'triggers',
  select: (tables) => tables.triggers,
  replace: (tables, triggers) => ({ ...tables, triggers }),
  idOf: (trigger) => trigger.id,
  build: (input, { id, now }) => ({
    id,
    routineId: input.routineId,
    type: input.type,
    time: input.time ?? null,
    days: input.days ?? null,
    networkId: input.networkId ?? null,
    windowStart: input.windowStart ?? null,
    windowEnd: input.windowEnd ?? null,
    active: input.active ?? true,
    updatedAt: now,
  }),
};

export const homeNetworksTable: LocalTableConfig<HomeNetwork, CreateHomeNetworkInput> = {
  table: 'homeNetworks',
  select: (tables) => tables.homeNetworks,
  replace: (tables, homeNetworks) => ({ ...tables, homeNetworks }),
  idOf: (network) => network.id,
  build: (input, { id, userId, now }) => ({
    id,
    userId,
    displayName: input.displayName,
    ssid: input.ssid,
    place: input.place ?? null,
    updatedAt: now,
  }),
  compare: (a, b) => a.displayName.localeCompare(b.displayName),
};

export const settingsTable: LocalTableConfig<Settings, CreateSettingsInput> = {
  table: 'settings',
  select: (tables) => tables.settings,
  replace: (tables, settings) => ({ ...tables, settings }),
  idOf: (settings) => settings.userId,
  rowId: (userId) => userId,
  build: (input, { userId, now }) => ({
    userId,
    doNotDisturb: input.doNotDisturb ?? false,
    snoozeMinutes: input.snoozeMinutes ?? 5,
    sound: input.sound ?? true,
    displayName: input.displayName ?? null,
    updatedAt: now,
  }),
};
