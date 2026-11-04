import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateForgotEvents } from '@/db/local/forgot.migration';
import type { LocalStore } from '@/db/local/local.store';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

// Una migración por usuario y por sesión de la app: todas las lecturas de olvidos esperan la misma promesa.
const done = new Map<string, Promise<void>>();

/**
 * Pasa los olvidos que vivían solo en el teléfono (clave vieja) al documento local antes de leerlos.
 * Idempotente y segura de llamar en cada lectura. Si el documento aún no tiene rutinas (p. ej. antes de
 * la primera bajada), espera: la migración descarta los olvidos de rutinas que no encuentra y se
 * perderían. Si falla, no bloquea: se lee lo que haya y se reintenta en la próxima lectura.
 */
export function ensureForgotMigrated(userId: string, store: LocalStore, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  const pending = done.get(userId);
  if (pending) return pending;
  const run = (async () => {
    const doc = await store.read();
    if (doc.tables.routines.length === 0) {
      done.delete(userId);
      return;
    }
    await migrateForgotEvents(userId, storage, () => store);
  })().catch((cause: unknown) => {
    done.delete(userId);
    if (__DEV__) console.warn('[insights.forgot.migrate]', cause);
  });
  done.set(userId, run);
  return run;
}

/** Solo para tests: olvida qué usuarios ya se migraron. */
export function resetForgotMigrations(): void {
  done.clear();
}
