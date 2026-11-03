import { getLocalStore } from '@/db/local/local.store';
import { loadDraftChecked, localDay, toggleDraftItem } from '@/features/checklist/checklist.draft';
import { loadArmedTriggers } from '@/features/triggers/armedTriggers.store';

import { buildWidgetState, type WidgetState } from './widget.state';

/**
 * Lo que muestra el widget, leído de la copia local. No necesita la app abierta ni la red: el dueño de los
 * datos sale de la copia de avisos activos que ya usan las tareas en segundo plano.
 */
export async function loadWidgetState(now: Date = new Date()): Promise<WidgetState | null> {
  const snapshot = await loadArmedTriggers();
  if (!snapshot) return null;
  const { tables } = await getLocalStore(snapshot.ownerId).read();
  const data = { routines: tables.routines, items: tables.items, triggers: tables.triggers, now };
  const next = buildWidgetState({ ...data, checkedIds: [] });
  if (!next) return null;
  const checkedIds = await loadDraftChecked(snapshot.ownerId, next.routineId, localDay(now));
  return buildWidgetState({ ...data, checkedIds });
}

/** Un toque en el widget: marca o desmarca el ítem en el borrador de hoy. */
export async function toggleWidgetItem(routineId: string, itemId: string, now: Date = new Date()): Promise<void> {
  const snapshot = await loadArmedTriggers();
  if (!snapshot) return;
  await toggleDraftItem(snapshot.ownerId, routineId, itemId, localDay(now));
}
