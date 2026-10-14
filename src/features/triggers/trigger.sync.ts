import type { HomeNetworkRepository } from '@/db/repositories/home-network.repository';
import type { ItemRepository } from '@/db/repositories/item.repository';
import type { RoutineRepository } from '@/db/repositories/routine.repository';
import type { TriggerRepository } from '@/db/repositories/trigger.repository';

import { fromTriggerRow } from './trigger.mapping';
import type { ArmedTrigger } from './trigger.types';

export interface TriggerSyncDeps {
  routines: Pick<RoutineRepository, 'getAll'>;
  items: Pick<ItemRepository, 'getAll'>;
  triggers: Pick<TriggerRepository, 'getAll'>;
  homeNetworks: Pick<HomeNetworkRepository, 'getAll'>;
}

/**
 * Avisos activos del usuario (RLS) con lo necesario para notificar sin red: nombre de la rutina
 * e ítems en orden. Se ignoran los de rutinas pausadas y las filas incompletas.
 */
export async function fetchArmedTriggers(deps: TriggerSyncDeps): Promise<ArmedTrigger[]> {
  const [routines, items, triggers, networks] = await Promise.all([
    deps.routines.getAll(),
    deps.items.getAll(),
    deps.triggers.getAll(),
    deps.homeNetworks.getAll(),
  ]);

  const routinesById = new Map(routines.filter((routine) => routine.active).map((routine) => [routine.id, routine]));
  const networksById = new Map(networks.map((network) => [network.id, network]));
  const labelsByRoutine = new Map<string, string[]>();
  for (const item of items) {
    // getAll ya viene ordenado por sort_order.
    labelsByRoutine.set(item.routineId, [...(labelsByRoutine.get(item.routineId) ?? []), item.label]);
  }

  return triggers.flatMap((trigger) => {
    const routine = routinesById.get(trigger.routineId);
    const draft = trigger.active && routine ? fromTriggerRow(trigger, networksById) : null;
    if (!routine || !draft) return [];
    return [
      {
        ...draft,
        triggerId: trigger.id,
        routineId: routine.id,
        routineName: routine.name,
        itemLabels: labelsByRoutine.get(routine.id) ?? [],
      },
    ];
  });
}
