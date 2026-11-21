import { iconForItemLabel } from '@/features/routines/item-icon-guess';
import type { ItemDraft, ItemKind } from '@/features/routines/routines.types';
import type { TriggerDraft } from '@/features/triggers/trigger.types';
import type { Weekday } from '@/shared/types/clock.types';

import copy from './routine-templates.copy';
import type { PresetTemplate } from './routine-templates.types';

const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5];
const EVERY_DAY: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

type ItemSpec = readonly [kind: ItemKind, critical?: boolean];

/** Parte de la plantilla que no depende del idioma. Los textos salen de `routine-templates.copy.ts` por id. */
interface TemplateSpec extends Pick<PresetTemplate, 'id' | 'kind' | 'icon' | 'color'> {
  /** Tipo y criticidad de cada ítem, en el mismo orden que sus textos en el copy. */
  items: readonly ItemSpec[];
  /** Aviso sugerido, listo para precargar P06; recibe los nombres de red del idioma activo. */
  trigger(): TriggerDraft | null;
}

const leaveWifi = (networkName: string): TriggerDraft => ({ type: 'wifi_exit', ssid: '', networkName, window: null });
const arriveWifi = (networkName: string): TriggerDraft => ({ type: 'wifi_enter', ssid: '', networkName, window: null });

const SPECS: readonly TemplateSpec[] = [
  {
    id: 'leaving-home',
    icon: 'home-outline',
    color: 'green',
    items: [['carry', true], ['carry'], ['carry'], ['carry'], ['do'], ['check', true]],
    trigger: () => leaveWifi(copy.HOME_NETWORK_NAME),
  },
  {
    id: 'end-of-study',
    icon: 'school-outline',
    color: 'blue',
    items: [['do', true], ['do'], ['do'], ['do']],
    trigger: () => ({ type: 'schedule', time: { hour: 18, minute: 0 }, days: [...WEEKDAYS] }),
  },
  {
    id: 'leaving-work',
    icon: 'briefcase-outline',
    color: 'gray',
    items: [['carry'], ['carry', true], ['carry'], ['do']],
    trigger: () => leaveWifi(copy.WORK_NETWORK_NAME),
  },
  {
    id: 'before-bed',
    icon: 'moon-outline',
    color: 'purple',
    items: [['check', true], ['check', true], ['check'], ['check']],
    trigger: () => ({ type: 'schedule', time: { hour: 22, minute: 30 }, days: [...EVERY_DAY] }),
  },
  {
    id: 'before-travel',
    icon: 'airplane-outline',
    color: 'amber',
    items: [['carry', true], ['carry'], ['carry'], ['carry'], ['check']],
    trigger: () => null,
  },
  // Añadidas el 2026-10-18 (Estudiante, Casa/Familia, Gimnasio). "Trabajo" ya estaba (Saliendo del trabajo).
  {
    id: 'to-class',
    icon: 'school-outline',
    color: 'blue',
    items: [['carry', true], ['carry'], ['carry'], ['carry'], ['carry']],
    trigger: () => ({ type: 'schedule', time: { hour: 6, minute: 30 }, days: [...WEEKDAYS] }),
  },
  {
    id: 'family-outing',
    icon: 'car-outline',
    color: 'amber',
    items: [['carry', true], ['carry', true], ['carry'], ['carry'], ['check']],
    trigger: () => null,
  },
  {
    id: 'gym',
    icon: 'barbell-outline',
    color: 'purple',
    items: [['carry'], ['carry'], ['carry'], ['carry'], ['carry'], ['carry']],
    trigger: () => null,
  },
  {
    id: 'arriving-home',
    // Rutina de llegada: aparece en «Al llegar», no cuenta como salida.
    kind: 'arrival',
    icon: 'home-outline',
    color: 'amber',
    items: [['do'], ['do'], ['do'], ['do'], ['do']],
    trigger: () => arriveWifi(copy.HOME_NETWORK_NAME),
  },
];

const buildItems = (id: string, specs: readonly ItemSpec[]): ItemDraft[] =>
  copy.templates[id].items.map((label, index) => ({
    label,
    kind: specs[index][0],
    critical: specs[index][1] ?? false,
    icon: iconForItemLabel(label),
  }));

/**
 * Arma una plantilla cuyos textos se leen del idioma activo cada vez que se piden (getters): así la lista
 * de plantillas se puede declarar una sola vez sin quedarse en el idioma de arranque.
 */
const toTemplate = ({ id, kind, icon, color, items, trigger }: TemplateSpec): PresetTemplate => ({
  id,
  ...(kind ? { kind } : {}),
  icon,
  color,
  get name() {
    return copy.templates[id].name;
  },
  get description() {
    return copy.templates[id].description;
  },
  get items() {
    return buildItems(id, items);
  },
  get suggestedTrigger() {
    return copy.templates[id].suggestedTrigger;
  },
  get suggestedTriggerDraft() {
    return trigger();
  },
});

// Contenido de P10. Nombres ≤ 24 caracteres e ítems ≤ 32 (límites de routine.validation).
export const PRESET_TEMPLATES: readonly PresetTemplate[] = SPECS.map(toTemplate);

export const findPresetTemplate = (id: string | undefined): PresetTemplate | undefined =>
  PRESET_TEMPLATES.find((template) => template.id === id);
