import { enqueue, enqueueRoutineDeletion } from './outbox.compaction';
import { failure, op, record } from './testing/outbox.fixtures';

describe('enqueue (compactación)', () => {
  it('un insert seguido de un update queda en un solo insert con los valores finales', () => {
    const insert = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1', name: 'Casa', updatedAt: 'x' } });
    const update = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Trabajo' } });

    const outbox = enqueue([insert], update);

    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      kind: 'insert',
      opId: insert.opId,
      at: update.at,
      values: { id: 'r1', name: 'Trabajo', updatedAt: update.at },
    });
  });

  it('dos updates de la misma fila quedan en uno, al final, con los cambios combinados', () => {
    const first = op({ kind: 'update', table: 'items', id: 'i1', changes: { label: 'Llaves', critical: true } });
    const other = op({ kind: 'update', table: 'items', id: 'i2', changes: { label: 'Gafas' } });
    const second = op({ kind: 'update', table: 'items', id: 'i1', changes: { label: 'Llaves de casa' } });

    const outbox = enqueue([first, other], second);

    expect(outbox.map((item) => item.opId)).toEqual([other.opId, second.opId]);
    expect(outbox[1]).toMatchObject({ changes: { label: 'Llaves de casa', critical: true }, at: second.at });
  });

  it('un insert seguido de un delete se anula: nunca llegó al servidor', () => {
    const insert = op({ kind: 'insert', table: 'homeNetworks', id: 'n1', values: { id: 'n1', ssid: 'Casa' } });
    const update = op({ kind: 'update', table: 'homeNetworks', id: 'n1', changes: { displayName: 'Mi casa' } });

    const outbox = enqueue(enqueue([insert], update), op({ kind: 'delete', table: 'homeNetworks', id: 'n1' }));

    expect(outbox).toEqual([]);
  });

  it('un update seguido de un delete deja solo el delete', () => {
    const update = op({ kind: 'update', table: 'items', id: 'i1', changes: { label: 'Llaves' } });
    const remove = op({ kind: 'delete', table: 'items', id: 'i1' });

    expect(enqueue([update], remove)).toEqual([remove]);
  });

  it('no adelanta un cambio que apunta a una fila creada después del insert (respeta las claves foráneas)', () => {
    const trigger = op({ kind: 'insert', table: 'triggers', id: 't1', values: { id: 't1', routineId: 'r1', networkId: null } });
    const network = op({ kind: 'insert', table: 'homeNetworks', id: 'n1', values: { id: 'n1', ssid: 'Casa' } });
    const update = op({ kind: 'update', table: 'triggers', id: 't1', changes: { networkId: 'n1' } });

    const outbox = enqueue([trigger, network], update);

    expect(outbox.map((item) => item.opId)).toEqual([trigger.opId, network.opId, update.opId]);
  });

  it('no mezcla cambios en una operación fallida: el update queda detrás', () => {
    const failedInsert = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } }, { failed: failure });
    const update = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Casa' } });

    expect(enqueue([failedInsert], update)).toEqual([failedInsert, update]);
  });

  it('no mezcla en un insert que se está enviando: el update queda aparte, detrás', () => {
    const sending = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1', name: 'Casa' } }, { sendingSince: 'x' });
    const update = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Trabajo' } });

    expect(enqueue([sending], update)).toEqual([sending, update]);
  });

  it('borrar una fila cuyo insert se está enviando conserva el insert y encola el delete (puede haber llegado)', () => {
    const sending = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } }, { sendingSince: 'x' });
    const remove = op({ kind: 'delete', table: 'items', id: 'i1' });

    expect(enqueue([sending], remove)).toEqual([sending, remove]);
  });

  it('no duplica una verificación ya encolada', () => {
    const first = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });
    const again = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });

    expect(enqueue([first], again)).toEqual([first]);
  });
});

describe('enqueueRoutineDeletion', () => {
  const children = [
    { table: 'items' as const, id: 'i1' },
    { table: 'triggers' as const, id: 't1' },
  ];

  it('rutina ya en el servidor: quita lo pendiente de ella, sus hijos y sus verificaciones, y encola deleteRoutine', () => {
    const update = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Casa' } });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });
    const trigger = op({ kind: 'update', table: 'triggers', id: 't1', changes: { active: false } });
    const verification = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });
    const unrelated = op({ kind: 'insert', table: 'routines', id: 'r2', values: { id: 'r2' } });
    const deletion = op({ kind: 'deleteRoutine', id: 'r1' });

    const outbox = enqueueRoutineDeletion([update, item, trigger, verification, unrelated], deletion, children);

    expect(outbox).toEqual([unrelated, deletion]);
  });

  it('rutina que nunca llegó al servidor: se borra todo lo suyo y no se encola nada', () => {
    const insert = op({ kind: 'insert', table: 'routines', id: 'r1', values: { id: 'r1' } });
    const item = op({ kind: 'insert', table: 'items', id: 'i1', values: { id: 'i1', routineId: 'r1' } });
    const verification = op({ kind: 'insertRecord', record: record('rec-1', 'r1') });

    expect(enqueueRoutineDeletion([insert, item, verification], op({ kind: 'deleteRoutine', id: 'r1' }), children)).toEqual(
      [],
    );
  });
});
