import { op, record } from '@/db/local/testing/outbox.fixtures';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { withPendingRecords } from './history.pending';

const remote = (id: string): VerificationRecord => ({
  id,
  routineId: 'r1',
  date: '2026-10-13T08:00:00.000Z',
  result: 'completed',
  itemsChecked: null,
  durationSeconds: 10,
});

describe('withPendingRecords', () => {
  it('agrega las verificaciones que esperan en la cola, marcadas como pendientes', () => {
    const merged = withPendingRecords([remote('rec-1')], [op({ kind: 'insertRecord', record: record('rec-2', 'r1') })]);

    expect(merged.map(({ id, pending }) => [id, pending])).toEqual([
      ['rec-1', false],
      ['rec-2', true],
    ]);
  });

  it('una que ya llegó al servidor aparece una sola vez, como sincronizada', () => {
    const merged = withPendingRecords([remote('rec-1')], [op({ kind: 'insertRecord', record: record('rec-1', 'r1') })]);

    expect(merged).toEqual([{ ...remote('rec-1'), pending: false }]);
  });

  it('ignora lo que no son verificaciones', () => {
    expect(withPendingRecords([], [op({ kind: 'deleteRoutine', id: 'r1' })])).toEqual([]);
  });
});
