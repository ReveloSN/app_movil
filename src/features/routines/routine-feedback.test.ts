import { firstRoutineError, savedRoutineMessage } from './routine-feedback';
import { validateRoutineDraft } from './routine.validation';

describe('avisos al guardar una rutina', () => {
  it('al crear sin avisos dice "Rutina guardada."', () => {
    expect(savedRoutineMessage(false, [])).toBe('Rutina guardada.');
  });

  it('al crear con aviso por Wi-Fi usa CF-03 con el nombre de la red', () => {
    expect(savedRoutineMessage(false, ['cuando salgas de Casa'])).toBe('Rutina guardada. Te avisaremos cuando salgas de Casa.');
  });

  it('al editar dice "Cambios guardados." aunque tenga avisos', () => {
    expect(savedRoutineMessage(true, ['cuando salgas de Casa'])).toBe('Cambios guardados.');
  });
});

describe('primer error del formulario', () => {
  it('con el formulario vacío lleva al nombre, con el texto que orienta', () => {
    expect(firstRoutineError(validateRoutineDraft({ name: '', items: [] }))).toEqual({
      field: 'name',
      message: 'Ponle un nombre a tu rutina.',
    });
  });

  it('con nombre y sin ítems lleva a la lista de ítems', () => {
    expect(firstRoutineError(validateRoutineDraft({ name: 'Casa', items: [] }))).toEqual({
      field: 'items',
      message: 'Añade al menos un ítem.',
    });
  });

  it('sin errores no hay a dónde llevar', () => {
    expect(firstRoutineError({})).toBeNull();
  });
});
