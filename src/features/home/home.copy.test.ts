import { greeting, nextRoutineWhen } from './home.copy';

describe('saludo de Inicio (03-1)', () => {
  it('con nombre y según la hora del día', () => {
    expect(greeting('Ana', new Date(2026, 9, 17, 7, 0))).toBe('Buenos días, Ana');
    expect(greeting('Ana', new Date(2026, 9, 17, 15, 0))).toBe('Buenas tardes, Ana');
    expect(greeting('Ana', new Date(2026, 9, 17, 22, 0))).toBe('Buenas noches, Ana');
  });

  it('sin nombre, solo el saludo', () => {
    expect(greeting(null, new Date(2026, 9, 17, 2, 0))).toBe('Buenas noches');
  });
});

// Sábado 17 de octubre de 2026, 10:00.
const NOW = new Date(2026, 9, 17, 10, 0);

describe('cuándo es la próxima rutina', () => {
  it('hoy, mañana o el día de la semana, con la hora en formato "6:00 p. m."', () => {
    expect(nextRoutineWhen(new Date(2026, 9, 17, 18, 0), NOW)).toBe('Hoy, 6:00 p. m.');
    expect(nextRoutineWhen(new Date(2026, 9, 18, 7, 5), NOW)).toBe('Mañana, 7:05 a. m.');
    expect(nextRoutineWhen(new Date(2026, 9, 19, 12, 0), NOW)).toBe('Lunes, 12:00 p. m.');
  });
});
