import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSerialQueue } from '@/shared/lib/serialQueue';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { LocalDocument } from './local-document.types';

export interface LocalChange<T> {
  doc: LocalDocument;
  result: T;
}

/** Quién escribió: 'local' (la persona usando la app) o 'sync' (subir/bajar). Evita sincronizar en bucle. */
export type ChangeSource = 'local' | 'sync';

/** Lo que cambió en un guardado: así cada suscriptor reacciona solo a lo que le importa. */
export interface StoreChange {
  source: ChangeSource;
  tablesChanged: boolean;
  outboxChanged: boolean;
}

/** Datos locales de un usuario: un solo documento, que se lee y se reescribe entero (atómico). */
export interface LocalStore {
  readonly userId: string;
  read(): Promise<LocalDocument>;
  /** Lee, aplica `change` y guarda, en serie con las demás escrituras. Avisa a los suscriptores. */
  update<T>(change: (doc: LocalDocument) => LocalChange<T>, source?: ChangeSource): Promise<T>;
  /** Devuelve la función para dejar de escuchar. */
  subscribe(listener: (change: StoreChange) => void): () => void;
  /** Borra la copia local (ej. un invitado que cierra sesión: no puede volver a entrar). */
  clear(): Promise<void>;
}

export const emptyDocument = (): LocalDocument => ({
  version: 1,
  tables: { routines: [], items: [], triggers: [], homeNetworks: [], settings: [] },
  outbox: [],
  lastPulledAt: null,
});

const storageKey = (userId: string) => `local-db:${userId}`;

const isLocalDocument = (value: unknown): value is LocalDocument => {
  const doc = value as Partial<LocalDocument> | null;
  return doc?.version === 1 && typeof doc.tables === 'object' && doc.tables !== null && Array.isArray(doc.outbox);
};

export function createLocalStore(userId: string, storage: KeyValueStorage = AsyncStorage): LocalStore {
  const run = createSerialQueue();
  const listeners = new Set<(change: StoreChange) => void>();
  const key = storageKey(userId);

  // Siempre desde el almacenamiento (sin copia en memoria): la tarea en segundo plano también escribe.
  async function load(): Promise<LocalDocument> {
    const raw = await storage.getItem(key);
    if (!raw) return emptyDocument();
    try {
      const parsed: unknown = JSON.parse(raw);
      return isLocalDocument(parsed) ? parsed : emptyDocument();
    } catch {
      return emptyDocument(); // Contenido corrupto: no se puede recuperar.
    }
  }

  return {
    userId,
    read: () => run(load),
    update: (change, source = 'local') =>
      run(async () => {
        const current = await load();
        const { doc, result } = change(current);
        if (doc !== current) {
          await storage.setItem(key, JSON.stringify(doc));
          const notice: StoreChange = {
            source,
            tablesChanged: doc.tables !== current.tables,
            outboxChanged: doc.outbox !== current.outbox,
          };
          listeners.forEach((listener) => listener(notice));
        }
        return result;
      }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // En la misma fila de espera: no se cruza con una escritura en curso.
    clear: () => run(() => storage.removeItem(key)),
  };
}

const stores = new Map<string, LocalStore>();

/** Un único store por usuario en la app: así todas sus escrituras comparten la misma fila de espera. */
export function getLocalStore(userId: string): LocalStore {
  let store = stores.get(userId);
  if (!store) {
    store = createLocalStore(userId);
    stores.set(userId, store);
  }
  return store;
}
