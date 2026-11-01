import { normalizeLabel } from './item-suggestions';

/**
 * Palabras clave (sin tildes ni mayúsculas) → ícono del conjunto cerrado de ítems (`ITEM_ICONS`, 05-2).
 * La primera regla que coincide gana: las más específicas van antes ("portátil cargado" es un portátil).
 */
const RULES: readonly (readonly [RegExp, string])[] = [
  [/llave/, 'key-outline'],
  [/billetera|cartera/, 'wallet-outline'],
  [/portatil|computador|escritorio|pantalla/, 'laptop-outline'],
  [/celular|telefono/, 'phone-portrait-outline'],
  [/cargador|cargando|cargar|cargado/, 'battery-charging-outline'],
  [/mascota|perro|gato/, 'paw-outline'],
  [/estufa|\bgas\b/, 'flame-outline'],
  [/puerta|candado|seguro/, 'lock-closed-outline'],
  [/\bluz\b|luces/, 'bulb-outline'],
  [/audifono/, 'headset-outline'],
  [/gafa/, 'glasses-outline'],
  [/paraguas/, 'umbrella-outline'],
  [/agua|botella/, 'water-outline'],
  [/merienda|almuerzo|tarro/, 'restaurant-outline'],
  [/carne|tiquete|boleto|pasaje/, 'card-outline'],
  [/documento|identidad|cuaderno|anotar|pendiente/, 'document-text-outline'],
  [/medicamento|pastilla/, 'medkit-outline'],
  [/alarma/, 'alarm-outline'],
  [/archivo|nube/, 'cloud-upload-outline'],
];

/** Ícono sugerido para un ítem según su etiqueta; undefined si ninguna palabra clave coincide. */
export function iconForItemLabel(label: string): string | undefined {
  const normalized = normalizeLabel(label);
  return RULES.find(([pattern]) => pattern.test(normalized))?.[1];
}
