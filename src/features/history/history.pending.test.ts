import { op, record } from '@/db/local/testing/outbox.fixtures';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { withPendingRecords } from './history.pending';

const local = (id: string): VerificationRecord => ({
  id,
  routineId: 'r1',
  date: '2026-10-13T08:00:00.000Z',
  result: 'completed',
  itemsChecked: null,
  durationSeconds: 10,
});

describe('withPendingRecords', () => {
  it('marca como pendientes las del historial local que siguen en la cola', () => {
    const merged = withPendingRecords([local('rec-1'), local('rec-2')], [op({ kind: 'insertRecord', record: record('rec-2', 'r1') })]);

    expect(merged.map(({ id, pending }) => [id, pending])).toEqual([
      ['rec-1', false],
      ['rec-2', true],
    ]);
  });

  it('agrega las que solo están en la cola (encoladas antes del historial local), una sola vez', () => {
    const merged = withPendingRecords([local('rec-1')], [op({ kind: 'insertRecord', record: record('rec-9', 'r1') })]);

    expect(merged.map(({ id, pending }) => [id, pending])).toEqual([
      ['rec-1', false],
      ['rec-9', true],
    ]);
  });

  it('ignora lo que no son verificaciones', () => {
    expect(withPendingRecords([], [op({ kind: 'deleteRoutine', id: 'r1' })])).toEqual([]);
  });
});
