import { PRESET_TEMPLATES } from '@/features/routine-templates/routine-templates.data';

import { iconForItemLabel } from './item-icon-guess';
import { ITEM_ICONS } from './item-icons';

describe('iconForItemLabel', () => {
  it.each([
    ['Llaves', 'key-outline'],
    ['Llaves del carro', 'key-outline'],
    ['Estufa apagada', 'flame-outline'],
    ['Comida de la mascota servida', 'paw-outline'],
    ['Portátil cargado', 'laptop-outline'],
    ['Cargador', 'battery-charging-outline'],
    ['  CELULAR cargando ', 'phone-portrait-outline'],
    ['Puerta con seguro', 'lock-closed-outline'],
  ])('«%s» → %s', (label, icon) => {
    expect(iconForItemLabel(label)).toBe(icon);
  });

  it('solo usa íconos del conjunto cerrado de ítems (05-2), para que el editor los reconozca', () => {
    const allowed = new Set(ITEM_ICONS.map((option) => option.icon as string));
    const labels = PRESET_TEMPLATES.flatMap((template) => template.items.map((item) => item.label));
    for (const label of labels) {
      const icon = iconForItemLabel(label);
      if (icon) expect(allowed.has(icon)).toBe(true);
    }
  });

  it('devuelve undefined si ninguna palabra coincide', () => {
    expect(iconForItemLabel('Zxqv')).toBeUndefined();
  });

  it('cubre casi todos los ítems de las plantillas (sin caer en el ícono genérico)', () => {
    const labels = PRESET_TEMPLATES.flatMap((template) => template.items.map((item) => item.label));
    const withIcon = labels.filter((label) => iconForItemLabel(label) !== undefined);
    expect(withIcon.length / labels.length).toBeGreaterThanOrEqual(0.85);
  });

  it('las plantillas ya guardan el ícono en cada ítem', () => {
    for (const template of PRESET_TEMPLATES) {
      for (const item of template.items) expect(item.icon).toBe(iconForItemLabel(item.label));
    }
  });
});
