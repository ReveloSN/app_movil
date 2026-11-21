import { DEFAULT_ITEM_ICON } from './item-icons';
import { normalizeLabel } from './item-suggestions';

/**
 * Palabras clave en español y en inglés (sin tildes ni mayúsculas; la persona puede escribir en cualquier
 * idioma, sin importar el de la app) → ícono del conjunto cerrado de ítems (`ITEM_ICONS`, 05-2).
 * La primera regla que coincide gana: las más específicas van antes ("portátil cargado" es un portátil,
 * "charged phone" es un celular).
 */
const RULES: readonly (readonly [RegExp, string])[] = [
  [/llave|\bkeys?\b/, 'key-outline'],
  [/billetera|cartera|wallet|purse/, 'wallet-outline'],
  [/portatil|computador|escritorio|pantalla|laptop|computer|\bdesk\b|screen/, 'laptop-outline'],
  [/celular|telefono|phone/, 'phone-portrait-outline'],
  [/cargador|cargando|cargar|cargado|charger|charging|charged|\bcharge\b/, 'battery-charging-outline'],
  [/mascota|perro|gato|\bpets?\b|\bdogs?\b|\bcats?\b/, 'paw-outline'],
  [/estufa|\bgas\b|stove|cooker/, 'flame-outline'],
  [/puerta|candado|seguro|\bdoors?\b|padlock|\block(ed)?\b/, 'lock-closed-outline'],
  [/\bluz\b|luces|\blights?\b/, 'bulb-outline'],
  [/audifono|headphone|earbud|earphone/, 'headset-outline'],
  [/gafa|glasses/, 'glasses-outline'],
  [/paraguas|umbrella/, 'umbrella-outline'],
  [/agua|botella|water|bottle/, 'water-outline'],
  [/merienda|almuerzo|tarro|snack|lunch/, 'restaurant-outline'],
  [/carne|tiquete|boleto|pasaje|badge|ticket|student id|\bpass\b/, 'card-outline'],
  [/documento|identidad|cuaderno|anotar|pendiente|document|\bid\b|passport|notebook|write down|\bnote\b|to-do/, 'document-text-outline'],
  [/medicamento|pastilla|medic|\bpills?\b|\bmeds\b/, 'medkit-outline'],
  [/alarma|alarm/, 'alarm-outline'],
  [/archivo|nube|\bfiles?\b|cloud|backup/, 'cloud-upload-outline'],
];

/** Ícono sugerido para un ítem según su etiqueta; undefined si ninguna palabra clave coincide. */
export function iconForItemLabel(label: string): string | undefined {
  const normalized = normalizeLabel(label);
  return RULES.find(([pattern]) => pattern.test(normalized))?.[1];
}

/**
 * Ícono que se muestra para un ítem guardado. El cubo genérico es lo que se guarda cuando no se eligió
 * ícono (nunca es nulo), así que cuenta como "sin elegir" y se deduce de la etiqueta.
 */
export function displayIconForItem(icon: string | null | undefined, label: string): string | null {
  if (icon && icon !== DEFAULT_ITEM_ICON) return icon;
  return iconForItemLabel(label) ?? icon ?? null;
}
