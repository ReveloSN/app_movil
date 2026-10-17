import { act, renderHook } from '@testing-library/react-native';

import { useRoutineForm } from './useRoutineForm';

jest.setTimeout(20000);

const draft = {
  name: 'Salir',
  items: [
    { label: 'Llaves', kind: 'carry' as const, critical: false },
    { label: 'Billetera', kind: 'carry' as const, critical: false },
    { label: 'Celular', kind: 'carry' as const, critical: false },
  ],
};

async function setup() {
  return renderHook(() => useRoutineForm({ save: jest.fn(), onSaved: jest.fn(), initialDraft: draft }));
}

describe('useRoutineForm: quitar y deshacer', () => {
  it('quitar devuelve lo necesario para deshacer y "Deshacer" lo pone donde estaba', async () => {
    const { result } = await setup();
    const key = result.current.items[1].key;

    let removed: ReturnType<typeof result.current.removeItem> = null;
    await act(async () => {
      removed = result.current.removeItem(key);
    });
    expect(result.current.items.map((item) => item.label)).toEqual(['Llaves', 'Celular']);

    await act(async () => result.current.restoreItem(removed!));
    expect(result.current.items.map((item) => item.label)).toEqual(['Llaves', 'Billetera', 'Celular']);
  });

  it('deshacer dos veces no duplica el ítem', async () => {
    const { result } = await setup();
    let removed: ReturnType<typeof result.current.removeItem> = null;
    await act(async () => {
      removed = result.current.removeItem(result.current.items[0].key);
    });
    await act(async () => result.current.restoreItem(removed!));
    await act(async () => result.current.restoreItem(removed!));
    expect(result.current.items).toHaveLength(3);
  });

  it('un doble toque en guardar solo guarda una vez', async () => {
    let resolve: (value: { status: 'failed'; error: string }) => void = () => undefined;
    const save = jest.fn(() => new Promise<{ status: 'failed'; error: string }>((done) => (resolve = done)));
    const { result } = await renderHook(() => useRoutineForm({ save, onSaved: jest.fn(), initialDraft: draft }));

    await act(async () => {
      void result.current.submit();
      void result.current.submit();
    });
    await act(async () => resolve({ status: 'failed', error: 'x' }));

    expect(save).toHaveBeenCalledTimes(1);
  });
});
