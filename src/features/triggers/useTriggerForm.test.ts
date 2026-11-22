import { act, renderHook } from '@testing-library/react-native';

import type { TriggerDraft } from './trigger.types';
import { useTriggerForm } from './useTriggerForm';

jest.setTimeout(20000);

async function setup(maxTimes: number) {
  const onCommit = jest.fn<void, [TriggerDraft[]]>();
  const hook = await renderHook(() =>
    useTriggerForm({
      maxTimes,
      onCommit,
      onNeedPermission: jest.fn(),
      findMissingPermission: async () => null,
    }),
  );
  return { ...hook, onCommit };
}

describe('useTriggerForm: varias horas', () => {
  it('guarda un aviso por hora, con los mismos días', async () => {
    const { result, onCommit } = await setup(5);
    await act(async () => result.current.setDays([1, 3]));
    await act(async () => result.current.addTime());
    await act(async () => result.current.addTime());
    await act(async () => result.current.save());

    const [drafts] = onCommit.mock.calls[0];
    expect(drafts.map((draft) => (draft.type === 'schedule' ? draft.time : null))).toEqual([
      { hour: 7, minute: 0 },
      { hour: 8, minute: 0 },
      { hour: 9, minute: 0 },
    ]);
    expect(drafts.every((draft) => draft.type === 'schedule' && draft.days.join() === '1,3')).toBe(true);
  });

  it('una hora repetida se guarda una sola vez', async () => {
    const { result, onCommit } = await setup(5);
    await act(async () => result.current.addTime());
    await act(async () => result.current.setExtraTime(0, { hour: 7, minute: 0 }));
    expect(result.current.count).toBe(1);
    await act(async () => result.current.save());
    expect(onCommit.mock.calls[0][0]).toHaveLength(1);
  });

  it('no deja añadir más horas que el cupo de la rutina', async () => {
    const { result } = await setup(2);
    expect(result.current.canAddTime).toBe(true);
    await act(async () => result.current.addTime());
    expect(result.current.canAddTime).toBe(false);
  });

  it('con cupo de uno (editar) no ofrece horas extra', async () => {
    const { result } = await setup(1);
    expect(result.current.canAddTime).toBe(false);
  });
});
