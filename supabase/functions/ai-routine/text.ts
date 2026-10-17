// Utilidades de texto puras (servidor). Sin APIs de Deno.

/** Quita caracteres de control y espacios sobrantes. */
export const cleanText = (value: string): string =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Recorta a `max` caracteres; si puede, en el último espacio (sin cortar una palabra por la mitad). */
export function clip(value: string, max: number): string {
  if (value.length <= max) return value.trim();
  const cut = value.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (value[max] === ' ' || space < max / 2 ? cut : cut.slice(0, space)).trim();
}

/** Clave para comparar ítems: sin mayúsculas, tildes ni espacios sobrantes ("Llaves " = "llaves"). */
export const itemKey = (label: string): string =>
  cleanText(label)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
