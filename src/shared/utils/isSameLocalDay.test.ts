import { isSameLocalDay } from './isSameLocalDay';

describe('isSameLocalDay', () => {
  const now = new Date(2026, 10, 4, 15, 0);

  it('es verdadero para cualquier hora del mismo día local', () => {
    expect(isSameLocalDay(new Date(2026, 10, 4, 0, 1).toISOString(), now)).toBe(true);
    expect(isSameLocalDay(new Date(2026, 10, 4, 23, 59).toISOString(), now)).toBe(true);
  });

  it('es falso para ayer, mañana y el mismo día de otro mes o año', () => {
    expect(isSameLocalDay(new Date(2026, 10, 3, 23, 59).toISOString(), now)).toBe(false);
    expect(isSameLocalDay(new Date(2026, 10, 5, 0, 0).toISOString(), now)).toBe(false);
    expect(isSameLocalDay(new Date(2026, 9, 4, 12, 0).toISOString(), now)).toBe(false);
    expect(isSameLocalDay(new Date(2025, 10, 4, 12, 0).toISOString(), now)).toBe(false);
  });

  it('es falso sin fecha o con una fecha inválida', () => {
    expect(isSameLocalDay(null, now)).toBe(false);
    expect(isSameLocalDay('no es una fecha', now)).toBe(false);
  });
});
