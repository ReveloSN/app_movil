import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/** Almacenamiento en memoria para tests, con acceso directo a lo guardado. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (key) => data[key] ?? null,
    setItem: async (key, value) => {
      data[key] = value;
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
}

/** Reloj y generador de ids deterministas: cada llamada avanza un segundo / un número. */
export function fixedDeps() {
  let tick = 0;
  let id = 0;
  return {
    now: () => new Date(Date.UTC(2026, 9, 14, 12, 0, tick++)).toISOString(),
    newId: () => `id-${++id}`,
  };
}
