/** Mismo límite que la columna settings.display_name. */
export const DISPLAY_NAME_MAX_LENGTH = 24;

/** Nombre listo para guardar: sin espacios sobrantes; vacío = sin nombre (null). */
export function normalizeDisplayName(text: string): string | null {
  const trimmed = text.trim().replace(/\s+/g, ' ').slice(0, DISPLAY_NAME_MAX_LENGTH).trim();
  return trimmed || null;
}
