import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { usePreventRemove } from 'expo-router/react-navigation';
import { AccessibilityInfo } from 'react-native';

import type { ChecklistItemState } from '@/features/checklist/checklist.types';
import { TestProviders } from '@/shared/testing/TestProviders';

import DepartureModeScreen from '@/app/routine/[id]/go';

const mockReplace = jest.fn();
const mockFinish = jest.fn();
const mockDiscard = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: 'r1' }),
  useNavigation: () => ({}),
}));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));
jest.mock('@/features/forms/useUnsavedChangesGuard', () => ({ dispatchToOwner: jest.fn() }));
jest.mock('@/features/notifications/occurrence.lifecycle', () => ({ closeRoutineOccurrences: () => Promise.resolve() }));
jest.mock('@/shared/haptics/haptics', () => ({ hapticConfirm: jest.fn(), hapticToggleOn: jest.fn(), hapticToggleOff: jest.fn() }));
jest.mock('@/features/routines/useRoutines', () => ({
  useRoutines: () => ({ routines: [{ id: 'r1', name: 'Salir de casa', icon: 'home-outline', color: 'green' }] }),
}));
jest.mock('@/features/checklist/useChecklistDraft', () => ({ useChecklistDraft: () => ({ discard: mockDiscard }) }));
jest.mock('@/features/checklist/useFinishChecklist', () => ({
  useFinishChecklist: () => ({ finish: mockFinish, finishing: false, error: null }),
}));
jest.mock('@/features/checklist/useChecklist', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useState } = require('react');
  const initial: ChecklistItemState[] = [
    { id: 'a', label: 'Llaves', icon: 'key-outline', critical: true, note: null, checked: false },
    { id: 'b', label: 'Cartera', icon: 'wallet-outline', critical: false, note: null, checked: false },
  ];
  return {
    useChecklist: () => {
      const [items, setItems] = useState(initial);
      return {
        items,
        loading: false,
        error: null,
        retry: jest.fn(),
        applyChecked: jest.fn(),
        toggleItem: (id: string) => setItems((current: ChecklistItemState[]) => current.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))),
        progress: { checked: items.filter((i: ChecklistItemState) => i.checked).length, total: items.length },
        startedAt: 0,
      };
    },
  };
});

jest.setTimeout(20000);

const summary = { outcome: 'completed', checked: 2, total: 2, omittedLabels: [], omittedCriticalLabels: [], durationSeconds: 5 };

async function renderScreen() {
  await render(
    <TestProviders>
      <DepartureModeScreen />
    </TestProviders>,
  );
}

describe('Modo salida', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockFinish.mockResolvedValue(summary);
    mockDiscard.mockResolvedValue(undefined);
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('muestra el anillo de avance y los ítems grandes', async () => {
    await renderScreen();
    expect(screen.getByRole('progressbar', { name: '0 de 2 ítems listos' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Llaves, crítico' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Listo, salgo' })).toBeTruthy();
  });

  it('marcar actualiza el avance', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cartera' }));
    expect(screen.getByRole('progressbar', { name: '1 de 2 ítems listos' })).toBeTruthy();
  });

  it('"Listo, salgo" con un crítico sin marcar pregunta antes de guardar (igual que verify)', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cartera' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listo, salgo' }));
    expect(mockFinish).not.toHaveBeenCalled();
    expect(screen.getByText(/«Llaves» es un ítem crítico/)).toBeTruthy();
  });

  it('al marcar todo celebra, y luego guarda el registro y abre el resumen', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Llaves, crítico' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cartera' }));
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Todo listo. Buen camino.');
    expect(mockFinish).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockFinish).toHaveBeenCalledWith('done');
    expect(mockDiscard).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/routine/[id]/summary' }));
  });

  it('durante la celebración, atrás se ignora: no abre el diálogo de salir; fuera de ella, sí', async () => {
    await renderScreen();
    const pressBack = async () => {
      const [, handler] = (usePreventRemove as jest.Mock).mock.calls.at(-1) as [boolean, (event: { data: { action: object } }) => void];
      await act(async () => handler({ data: { action: { type: 'GO_BACK' } } }));
    };

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Llaves, crítico' }));
    await pressBack();
    expect(screen.getByText(/¿Salir sin terminar la verificación\?/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Seguir' }));

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cartera' }));
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Todo listo. Buen camino.');
    await pressBack();
    expect(screen.queryByText(/¿Salir sin terminar la verificación\?/)).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/routine/[id]/summary' }));
  });
});
