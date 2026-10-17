import { PRESET_TEMPLATES } from '@/features/routine-templates/routine-templates.data';

import { DEFAULT_ROUTINE_ICON, resolveRoutineColor, resolveRoutineIcon, ROUTINE_ICONS } from './routine-appearance';

describe('ícono y color de rutina (04-2)', () => {
  it('sin ícono, o con uno fuera del conjunto, usa el de por defecto (nunca null)', () => {
    expect(resolveRoutineIcon(null)).toBe(DEFAULT_ROUTINE_ICON);
    expect(resolveRoutineIcon('rocket')).toBe(DEFAULT_ROUTINE_ICON);
    expect(resolveRoutineIcon('moon-outline')).toBe('moon-outline');
  });

  it('sin color usa el verde; uno conocido se conserva', () => {
    expect(resolveRoutineColor(undefined).key).toBe('green');
    expect(resolveRoutineColor('blue').token).toBe('categoryBlue');
  });

  it('los íconos de las plantillas están en el conjunto', () => {
    const icons = ROUTINE_ICONS.map((option) => option.icon);
    expect(PRESET_TEMPLATES.every((template) => icons.includes(template.icon))).toBe(true);
  });
});
