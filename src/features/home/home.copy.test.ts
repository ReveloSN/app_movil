import { nextRoutineWhen } from './home.copy';

// Sábado 17 de octubre de 2026, 10:00.
const NOW = new Date(2026, 9, 17, 10, 0);

describe('cuándo es la próxima rutina', () => {
  it('hoy, mañana o el día de la semana, con la hora en formato "6:00 p. m."', () => {
    expect(nextRoutineWhen(new Date(2026, 9, 17, 18, 0), NOW)).toBe('Hoy, 6:00 p. m.');
    expect(nextRoutineWhen(new Date(2026, 9, 18, 7, 5), NOW)).toBe('Mañana, 7:05 a. m.');
    expect(nextRoutineWhen(new Date(2026, 9, 19, 12, 0), NOW)).toBe('Lunes, 12:00 p. m.');
  });
});
