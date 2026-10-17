import type { HomeNetworkRepository } from '@/db/repositories/home-network.repository';
import type { ItemRepository } from '@/db/repositories/item.repository';
import type { TriggerRepository } from '@/db/repositories/trigger.repository';
import { fromTriggerRow } from '@/features/triggers/trigger.mapping';
import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';
import type { Routine } from '@/shared/types/routine.types';

import { DEFAULT_ITEM_KIND, isItemKind } from './item-kinds';
import type { RoutineOriginal } from './routine-edit.service';
import type { ItemDraft, RoutineDraft } from './routines.types';

export interface RoutineLoadDeps {
  items: Pick<ItemRepository, 'getByRoutine'>;
  triggers: Pick<TriggerRepository, 'getByRoutine'>;
  homeNetworks: Pick<HomeNetworkRepository, 'getAll'>;
}

export interface LoadedRoutine {
  /** Nombre, ícono e ítems para precargar P04. */
  draft: RoutineDraft;
  /** Avisos guardados; su clave es el id de la fila. */
  triggers: TriggerDraftEntry[];
  original: RoutineOriginal;
}

/** Todo lo de una rutina guardada, en la forma que usa el formulario de P04. */
export async function loadRoutineForEdit(deps: RoutineLoadDeps, routine: Routine): Promise<LoadedRoutine> {
  const [items, triggers, networks] = await Promise.all([
    deps.items.getByRoutine(routine.id),
    deps.triggers.getByRoutine(routine.id),
    deps.homeNetworks.getAll(),
  ]);

  const itemDrafts: ItemDraft[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    kind: isItemKind(item.type) ? item.type : DEFAULT_ITEM_KIND,
    critical: item.critical,
  }));

  const networksById = new Map(networks.map((network) => [network.id, network]));
  // Una fila que no se puede interpretar no se muestra ni se toca al guardar (no entra en `original`).
  const triggerEntries = triggers.flatMap((trigger) => {
    const draft = fromTriggerRow(trigger, networksById);
    return draft ? [{ ...draft, key: trigger.id }] : [];
  });

  return {
    draft: { name: routine.name, icon: routine.icon ?? undefined, color: routine.color ?? undefined, items: itemDrafts },
    triggers: triggerEntries,
    original: { itemIds: items.map((item) => item.id), triggerIds: triggerEntries.map((entry) => entry.key) },
  };
}
