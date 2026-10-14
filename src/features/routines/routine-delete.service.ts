import type { ItemRepository } from '@/db/repositories/item.repository';
import { RepositoryError } from '@/db/repositories/repository.types';
import type { RoutineRepository } from '@/db/repositories/routine.repository';
import type { TriggerRepository } from '@/db/repositories/trigger.repository';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';

export interface RoutineDeleteDeps {
  routines: Pick<RoutineRepository, 'delete'>;
  items: Pick<ItemRepository, 'deleteByRoutine'>;
  triggers: Pick<TriggerRepository, 'deleteByRoutine'>;
  records: Pick<VerificationRecordRepository, 'deleteByRoutine'>;
}

/** 'cascade': la base borró las dependencias sola. 'manual': hubo que borrarlas antes. */
export type RoutineDeletion = 'cascade' | 'manual';

/**
 * Elimina la rutina con sus avisos, ítems e historial (DC-01).
 * Primero intenta borrar solo la rutina: con ON DELETE CASCADE es una única operación atómica.
 * Si una clave foránea lo impide, borra las dependencias y reintenta.
 */
export async function deleteRoutineCascade(deps: RoutineDeleteDeps, routineId: string): Promise<RoutineDeletion> {
  try {
    await deps.routines.delete(routineId);
    return 'cascade';
  } catch (cause) {
    if (!(cause instanceof RepositoryError && cause.kind === 'referenced')) throw cause;
  }

  await deps.triggers.deleteByRoutine(routineId);
  await deps.items.deleteByRoutine(routineId);
  await deps.records.deleteByRoutine(routineId);
  await deps.routines.delete(routineId);
  return 'manual';
}
