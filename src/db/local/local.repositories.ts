import type { HomeNetworkRepository } from '../repositories/home-network.repository';
import type { ItemRepository } from '../repositories/item.repository';
import type { RoutineRepository } from '../repositories/routine.repository';
import type { SettingsRepository } from '../repositories/settings.repository';
import type { TriggerRepository } from '../repositories/trigger.repository';
import type { VerificationRecordRepository } from '../repositories/verification-record.repository';
import type { CreateItemInput, Item, UpdateItemInput } from '@/shared/types/item.types';
import type { CreateTriggerInput, Trigger, UpdateTriggerInput } from '@/shared/types/trigger.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import type { PendingRecord, RowRef } from './local-document.types';
import { createLocalRepository, defaultLocalDeps, newOp, type LocalDeps } from './local.repository';
import type { LocalStore } from './local.store';
import { homeNetworksTable, itemsTable, routinesTable, settingsTable, triggersTable } from './local.tables';
import { enqueue, enqueueRoutineDeletion } from './outbox.compaction';

/** Lo que usa la app de cada tabla. Las verificaciones solo se crean (el historial sigue siendo remoto). */
export interface LocalRepositories {
  routines: RoutineRepository;
  items: ItemRepository;
  triggers: TriggerRepository;
  homeNetworks: HomeNetworkRepository;
  settings: SettingsRepository;
  records: Pick<VerificationRecordRepository, 'create' | 'deleteByRoutine'>;
}

/** Borra la rutina con sus ítems y avisos en el teléfono; en el servidor lo hará deleteRoutineCascade. */
function deleteRoutineLocally(store: LocalStore, routineId: string, deps: LocalDeps): Promise<void> {
  const now = deps.now();
  return store.update((doc) => {
    const { routines, items, triggers } = doc.tables;
    if (!routines.some((routine) => routine.id === routineId)) return { doc, result: undefined };
    const ofRoutine = (row: { routineId: string }) => row.routineId === routineId;
    const children: RowRef[] = [
      ...items.filter(ofRoutine).map((item) => ({ table: 'items' as const, id: item.id })),
      ...triggers.filter(ofRoutine).map((trigger) => ({ table: 'triggers' as const, id: trigger.id })),
    ];
    const tables = {
      ...doc.tables,
      routines: routines.filter((routine) => routine.id !== routineId),
      items: items.filter((item) => !ofRoutine(item)),
      triggers: triggers.filter((trigger) => !ofRoutine(trigger)),
    };
    const outbox = enqueueRoutineDeletion(doc.outbox, newOp({ kind: 'deleteRoutine', id: routineId }, now, deps), children);
    return { doc: { ...doc, tables, outbox }, result: undefined };
  });
}

/** Las verificaciones no se guardan como tabla local: van directo a la outbox (antes, pendingSync). */
function createRecordsOutbox(store: LocalStore, deps: LocalDeps): LocalRepositories['records'] {
  return {
    async create(input): Promise<VerificationRecord> {
      const now = deps.now();
      // La fecha se fija aquí: si la pusiera el servidor, sería la de la sincronización.
      const record: PendingRecord = { ...input, id: input.id ?? deps.newId(), date: input.date ?? now };
      const op = newOp({ kind: 'insertRecord', record }, record.date ?? now, deps);
      const completedAt = record.result === 'completed' ? (record.date ?? now) : null;
      await store.update((doc) => {
        const outbox = enqueue(doc.outbox, op);
        if (!completedAt) return { doc: { ...doc, outbox }, result: undefined };
        // "Última vez" se ve al instante, como lo hará el trigger del servidor (solo completas). No se encola:
        // last_completed_at lo pone el servidor y la próxima bajada lo confirma.
        const routines = doc.tables.routines.map((routine) =>
          routine.id === record.routineId &&
          (!routine.lastCompletedAt || Date.parse(routine.lastCompletedAt) < Date.parse(completedAt))
            ? { ...routine, lastCompletedAt: completedAt }
            : routine,
        );
        return { doc: { ...doc, tables: { ...doc.tables, routines }, outbox }, result: undefined };
      });
      return {
        id: record.id,
        routineId: record.routineId,
        date: record.date ?? now,
        result: record.result,
        itemsChecked: record.itemsChecked ?? null,
        durationSeconds: record.durationSeconds ?? null,
      };
    },

    // Solo quedan por quitar las verificaciones aún sin subir: las del servidor las borra la cascada.
    deleteByRoutine: (routineId) =>
      store.update((doc) => ({
        doc: {
          ...doc,
          outbox: doc.outbox.filter((op) => !(op.kind === 'insertRecord' && op.record.routineId === routineId)),
        },
        result: undefined,
      })),
  };
}

/** Repositorios de un usuario sobre su copia local. Los servicios los usan igual que a los de Supabase. */
export function createLocalRepositories(store: LocalStore, deps: LocalDeps = defaultLocalDeps): LocalRepositories {
  const routines = createLocalRepository(store, routinesTable, deps);
  const items = createLocalRepository<Item, CreateItemInput, UpdateItemInput>(store, itemsTable, deps);
  const triggers = createLocalRepository<Trigger, CreateTriggerInput, UpdateTriggerInput>(store, triggersTable, deps);

  return {
    routines: { ...routines, delete: (id) => deleteRoutineLocally(store, id, deps) },
    items: {
      ...items,
      getByRoutine: (routineId) => items.listWhere('routineId', routineId),
      deleteByRoutine: (routineId) => items.deleteWhere('routineId', routineId),
    },
    triggers: {
      ...triggers,
      getByRoutine: (routineId) => triggers.listWhere('routineId', routineId),
      deleteByRoutine: (routineId) => triggers.deleteWhere('routineId', routineId),
    },
    homeNetworks: createLocalRepository(store, homeNetworksTable, deps),
    settings: createLocalRepository(store, settingsTable, deps),
    records: createRecordsOutbox(store, deps),
  };
}
