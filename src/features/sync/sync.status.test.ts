import { failure, op } from '@/db/local/testing/outbox.fixtures';

import { summarizeOutbox } from './sync.status';

describe('summarizeOutbox', () => {
  it('cuenta lo pendiente (incluido lo bloqueado) aparte de lo fallido', () => {
    const failed = op({ kind: 'insert', table: 'routines', id: 'r1', values: {} }, { failed: failure });
    const blocked = op({ kind: 'insert', table: 'items', id: 'i1', values: { routineId: 'r1' } });
    const ready = op({ kind: 'insert', table: 'routines', id: 'r2', values: {} });

    expect(summarizeOutbox([failed, blocked, ready])).toEqual({ pendingCount: 2, blockedCount: 1, failed: [failed] });
  });

  it('sin nada en la cola, todo está sincronizado', () => {
    expect(summarizeOutbox([])).toEqual({ pendingCount: 0, blockedCount: 0, failed: [] });
  });
});
