import { completesWithToggle, isAllChecked, progressRatio } from './checklist.progress';

describe('progressRatio', () => {
  it('0/N es 0, parcial es la fracción y completo es 1', () => {
    expect(progressRatio({ checked: 0, total: 4 })).toBe(0);
    expect(progressRatio({ checked: 1, total: 4 })).toBe(0.25);
    expect(progressRatio({ checked: 4, total: 4 })).toBe(1);
  });

  it('sin ítems es 0, no NaN, y nunca pasa de 1', () => {
    expect(progressRatio({ checked: 0, total: 0 })).toBe(0);
    expect(progressRatio({ checked: 5, total: 4 })).toBe(1);
  });
});

describe('isAllChecked', () => {
  it('solo es cierto con todos marcados y al menos un ítem', () => {
    expect(isAllChecked({ checked: 3, total: 3 })).toBe(true);
    expect(isAllChecked({ checked: 2, total: 3 })).toBe(false);
    expect(isAllChecked({ checked: 0, total: 0 })).toBe(false);
  });
});

describe('completesWithToggle', () => {
  it('marcar el último ítem pendiente completa la lista', () => {
    expect(completesWithToggle({ checked: 2, total: 3 }, false)).toBe(true);
  });

  it('desmarcar, marcar uno intermedio o una lista vacía no completan', () => {
    expect(completesWithToggle({ checked: 3, total: 3 }, true)).toBe(false);
    expect(completesWithToggle({ checked: 1, total: 3 }, false)).toBe(false);
    expect(completesWithToggle({ checked: 0, total: 0 }, false)).toBe(false);
  });
});
