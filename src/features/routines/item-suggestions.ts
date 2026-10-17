import type { ItemDraft } from './routines.types';

const suggestion = (label: string, kind: ItemDraft['kind'], critical = false): ItemDraft => ({ label, kind, critical });

/** 04-4: lo que más se olvida al salir (mismo vocabulario que las plantillas). Etiquetas ≤ 32. */
export const ITEM_SUGGESTIONS: readonly ItemDraft[] = [
  suggestion('Llaves', 'carry', true),
  suggestion('Billetera', 'carry'),
  suggestion('Celular cargado', 'carry'),
  suggestion('Cargador', 'carry'),
  suggestion('Estufa apagada', 'check', true),
  suggestion('Puerta con seguro', 'check', true),
  suggestion('Luces apagadas', 'check'),
  suggestion('Ventanas cerradas', 'check'),
  suggestion('Audífonos', 'carry'),
  suggestion('Gafas', 'carry'),
  suggestion('Paraguas', 'carry'),
  suggestion('Botella de agua', 'carry'),
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
