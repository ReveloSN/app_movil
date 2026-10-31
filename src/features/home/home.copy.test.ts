import { greeting, nextRoutineDescription, nextRoutineWhen, todayLabel } from './home.copy';

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

describe('línea de cuándo de Próxima rutina', () => {
  it('por horario, la hora; por Wi-Fi, la transición sin hora', () => {
    const base = { routineId: 'r1', routineName: 'Salir' };
    expect(nextRoutineDescription({ ...base, kind: 'schedule', at: new Date(2026, 9, 17, 18, 0) }, NOW)).toBe('Hoy, 6:00 p. m.');
    expect(nextRoutineDescription({ ...base, kind: 'wifi_exit' }, NOW)).toBe('Al salir del Wi-Fi');
    expect(nextRoutineDescription({ ...base, kind: 'wifi_enter' }, NOW)).toBe('Al llegar al Wi-Fi');
  });
});

describe('fecha de la banda de Inicio', () => {
  it('día de la semana, número y mes en minúscula', () => {
    expect(todayLabel(NOW)).toBe('Sábado, 17 de octubre');
    expect(todayLabel(new Date(2026, 0, 1))).toBe('Jueves, 1 de enero');
  });
});
