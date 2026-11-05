import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSerialQueue } from '@/shared/lib/serialQueue';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { LOCAL_DOCUMENT_VERSION, migrateDocument } from './local-document.migration';
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
  /** Cambió el historial local (una verificación nueva o lo bajado del servidor). */
  recordsChanged: boolean;
  /** Cambiaron los olvidos locales (uno anotado aquí o lo bajado del servidor). */
  forgotEventsChanged: boolean;
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
  version: LOCAL_DOCUMENT_VERSION,
  tables: { routines: [], items: [], triggers: [], homeNetworks: [], settings: [] },
  outbox: [],
  lastPulledAt: null,
  forgotEvents: [],
});

const storageKey = (userId: string) => `local-db:${userId}`;

export function createLocalStore(userId: string, storage: KeyValueStorage = AsyncStorage): LocalStore {
  const run = createSerialQueue();
  const listeners = new Set<(change: StoreChange) => void>();
  const key = storageKey(userId);

  // Siempre se pregunta al almacenamiento (la tarea en segundo plano también escribe), pero si el texto es
  // idéntico al último leído o escrito se reutiliza el documento ya interpretado: leer no vuelve a parsear
  // ni a migrar todo el historial. Los documentos son inmutables (cada cambio crea uno nuevo).
  let cachedRaw: string | null = null;
  let cachedDoc: LocalDocument | null = null;
  // Un documento de una versión anterior se migra aquí, antes de validarlo: si no, se trataría como
  // vacío y la próxima escritura borraría los datos. Uno de una versión futura lanza
  // UnsupportedDocumentVersionError: ni se lee ni se reescribe.
  async function load(): Promise<LocalDocument> {
    const raw = await storage.getItem(key);
    if (!raw) return emptyDocument();
    if (raw === cachedRaw && cachedDoc) return cachedDoc;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyDocument(); // Contenido corrupto: no se puede recuperar.
    }
    const doc = migrateDocument(parsed);
    if (!doc) return emptyDocument();
    cachedRaw = raw;
    cachedDoc = doc;
    return doc;
  }

  return {
    userId,
    read: () => run(load),
    update: (change, source = 'local') =>
      run(async () => {
        const current = await load();
        const { doc, result } = change(current);
        if (doc !== current) {
          const serialized = JSON.stringify(doc);
          await storage.setItem(key, serialized);
          cachedRaw = serialized;
          cachedDoc = doc;
          const notice: StoreChange = {
            source,
            tablesChanged: doc.tables !== current.tables,
            outboxChanged: doc.outbox !== current.outbox,
            recordsChanged: doc.records !== current.records,
            forgotEventsChanged: doc.forgotEvents !== current.forgotEvents,
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
    clear: () =>
      run(() => {
        cachedRaw = null;
        cachedDoc = null;
        return storage.removeItem(key);
      }),
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
