import type { ItemRepository } from '@/db/repositories/item.repository';
import type { RoutineRepository } from '@/db/repositories/routine.repository';
import type { Routine } from '@/shared/types/routine.types';

import type { RoutineDraft } from './routines.types';

export interface RoutineServiceDeps {
  routines: RoutineRepository;
  items: ItemRepository;
}

/**
 * Crea la rutina y luego sus ítems (routine_id = rutina creada). Si algún ítem falla,
 * deshace lo creado para no dejar una rutina incompleta, y relanza el error.
 * Asume que el borrador ya fue validado.
 */
export async function createRoutineWithItems(deps: RoutineServiceDeps, draft: RoutineDraft): Promise<Routine> {
  const routine = await deps.routines.create({ name: draft.name.trim() });

  const results = await Promise.allSettled(
    draft.items.map((item, index) =>
      deps.items.create({
        routineId: routine.id,
        label: item.label.trim(),
        type: item.kind,
        critical: item.critical,
        sortOrder: index,
      }),
    ),
  );

  const failure = results.find((result) => result.status === 'rejected');
  if (failure) {
    const created = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    // Limpieza de mejor esfuerzo: el error que importa es el original.
    await Promise.allSettled(created.map((item) => deps.items.delete(item.id)));
    await deps.routines.delete(routine.id).catch(() => undefined);
    throw failure.reason;
  }

  return routine;
}
