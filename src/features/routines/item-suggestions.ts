import type { ItemDraft } from './routines.types';

const suggestion = (label: string, kind: ItemDraft['kind'], icon: string, critical = false): ItemDraft => ({
  label,
  kind,
  critical,
  icon,
});

/** 04-4: lo que más se olvida al salir (mismo vocabulario que las plantillas). Etiquetas ≤ 32. */
export const ITEM_SUGGESTIONS: readonly ItemDraft[] = [
  suggestion('Llaves', 'carry', 'key-outline', true),
  suggestion('Billetera', 'carry', 'wallet-outline'),
  suggestion('Celular cargado', 'carry', 'phone-portrait-outline'),
  suggestion('Cargador', 'carry', 'battery-charging-outline'),
  suggestion('Estufa apagada', 'check', 'flame-outline', true),
  suggestion('Puerta con seguro', 'check', 'lock-closed-outline', true),
  suggestion('Luces apagadas', 'check', 'bulb-outline'),
  suggestion('Ventanas cerradas', 'check', 'lock-closed-outline'),
  suggestion('Audífonos', 'carry', 'headset-outline'),
  suggestion('Gafas', 'carry', 'glasses-outline'),
  suggestion('Paraguas', 'carry', 'umbrella-outline'),
  suggestion('Botella de agua', 'carry', 'water-outline'),
];

const MAX_SHOWN = 4;

/** Sin mayúsculas, tildes ni espacios sobrantes: "Llaves " y "llaves" son el mismo ítem. */
const normalize = (label: string) =>
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
  const present = new Set(currentLabels.map(normalize));
  return catalog.filter((item) => !present.has(normalize(item.label))).slice(0, max);
}
