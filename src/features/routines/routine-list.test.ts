import type { Routine } from '@/shared/types/routine.types';

import { canVerifyFromHome, upsertRoutine } from './routine-list';

const routine = (id: string, name: string): Routine => ({
  id,
  userId: 'u1',
  name,
  kind: 'departure',
  icon: 'checkbox-outline',
  color: 'green',
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

describe('lista de rutinas tras guardar', () => {
  it('añade una rutina nueva al final', () => {
    expect(upsertRoutine([routine('r1', 'Casa')], routine('r2', 'Trabajo')).map((item) => item.id)).toEqual(['r1', 'r2']);
  });

  it('si la recarga ya la trajo, la reemplaza en vez de repetirla', () => {
    const list = [routine('r1', 'Casa'), routine('r2', 'Trabajo')];
    const saved = routine('r2', 'Trabajo nuevo');
    expect(upsertRoutine(list, saved)).toEqual([list[0], saved]);
  });
});

describe('tarjeta de Inicio', () => {
  it('«Verificar ahora» solo se ofrece en rutinas de salida; la de llegada solo se edita', () => {
    expect(canVerifyFromHome(routine('r1', 'Casa'))).toBe(true);
    expect(canVerifyFromHome({ ...routine('r2', 'Llegar'), kind: 'arrival' })).toBe(false);
  });
});
