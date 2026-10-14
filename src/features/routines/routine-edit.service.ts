import type { ItemRepository } from '@/db/repositories/item.repository';
import type { RoutineRepository } from '@/db/repositories/routine.repository';
import { syncRoutineTriggers, type TriggerServiceDeps } from '@/features/triggers/trigger.service';
import type { Routine } from '@/shared/types/routine.types';

import type { RoutineDraft } from './routines.types';

export interface RoutineEditDeps extends TriggerServiceDeps {
  routines: Pick<RoutineRepository, 'update'>;
  items: Pick<ItemRepository, 'create' | 'update' | 'delete'>;
}

/** Lo que había guardado al abrir la edición: sirve para saber qué se quitó. */
export interface RoutineOriginal {
  itemIds: string[];
  triggerIds: string[];
}

/**
 * Guarda una rutina editada (UPDATE). Ítems y avisos se igualan por diferencia con lo original:
 * los que tienen id se actualizan, los nuevos se crean y los que faltan se borran.
 * Asume que el borrador ya fue validado. No es atómico (PostgREST no da transacciones entre
 * tablas): ante un fallo se relanza el error y el formulario conserva lo escrito. Reintentar
 * corrige lo actualizado y lo borrado, pero un ítem o aviso nuevo creado antes del fallo
 * puede quedar duplicado.
 */
export async function updateRoutineWithItems(
  deps: RoutineEditDeps,
  routineId: string,
  draft: RoutineDraft,
  original: RoutineOriginal,
): Promise<Routine> {
  const routine = await deps.routines.update(routineId, { name: draft.name.trim(), icon: draft.icon });

  const keptItems = new Set(draft.items.flatMap((item) => (item.id ? [item.id] : [])));
  await Promise.all(original.itemIds.filter((id) => !keptItems.has(id)).map((id) => deps.items.delete(id)));

  await Promise.all(
    draft.items.map((item, sortOrder) => {
      const changes = { label: item.label.trim(), type: item.kind, critical: item.critical, sortOrder };
      return item.id ? deps.items.update(item.id, changes) : deps.items.create({ routineId, ...changes });
    }),
  );

  const originalTriggers = new Set(original.triggerIds);
  await syncRoutineTriggers(
    deps,
    routineId,
    (draft.triggers ?? []).map((trigger) => ({
      // En edición, la clave de un aviso ya guardado es su id en la base de datos.
      id: originalTriggers.has(trigger.key) ? trigger.key : null,
      draft: trigger,
    })),
    original.triggerIds,
  );

  return routine;
}
