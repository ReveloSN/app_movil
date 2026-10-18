import { SCENE_IMAGES, SCENE_STAGES } from './sceneImages';
import {
  formatSceneHour,
  moonPosition,
  readableTone,
  sceneHeadline,
  sceneTextContrast,
  sceneTone,
  skyGradient,
  stageWeights,
  sunPosition,
} from './sceneTheme';

const sum = (weights: Record<string, number>) => Object.values(weights).reduce((a, b) => a + b, 0);
const HOURS = Array.from({ length: 24 * 12 + 1 }, (_, i) => i / 12); // cada 5 min

describe('stageWeights', () => {
  it('los pesos suman 1 a cualquier hora', () => {
    HOURS.forEach((hour) => expect(sum(stageWeights(hour))).toBeCloseTo(1, 6));
  });

  it('fuera de los cambios hay una sola imagen', () => {
    expect(stageWeights(8)).toEqual({ morning: 1, midday: 0, evening: 0, night: 0 });
    expect(stageWeights(13)).toEqual({ morning: 0, midday: 1, evening: 0, night: 0 });
    expect(stageWeights(17.5)).toEqual({ morning: 0, midday: 0, evening: 1, night: 0 });
    expect(stageWeights(23)).toEqual({ morning: 0, midday: 0, evening: 0, night: 1 });
    expect(stageWeights(2)).toEqual({ morning: 0, midday: 0, evening: 0, night: 1 });
  });

  it.each([
    [5.5, 'night', 'morning'],
    [10.5, 'morning', 'midday'],
    [16.5, 'midday', 'evening'],
    [19, 'evening', 'night'],
  ] as const)('a las %s mezcla mitad y mitad (%s → %s)', (hour, from, to) => {
    const weights = stageWeights(hour);
    expect(weights[from]).toBeCloseTo(0.5, 6);
    expect(weights[to]).toBeCloseTo(0.5, 6);
  });

  it('el fundido dura 45 min centrado en el cambio', () => {
    expect(stageWeights(19 - 0.375 - 0.01).evening).toBe(1);
    expect(stageWeights(19 - 0.2).night).toBeGreaterThan(0);
    expect(stageWeights(19 + 0.2).evening).toBeGreaterThan(0);
    expect(stageWeights(19 + 0.375 + 0.01).night).toBe(1);
  });

  it('es continuo: cada 5 min ningún peso salta más de 0,25', () => {
    for (let i = 1; i < HOURS.length; i++) {
      const before = stageWeights(HOURS[i - 1]);
      const after = stageWeights(HOURS[i]);
      SCENE_STAGES.forEach((stage) => expect(Math.abs(after[stage] - before[stage])).toBeLessThanOrEqual(0.25));
    }
  });

  it('da la vuelta a medianoche sin saltos', () => {
    expect(stageWeights(24)).toEqual(stageWeights(0));
    expect(stageWeights(-1)).toEqual(stageWeights(23));
  });
});

describe('textos de la escena', () => {
  it.each([
    [7, 'Buenos días', 'Antes de cruzar la puerta'],
    [12, 'Buenas tardes', 'Lo importante, contigo'],
    [18, 'Buenas tardes', '¿Vas saliendo?'],
    [22, 'Buenas noches', 'Cierra el día con calma'],
    [3, 'Buenas noches', 'Cierra el día con calma'],
  ])('a las %s: «%s» y «%s»', (hour, greeting, title) => {
    expect(sceneHeadline(hour)).toMatchObject({ greeting, title });
  });

  it('a cualquier hora el texto se lee sobre el cielo con su velo (≥ 4,5:1)', () => {
    HOURS.forEach((hour) => {
      const { top, horizon } = skyGradient(hour);
      const tone = sceneTone(hour);
      expect(Math.min(sceneTextContrast(tone, top), sceneTextContrast(tone, horizon))).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('el texto de la banda de Inicio, con su tono y su velo, supera 4,5:1 a cualquier hora', () => {
    HOURS.forEach((hour) => {
      const { top, horizon } = skyGradient(hour);
      const tone = readableTone([top, horizon]);
      expect(Math.min(sceneTextContrast(tone, top), sceneTextContrast(tone, horizon))).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('formatea la hora del modo demostración', () => {
    expect(formatSceneHour(7.25)).toBe('07:15');
    expect(formatSceneHour(24.5)).toBe('00:30');
  });
});

describe('sol y luna', () => {
  it('el sol sale bajo a la izquierda, sube y se pone a la derecha', () => {
    const rise = sunPosition(5.6);
    const noon = sunPosition(12.35);
    const set = sunPosition(19.1);
    expect(rise.x).toBeLessThan(0.15);
    expect(noon.y).toBeLessThan(rise.y);
    expect(set.x).toBeGreaterThan(0.85);
    expect(noon.opacity).toBe(1);
  });

  it('de noche no hay sol; de día no hay luna', () => {
    expect(sunPosition(23).opacity).toBe(0);
    expect(sunPosition(3).opacity).toBe(0);
    expect(moonPosition(12).opacity).toBe(0);
    expect(moonPosition(23).opacity).toBe(1);
    expect(moonPosition(3).opacity).toBe(1);
  });

  it('sol y luna se quedan en la franja de cielo de la imagen', () => {
    HOURS.forEach((hour) => {
      [sunPosition(hour), moonPosition(hour)].forEach(({ x, y }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeLessThanOrEqual(0.42);
      });
    });
  });

  it('la luna avanza de derecha a izquierda durante la noche', () => {
    expect(moonPosition(4).x).toBeLessThan(moonPosition(20).x);
  });
});

describe('colores derivados', () => {
  it('cada imagen tiene su cielo arriba y en el horizonte', () => {
    SCENE_STAGES.forEach((stage) => {
      expect(SCENE_IMAGES[stage].sky.top).toMatch(/^#[0-9A-F]{6}$/);
      expect(SCENE_IMAGES[stage].sky.horizon).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  it('el degradado del cielo es el de la imagen fuera de los cambios', () => {
    expect(skyGradient(13)).toEqual(SCENE_IMAGES.midday.sky);
  });
});
