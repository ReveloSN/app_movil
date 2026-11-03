import type { Routine } from '@/shared/types/routine.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { groupRecordsByDay, UNKNOWN_ROUTINE_NAME } from './history.grouping';

const routine = (overrides: Partial<Routine>): Routine => ({
  id: 'r1',
  userId: 'u1',
  name: 'Cerrando el estudio',
  kind: 'departure',
  icon: 'school-outline',
  color: 'blue',
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

const record = (id: string, routineId: string, date: string): VerificationRecord => ({
  id,
  routineId,
  date,
  result: 'completed',
  itemsChecked: null,
  durationSeconds: 10,
});

describe('groupRecordsByDay', () => {
  it('resuelve nombre, ícono y color de la rutina de cada registro', () => {
    const [group] = groupRecordsByDay([record('a', 'r1', '2026-10-13T15:00:00.000Z')], [routine({})]);

    expect(group.records[0]).toMatchObject({ routineName: 'Cerrando el estudio', routineIcon: 'school-outline', routineColor: 'blue' });
  });

  it('si la rutina ya no existe, usa el nombre de rutina eliminada y no inventa color', () => {
    const [group] = groupRecordsByDay([record('a', 'gone', '2026-10-13T15:00:00.000Z')], []);

    expect(group.records[0]).toMatchObject({ routineName: UNKNOWN_ROUTINE_NAME, routineIcon: null, routineColor: null });
  });
});
