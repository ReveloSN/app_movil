import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS, ROUTINE_NAME_MAX_LENGTH } from '@/features/routines/routine.validation';
import { ROUTINE_ICONS } from '@/features/routines/routine-appearance';

import { PRESET_TEMPLATES } from './routine-templates.data';

describe('plantillas precargadas', () => {
  it('conservan las de siempre y suman Estudiante, Casa/Familia y Gimnasio', () => {
    expect(PRESET_TEMPLATES.map((template) => template.id)).toEqual([
      'leaving-home',
      'end-of-study',
      'leaving-work',
      'before-bed',
      'before-travel',
      'to-class',
      'family-outing',
      'gym',
    ]);
  });

  it.each(PRESET_TEMPLATES.map((template) => [template.name, template] as const))('«%s» cumple los límites del contenido', (_name, template) => {
    expect(template.name.length).toBeLessThanOrEqual(ROUTINE_NAME_MAX_LENGTH);
    expect(template.description.length).toBeLessThanOrEqual(70);
    expect(template.items.length).toBeGreaterThanOrEqual(4);
    expect(template.items.length).toBeLessThanOrEqual(Math.min(8, MAX_ITEMS));
    template.items.forEach((entry) => {
      expect(entry.label.length).toBeLessThanOrEqual(ITEM_LABEL_MAX_LENGTH);
      // Sin emojis: solo letras, números, espacios y puntuación común.
      expect(entry.label).toMatch(/^[\p{L}\p{N} ,.()'-]+$/u);
    });
    expect(ROUTINE_ICONS.map((option) => option.icon)).toContain(template.icon);
  });
});
