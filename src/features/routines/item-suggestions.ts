import copy from './routine.copy';
import type { ItemDraft } from './routines.types';

/**
 * Sugerencia cuya etiqueta se lee del idioma activo al pedirla (no al cargar el módulo): el catálogo se
 * declara una vez y se ve en español o en inglés según el idioma de la app.
 */
const suggestion = (key: string, kind: ItemDraft['kind'], icon: string, critical = false): ItemDraft => ({
  get label() {
    return copy.ITEM_SUGGESTION_LABELS[key];
  },
  kind,
  critical,
  icon,
});

/** 04-4: lo que más se olvida al salir (mismo vocabulario que las plantillas). Etiquetas ≤ 32. */
export const ITEM_SUGGESTIONS: readonly ItemDraft[] = [
  suggestion('keys', 'carry', 'key-outline', true),
  suggestion('wallet', 'carry', 'wallet-outline'),
  suggestion('phone', 'carry', 'phone-portrait-outline'),
  suggestion('charger', 'carry', 'battery-charging-outline'),
  suggestion('stove', 'check', 'flame-outline', true),
  suggestion('door', 'check', 'lock-closed-outline', true),
  suggestion('lights', 'check', 'bulb-outline'),
  suggestion('windows', 'check', 'lock-closed-outline'),
  suggestion('headphones', 'carry', 'headset-outline'),
  suggestion('glasses', 'carry', 'glasses-outline'),
  suggestion('umbrella', 'carry', 'umbrella-outline'),
  suggestion('water', 'carry', 'water-outline'),
];

const MAX_SHOWN = 4;

/** Sin mayúsculas, tildes ni espacios sobrantes: "Llaves " y "llaves" son el mismo ítem. */
export const normalizeLabel = (label: string) =>
  label
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Las primeras sugerencias que aún no están en la rutina (como mucho 4). */
export function pickSuggestions(
  currentLabels: readonly string[],
  catalog: readonly ItemDraft[] = ITEM_SUGGESTIONS,
  max: number = MAX_SHOWN,
): ItemDraft[] {
  const present = new Set(currentLabels.map(normalizeLabel));
  return catalog.filter((item) => !present.has(normalizeLabel(item.label))).slice(0, max);
}
