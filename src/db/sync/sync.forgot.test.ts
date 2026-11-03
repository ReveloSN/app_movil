import { FORGOT_EVENTS_LIMIT } from '../local/forgot.events';
import { forgot, op } from '../local/testing/outbox.fixtures';

import { mergeForgotEvents, sameForgotEvents } from './sync.forgot';

const ids = (events: { id: string }[]) => events.map((event) => event.id);

describe('olvidos locales al bajar (mergeForgotEvents)', () => {
  it('une lo del servidor con lo anotado aquí que sigue en la cola', () => {
    const merged = mergeForgotEvents(
      [forgot('local-1', 'r1', { date: '2026-10-16T08:00:00.000Z' }), forgot('srv-1', 'r1')],
      [forgot('srv-1', 'r1'), forgot('srv-2', 'r1', { date: '2026-10-13T08:00:00.000Z' })],
      [op({ kind: 'insertForgot', event: forgot('local-1', 'r1') })],
    );

    expect(ids(merged)).toEqual(['local-1', 'srv-1', 'srv-2']);
  });

  it('lo que solo estaba aquí y ya no está en la cola ni en el servidor desaparece', () => {
    expect(mergeForgotEvents([forgot('gone', 'r1')], [], [])).toEqual([]);
  });

  it('el que llegó al servidor no se duplica aunque siga en la cola', () => {
    const merged = mergeForgotEvents([forgot('f1', 'r1')], [forgot('f1', 'r1')], [op({ kind: 'insertForgot', event: forgot('f1', 'r1') })]);

    expect(ids(merged)).toEqual(['f1']);
  });

  it('quita los de una rutina borrada aquí que aún no se subió', () => {
    const merged = mergeForgotEvents([], [forgot('srv-1', 'r1'), forgot('srv-2', 'r2')], [op({ kind: 'deleteRoutine', id: 'r1' })]);

    expect(ids(merged)).toEqual(['srv-2']);
  });

  it('se queda con los más recientes, como mucho el tope', () => {
    const remote = Array.from({ length: FORGOT_EVENTS_LIMIT + 1 }, (_, index) =>
      forgot(`f${index}`, 'r1', { date: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString() }),
    );

    const merged = mergeForgotEvents([], remote, []);

    expect(merged).toHaveLength(FORGOT_EVENTS_LIMIT);
    expect(merged[0].id).toBe(`f${FORGOT_EVENTS_LIMIT}`);
    expect(ids(merged)).not.toContain('f0');
  });

  it('sameForgotEvents compara contenido y orden', () => {
    expect(sameForgotEvents([forgot('a', 'r1')], [forgot('a', 'r1')])).toBe(true);
    expect(sameForgotEvents([forgot('a', 'r1')], [forgot('b', 'r1')])).toBe(false);
  });
});
