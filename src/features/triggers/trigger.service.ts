import type { HomeNetworkRepository } from '@/db/repositories/home-network.repository';
import type { TriggerRepository } from '@/db/repositories/trigger.repository';
import type { HomeNetwork } from '@/shared/types/home-network.types';
import type { Trigger } from '@/shared/types/trigger.types';

import { toCreateTriggerInput, toTriggerColumns } from './trigger.mapping';
import type { TriggerDraft } from './trigger.types';

export interface TriggerServiceDeps {
  triggers: TriggerRepository;
  homeNetworks: HomeNetworkRepository;
}

export interface CreatedTriggers {
  triggers: Trigger[];
  /** Redes creadas en esta operación (para deshacerlas si algo falla después). */
  createdNetworks: HomeNetwork[];
}

/**
 * Red de casa para un aviso de Wi-Fi: reutiliza la que tenga el mismo SSID (actualizando su nombre
 * si cambió) o la crea. Es lo mínimo de "Redes de casa" (P11) que necesita un aviso.
 */
async function resolveNetwork(
  deps: TriggerServiceDeps,
  known: HomeNetwork[],
  ssid: string,
  displayName: string,
): Promise<{ network: HomeNetwork; created: boolean }> {
  const existing = known.find((network) => network.ssid === ssid);
  if (!existing) {
    const network = await deps.homeNetworks.create({ ssid, displayName });
    known.push(network);
    return { network, created: true };
  }
  if (existing.displayName === displayName) return { network: existing, created: false };
  const updated = await deps.homeNetworks.update(existing.id, { displayName });
  known.splice(known.indexOf(existing), 1, updated);
  return { network: updated, created: false };
}

/** Crea los avisos de una rutina recién creada. Si algo falla, borra lo creado aquí y relanza. */
export async function createTriggersForRoutine(
  deps: TriggerServiceDeps,
  routineId: string,
  drafts: readonly TriggerDraft[],
): Promise<CreatedTriggers> {
  const triggers: Trigger[] = [];
  const createdNetworks: HomeNetwork[] = [];
  if (drafts.length === 0) return { triggers, createdNetworks };

  try {
    const known = drafts.some((draft) => draft.type !== 'schedule') ? await deps.homeNetworks.getAll() : [];
    // En serie: dos avisos con la misma red nueva no deben crearla dos veces.
    for (const draft of drafts) {
      let networkId: string | null = null;
      if (draft.type !== 'schedule') {
        const { network, created } = await resolveNetwork(deps, known, draft.ssid, draft.networkName);
        if (created) createdNetworks.push(network);
        networkId = network.id;
      }
      triggers.push(await deps.triggers.create(toCreateTriggerInput(routineId, draft, networkId)));
    }
    return { triggers, createdNetworks };
  } catch (cause) {
    await removeTriggers(deps, { triggers, createdNetworks });
    throw cause;
  }
}

/** Limpieza de mejor esfuerzo (el error que importa es el original). */
export async function removeTriggers(deps: TriggerServiceDeps, created: CreatedTriggers): Promise<void> {
  await Promise.allSettled(created.triggers.map((trigger) => deps.triggers.delete(trigger.id)));
  await Promise.allSettled(created.createdNetworks.map((network) => deps.homeNetworks.delete(network.id)));
}

/** Aviso deseado al guardar una edición: `id` es la fila existente, o null si es nuevo. */
export interface TriggerChange {
  id: string | null;
  draft: TriggerDraft;
}

/**
 * Deja los avisos de una rutina como `desired`: borra los que se quitaron, actualiza los que
 * ya existían y crea los nuevos. Borra primero para no superar nunca el máximo de 3.
 * No es atómico: si algo falla a medias, se relanza y un nuevo intento termina de igualarlos.
 */
export async function syncRoutineTriggers(
  deps: TriggerServiceDeps,
  routineId: string,
  desired: readonly TriggerChange[],
  originalIds: readonly string[],
): Promise<void> {
  const kept = new Set(desired.flatMap((change) => (change.id ? [change.id] : [])));
  for (const id of originalIds) {
    if (!kept.has(id)) await deps.triggers.delete(id);
  }

  const known = desired.some((change) => change.draft.type !== 'schedule') ? await deps.homeNetworks.getAll() : [];
  for (const { id, draft } of desired) {
    const networkId =
      draft.type === 'schedule' ? null : (await resolveNetwork(deps, known, draft.ssid, draft.networkName)).network.id;
    if (id) await deps.triggers.update(id, toTriggerColumns(draft, networkId));
    else await deps.triggers.create(toCreateTriggerInput(routineId, draft, networkId));
  }
}
