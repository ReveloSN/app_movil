import { classifyOutbox, discardOp, retryOp } from './outbox.dependencies';
import { failure, forgot, op, record } from './testing/outbox.fixtures';

const statuses = (outbox: Parameters<typeof classifyOutbox>[0]) =>
  classifyOutbox(outbox).map(({ op: item, status }) => [item.opId, status]);

describe('classifyOutbox', () => {
  it('sin fallos, todo está listo y en el orden de la cola', () => {
    const routine = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });

    expect(statuses([routine, item])).toEqual([
      [routine.opId, 'ready'],
      [item.opId, 'ready'],
    ]);
  });

  it('si falla el insert de una rutina, se bloquean sus ítems, sus avisos y sus verificaciones', () => {
    const routine = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } }, { failed: failure });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });
    const trigger = op({ kind: 'insert', table: 'triggers', id: 't1', values: { id: 't1', routineId: 'r1', networkId: null } });
    const verification = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });
    const otherRoutine = op({ kind: 'insert', table: 'routines', id: 'r2', values: { id: 'r2' } });

    expect(statuses([routine, item, trigger, verification, otherRoutine])).toEqual([
      [routine.opId, 'failed'],
      [item.opId, 'blocked'],
      [trigger.opId, 'blocked'],
      [verification.opId, 'blocked'],
      [otherRoutine.opId, 'ready'],
    ]);
  });

  it('si falla el insert de una rutina, sus olvidos quedan bloqueados; los de otra rutina siguen listos', () => {
    const routine = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } }, { failed: failure });
    const blocked = op({ kind: 'insertForgot', event: forgot('f1', 'r1') });
    const other = op({ kind: 'insertForgot', event: forgot('f2', 'r2') });

    expect(statuses([routine, blocked, other])).toEqual([
      [routine.opId, 'failed'],
      [blocked.opId, 'blocked'],
      [other.opId, 'ready'],
    ]);
  });

  it('un olvido fallido no bloquea a nadie (nada depende de él)', () => {
    const failed = op({ kind: 'insertForgot', event: forgot('f1', 'r1') }, { failed: failure });
    const next = op({ kind: 'insertForgot', event: forgot('f2', 'r1') });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });

    expect(statuses([failed, next, item])).toEqual([
      [failed.opId, 'failed'],
      [next.opId, 'ready'],
      [item.opId, 'ready'],
    ]);
  });

  it('si falla el insert de una red, se bloquean los avisos de Wi-Fi que la usan, no los de horario', () => {
    const routine = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } });
    const network = op({ kind: 'insert', table: 'homeNetworks', id: 'n1', values: { id: 'n1' } }, { failed: failure });
    const wifi = op({ kind: 'insert', table: 'triggers', id: 't1', values: { id: 't1', routineId: 'r1', networkId: 'n1' } });
    const schedule = op({ kind: 'insert', table: 'triggers', id: 't2', values: { id: 't2', routineId: 'r1', networkId: null } });

    expect(statuses([routine, network, wifi, schedule])).toEqual([
      [routine.opId, 'ready'],
      [network.opId, 'failed'],
      [wifi.opId, 'blocked'],
      [schedule.opId, 'ready'],
    ]);
  });

  it('el bloqueo es transitivo: red fallida → aviso bloqueado → sus cambios posteriores también', () => {
    const network = op({ kind: 'insert', table: 'homeNetworks', id: 'n1', values: { id: 'n1' } }, { failed: failure });
    const wifi = op({ kind: 'insert', table: 'triggers', id: 't1', values: { id: 't1', routineId: 'r1', networkId: 'n1' } });
    const later = op({ kind: 'update', table: 'triggers', id: 't1', changes: { active: false } });

    expect(statuses([network, wifi, later]).map(([, status]) => status)).toEqual(['failed', 'blocked', 'blocked']);
  });

  it('un update fallido bloquea los cambios posteriores de la misma fila, pero no a sus hijos (la fila existe)', () => {
    const update = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'x'.repeat(30) } }, { failed: failure });
    const later = op({ kind: 'update', table: 'routines', id: 'r1', changes: { icon: 'key' } });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });

    expect(statuses([update, later, item]).map(([, status]) => status)).toEqual(['failed', 'blocked', 'ready']);
  });
});

describe('discardOp / retryOp', () => {
  const routine = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } }, { failed: failure });
  const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });
  const verification = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });
  const unrelated = op({ kind: 'insert', table: 'routines', id: 'r2', values: { id: 'r2' } });

  it('descartar una operación fallida descarta también las que dependen de ella, y dice cuántas son', () => {
    const { outbox, discarded } = discardOp([routine, item, verification, unrelated], routine.opId);

    expect(outbox).toEqual([unrelated]);
    expect(discarded.map((item_) => item_.opId)).toEqual([routine.opId, item.opId, verification.opId]);
  });

  it('reintentar quita la marca de fallo: la operación y sus dependientes vuelven a estar listos', () => {
    const outbox = retryOp([routine, item, verification], routine.opId);

    expect(statuses(outbox).map(([, status]) => status)).toEqual(['ready', 'ready', 'ready']);
  });
});
