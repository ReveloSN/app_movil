import { emptyDocument } from '@/db/local/local.store';
import { op, record } from '@/db/local/testing/outbox.fixtures';
import type { Routine } from '@/shared/types/routine.types';

import { describeChange, discardMessage, failureReason } from './sync.describe';

const routine: Routine = {
  id: 'r1',
  userId: 'u1',
  name: 'Salir de casa',
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};
const tables = { ...emptyDocument().tables, routines: [routine] };

describe('describeChange', () => {
  it('nombra la rutina, el ítem o la red con lo que hay en el teléfono', () => {
    expect(describeChange(op({ kind: 'insert', table: 'routines', id: 'r1', values: {} }), tables)).toBe(
      'Crear la rutina «Salir de casa»',
    );
    expect(describeChange(op({ kind: 'insert', table: 'items', id: 'i1', values: { label: 'Llaves', routineId: 'r1' } }), tables)).toBe(
      'Agregar el ítem «Llaves»',
    );
    expect(describeChange(op({ kind: 'insert', table: 'homeNetworks', id: 'n1', values: { displayName: 'Casa' } }), tables)).toBe(
      'Agregar la red «Casa»',
    );
  });

  it('a los avisos y verificaciones los nombra por su rutina', () => {
    expect(describeChange(op({ kind: 'insert', table: 'triggers', id: 't1', values: { routineId: 'r1' } }), tables)).toBe(
      'Agregar un aviso a «Salir de casa»',
    );
    expect(describeChange(op({ kind: 'insertRecord', record: record('rec-1', 'r1') }), tables)).toBe(
      'Guardar la verificación de «Salir de casa»',
    );
  });

  it('si ya no sabe el nombre, lo describe sin él', () => {
    expect(describeChange(op({ kind: 'update', table: 'routines', id: 'gone', changes: {} }), tables)).toBe('Cambiar una rutina');
    expect(describeChange(op({ kind: 'deleteRoutine', id: 'gone' }), tables)).toBe('Eliminar una rutina');
    expect(describeChange(op({ kind: 'update', table: 'settings', id: 'u1', changes: {} }), tables)).toBe('Guardar tus ajustes');
  });
});

describe('failureReason', () => {
  it('explica en palabras simples por qué el servidor no lo aceptó', () => {
    expect(failureReason({ code: '23514', message: '' })).toMatch(/límite/);
    expect(failureReason({ code: '23503', message: '' })).toMatch(/otro dispositivo/);
    expect(failureReason({ code: null, message: 'x' })).toBe('El servidor no aceptó el cambio.');
  });
});

describe('discardMessage', () => {
  it('sin dependientes, solo pide confirmar', () => {
    const failed = op({ kind: 'update', table: 'items', id: 'i1', changes: {} });

    expect(discardMessage([failed])).toBe('¿Descartar este cambio? Se perderá y quedará lo que haya en el servidor.');
  });

  it('con dependientes, dice cuántos de cada cosa se descartan también', () => {
    const failed = op({ kind: 'insert', table: 'routines', id: 'r1', values: {} });
    const dependents = [
      ...['i1', 'i2', 'i3', 'i4'].map((id) => op({ kind: 'insert', table: 'items', id, values: { routineId: 'r1' } })),
      op({ kind: 'insert', table: 'triggers', id: 't1', values: { routineId: 'r1' } }),
      op({ kind: 'insertRecord', record: record('a', 'r1') }),
      op({ kind: 'insertRecord', record: record('b', 'r1') }),
    ];

    expect(discardMessage([failed, ...dependents])).toBe(
      'Se descartarán también 4 ítems, 1 aviso y 2 verificaciones de esta rutina. ¿Descartar?',
    );
  });
});
