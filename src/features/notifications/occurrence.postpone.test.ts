import { planPostpone, type PostponeTarget } from './occurrence.postpone';
import type { Occurrence } from './occurrence.types';

const routine: PostponeTarget = { routineId: 'r1', routineName: 'Saliendo de casa', itemCount: 4, ownerId: 'u1' };

const occurrence = (key: string, routineId: string, firesAt: number): Occurrence => ({
  key,
  triggerId: `t-${key}`,
  routineId,
  routineName: 'Rutina',
  itemCount: 3,
  ownerId: 'u1',
  firesAt,
  deadline: firesAt + 15 * 60_000,
  notificationIds: [`${key}#0`],
  signature: 'sig',
});

describe('posponer desde la verificación (P07-6)', () => {
  it('pospone la última vez que ya sonó de esa rutina y deja respondidas las anteriores', () => {
    const older = occurrence('a', 'r1', 1_000);
    const latest = occurrence('b', 'r1', 2_000);
    const future = occurrence('c', 'r1', 9_000);
    const other = occurrence('d', 'r2', 2_500);

    const plan = planPostpone([older, future, latest, other], routine, 5_000);

    expect(plan.target).toBe(latest);
    expect(plan.superseded).toEqual([older]);
  });

  it('sin una vez sonada (se abrió desde Inicio), crea una nueva sin aviso para esa rutina', () => {
    const plan = planPostpone([occurrence('c', 'r1', 9_000)], routine, 5_000);

    expect(plan.superseded).toEqual([]);
    expect(plan.target).toMatchObject({
      key: 'manual:r1@5000',
      triggerId: 'manual:r1',
      routineId: 'r1',
      routineName: 'Saliendo de casa',
      itemCount: 4,
      ownerId: 'u1',
      firesAt: 5_000,
      notificationIds: [],
    });
  });
});
