import { op, record as pendingRecord } from '../local/testing/outbox.fixtures';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { mergeRecords } from './sync.records';

const rec = (id: string, routineId = 'r1'): VerificationRecord => ({
  id,
  routineId,
  date: '2026-10-13T08:00:00.000Z',
  result: 'completed',
  itemsChecked: null,
  durationSeconds: 10,
});

describe('historial local al bajar (mergeRecords)', () => {
  it('manda lo del servidor y conserva lo hecho aquí que sigue en la cola', () => {
    const merged = mergeRecords([rec('local-1'), rec('srv-1')], [rec('srv-1'), rec('srv-2')], [
      op({ kind: 'insertRecord', record: pendingRecord('local-1', 'r1') }),
    ]);
    expect(merged.map((record) => record.id)).toEqual(['srv-1', 'srv-2', 'local-1']);
  });

  it('lo que ya no está en la cola ni en el servidor desaparece (se descartó)', () => {
    expect(mergeRecords([rec('gone')], [], [])).toEqual([]);
  });

  it('quita las de una rutina borrada aquí que aún no se subió', () => {
    const merged = mergeRecords([], [rec('srv-1', 'r1'), rec('srv-2', 'r2')], [op({ kind: 'deleteRoutine', id: 'r1' })]);
    expect(merged.map((record) => record.id)).toEqual(['srv-2']);
  });
});
