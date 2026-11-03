/** Normaliza lo dictado: espacios múltiples y saltos de línea pasan a un solo espacio, sin bordes. */
export function normalizeDictation(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Une lo que ya había escrito con lo dictado y recorta al máximo del campo (`maxLength`, el mismo
 * del prompt: lo define quien usa el dictado, no se duplica aquí). Devuelve '' si no hay nada.
 */
export function composeDictation(base: string, dictated: string, maxLength: number): string {
  const joined = normalizeDictation(`${base} ${dictated}`);
  return joined.length > maxLength ? joined.slice(0, maxLength).trimEnd() : joined;
}
