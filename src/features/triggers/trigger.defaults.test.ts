import { renderHook } from '@testing-library/react-native';

import { defaultTriggerKindFor, defaultWindowFor } from './trigger.defaults';
import { useTriggerForm } from './useTriggerForm';

jest.setTimeout(20000);

const options = { onCommit: jest.fn(), onNeedPermission: jest.fn() };

describe('aviso por defecto según el tipo de rutina', () => {
  it('una rutina de llegada propone llegar al Wi-Fi; una de salida, el horario', () => {
    expect(defaultTriggerKindFor('arrival')).toBe('wifi_enter');
    expect(defaultTriggerKindFor('departure')).toBe('schedule');
    expect(defaultTriggerKindFor()).toBe('schedule');
  });

  it('la franja propuesta al llegar es de tarde y noche', () => {
    expect(defaultWindowFor('arrival')).toEqual({ start: { hour: 16, minute: 0 }, end: { hour: 23, minute: 0 } });
    expect(defaultWindowFor('departure').start.hour).toBe(6);
  });

  it('el editor de avisos arranca en «Llegar al Wi-Fi» para una rutina de llegada', async () => {
    const { result } = await renderHook(() => useTriggerForm({ ...options, routineKind: 'arrival' }));
    expect(result.current.kind).toBe('wifi_enter');
    expect(result.current.timeWindow.start.hour).toBe(16);
  });

  it('editar un aviso ya guardado conserva su tipo', async () => {
    const { result } = await renderHook(() =>
      useTriggerForm({ ...options, routineKind: 'arrival', initial: { type: 'schedule', time: { hour: 7, minute: 0 }, days: [1] } }),
    );
    expect(result.current.kind).toBe('schedule');
  });

  it('sin tipo de rutina se comporta como antes', async () => {
    const { result } = await renderHook(() => useTriggerForm(options));
    expect(result.current.kind).toBe('schedule');
  });
});
