import { shouldCommitSwipe, swipeThreshold } from './swipeDecision';

describe('shouldCommitSwipe', () => {
  it('confirma al pasar el umbral aunque sea lento', () => {
    expect(shouldCommitSwipe(swipeThreshold(400), 0, 400)).toBe(true);
    expect(shouldCommitSwipe(300, 10, 400)).toBe(true);
  });

  it('no confirma un recorrido corto y lento', () => {
    expect(shouldCommitSwipe(60, 100, 400)).toBe(false);
    expect(shouldCommitSwipe(0, 0, 400)).toBe(false);
  });

  it('confirma un flick rápido con recorrido mínimo', () => {
    expect(shouldCommitSwipe(50, 1500, 400)).toBe(true);
  });

  it('ignora un roce rápido sin recorrido', () => {
    expect(shouldCommitSwipe(10, 3000, 400)).toBe(false);
  });

  it('no confirma hacia la izquierda', () => {
    expect(shouldCommitSwipe(-300, -2000, 400)).toBe(false);
  });
});
