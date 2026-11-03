import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/**
 * Borrador de la verificación de hoy: qué ítems de cada rutina están marcados. Lo escriben la pantalla de
 * verificación y el widget, así que lo marcado en uno aparece en el otro. Es local (no se sube): el registro
 * solo se crea al terminar. Cada borrador vale un día: al día siguiente se empieza sin marcas.
 */
export interface VerificationDraft {
  /** Día local (AAAA-MM-DD) en que se marcó. */
  day: string;
  checkedIds: string[];
}

type DraftMap = Record<string, VerificationDraft>;

const storageKey = (userId: string) => `verify-drafts:${userId}`;

/** Día local en formato AAAA-MM-DD (el del teléfono, no el UTC). */
export const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

async function readAll(userId: string, storage: KeyValueStorage): Promise<DraftMap> {
  try {
    const parsed = JSON.parse((await storage.getItem(storageKey(userId))) ?? 'null') as DraftMap | null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Ids marcados hoy en esa rutina; vacío si no hay borrador o es de otro día. */
export async function loadDraftChecked(
  userId: string,
  routineId: string,
  today: string,
  storage: KeyValueStorage = AsyncStorage,
): Promise<string[]> {
  const draft = (await readAll(userId, storage))[routineId];
  return draft?.day === today && Array.isArray(draft.checkedIds) ? draft.checkedIds : [];
}

/** Guarda los ítems marcados de la rutina; sin ninguno, quita el borrador. Aprovecha para limpiar los de días pasados. */
export async function saveDraftChecked(
  userId: string,
  routineId: string,
  checkedIds: readonly string[],
  today: string,
  storage: KeyValueStorage = AsyncStorage,
): Promise<void> {
  const current = await readAll(userId, storage);
  const next: DraftMap = {};
  for (const [id, draft] of Object.entries(current)) {
    if (id !== routineId && draft?.day === today) next[id] = draft;
  }
  if (checkedIds.length > 0) next[routineId] = { day: today, checkedIds: [...checkedIds] };
  await storage.setItem(storageKey(userId), JSON.stringify(next));
}

/** Marca o desmarca un ítem en el borrador y devuelve los ids marcados que quedan. */
export async function toggleDraftItem(
  userId: string,
  routineId: string,
  itemId: string,
  today: string,
  storage: KeyValueStorage = AsyncStorage,
): Promise<string[]> {
  const checked = await loadDraftChecked(userId, routineId, today, storage);
  const next = checked.includes(itemId) ? checked.filter((id) => id !== itemId) : [...checked, itemId];
  await saveDraftChecked(userId, routineId, next, today, storage);
  return next;
}

export const clearDraft = (userId: string, routineId: string, today: string, storage: KeyValueStorage = AsyncStorage) =>
  saveDraftChecked(userId, routineId, [], today, storage);
