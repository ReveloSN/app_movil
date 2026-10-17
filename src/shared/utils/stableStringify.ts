/**
 * JSON con las claves de cada objeto ordenadas: dos valores iguales dan el mismo texto aunque sus
 * claves se hayan creado en otro orden. Las claves con `undefined` se omiten (como en JSON.stringify).
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, current: unknown) =>
    current && typeof current === 'object' && !Array.isArray(current)
      ? Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)))
      : current,
  );
}
