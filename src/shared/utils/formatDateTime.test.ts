import { formatDateTime, formatTime } from './formatDateTime';

// Fechas sin zona: se leen en hora local, como en la app.
describe('formatTime', () => {
  it('usa reloj de 12 horas con a. m. / p. m.', () => {
    expect(formatTime('2026-09-30T08:15:00')).toBe('8:15 a. m.');
    expect(formatTime('2026-09-30T18:00:00')).toBe('6:00 p. m.');
  });

  it('muestra mediodía y medianoche como las 12', () => {
    expect(formatTime('2026-09-30T12:05:00')).toBe('12:05 p. m.');
    expect(formatTime('2026-09-30T00:30:00')).toBe('12:30 a. m.');
  });

  it('devuelve null si la fecha no es válida', () => {
    expect(formatTime('no es fecha')).toBeNull();
  });
});

describe('formatDateTime', () => {
  it('pone el día y la hora de 12 horas', () => {
    const text = formatDateTime('2026-09-30T18:00:00');
    expect(text).toMatch(/^30 \S+, 6:00 p\. m\.$/);
  });

  it('no usa el formato de 24 horas', () => {
    expect(formatDateTime('2026-09-30T08:15:00')).not.toContain('08:15');
  });

  it('devuelve null si la fecha no es válida', () => {
    expect(formatDateTime('no es fecha')).toBeNull();
  });
});
