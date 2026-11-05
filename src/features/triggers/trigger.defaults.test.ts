import { act, renderHook } from '@testing-library/react-native';

import { allowedTriggerKindsFor, defaultTriggerKindFor, defaultWindowFor } from './trigger.defaults';
import type { TriggerDraft } from './trigger.types';
import { validateTriggerDraft } from './trigger.validation';
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
      useTriggerForm({ ...options, initial: { type: 'wifi_exit', ssid: 'Casa5G', networkName: 'Casa', window: null } }),
    );
    expect(result.current.kind).toBe('wifi_exit');
  });

  it('una rutina de llegada solo admite «Llegar al Wi-Fi»', async () => {
    expect(allowedTriggerKindsFor('arrival')).toEqual(['wifi_enter']);
    expect(allowedTriggerKindsFor('departure')).toEqual(['schedule', 'wifi_exit', 'wifi_enter']);
    const { result } = await renderHook(() => useTriggerForm({ ...options, routineKind: 'arrival' }));
    expect(result.current.allowedKinds).toEqual(['wifi_enter']);
    await act(async () => result.current.setKind('schedule'));
    expect(result.current.kind).toBe('wifi_enter');
  });

  it('un horario heredado en una rutina de llegada se reemplaza por el aviso al llegar', async () => {
    const { result } = await renderHook(() =>
      useTriggerForm({ ...options, routineKind: 'arrival', initial: { type: 'schedule', time: { hour: 7, minute: 0 }, days: [1] } }),
    );
    expect(result.current.kind).toBe('wifi_enter');
  });

  it('la validación rechaza horario y salida del Wi-Fi para una rutina de llegada', () => {
    const schedule: TriggerDraft = { type: 'schedule', time: { hour: 7, minute: 0 }, days: [1] };
    const exit: TriggerDraft = { type: 'wifi_exit', ssid: 'Casa5G', networkName: 'Casa', window: null };
    const enter: TriggerDraft = { type: 'wifi_enter', ssid: 'Casa5G', networkName: 'Casa', window: null };
    expect(validateTriggerDraft(schedule, 'arrival').type).toBeDefined();
    expect(validateTriggerDraft(exit, 'arrival').type).toBeDefined();
    expect(validateTriggerDraft(enter, 'arrival')).toEqual({});
    expect(validateTriggerDraft(schedule, 'departure')).toEqual({});
  });

  it('sin tipo de rutina se comporta como antes', async () => {
    const { result } = await renderHook(() => useTriggerForm(options));
    expect(result.current.kind).toBe('schedule');
  });
});
