import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS, ROUTINE_NAME_MAX_LENGTH } from '@/features/routines/routine.validation';
import { ROUTINE_COLORS, ROUTINE_ICONS } from '@/features/routines/routine-appearance';

import { findPresetTemplate, PRESET_TEMPLATES } from './routine-templates.data';

describe('plantillas precargadas', () => {
  it('conservan las de siempre y suman Estudiante, Casa/Familia, Gimnasio y Llegar a casa', () => {
    expect(PRESET_TEMPLATES.map((template) => template.id)).toEqual([
      'leaving-home',
      'end-of-study',
      'leaving-work',
      'before-bed',
      'before-travel',
      'to-class',
      'family-outing',
      'gym',
      'arriving-home',
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
    expect(ROUTINE_COLORS.map((option) => option.key)).toContain(template.color);
  });

  it('reparten al menos tres colores distintos, para que Inicio no sea de un solo tono', () => {
    expect(new Set(PRESET_TEMPLATES.map((template) => template.color)).size).toBeGreaterThanOrEqual(3);
  });
});

describe('plantilla «Llegar a casa»', () => {
  const template = findPresetTemplate('arriving-home');

  it('es una rutina de llegada con recordatorios de llegar', () => {
    expect(template?.kind).toBe('arrival');
    expect(template?.name).toBe('Llegar a casa');
    expect(template?.items.map((entry) => entry.label)).toEqual(
      expect.arrayContaining(['Poner a cargar el celular', 'Guardar las llaves']),
    );
  });

  it('sugiere el aviso de llegar al Wi-Fi de casa (la red se detecta al configurarlo)', () => {
    expect(template?.suggestedTriggerDraft).toEqual({ type: 'wifi_enter', ssid: '', networkName: 'Casa', window: null });
  });

  it('las demás plantillas siguen siendo de salida', () => {
    expect(PRESET_TEMPLATES.filter((entry) => entry.kind === 'arrival').map((entry) => entry.id)).toEqual(['arriving-home']);
  });
});
