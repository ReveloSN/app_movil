import { act, fireEvent, render, screen } from '@testing-library/react-native';

import * as copy from '@/features/history/history.copy';
import type { HistoryRecord } from '@/features/history/history.pending';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';
import type { Routine } from '@/shared/types/routine.types';

import HistoryScreen from '@/app/(tabs)/history';

const mockHistory: { records: HistoryRecord[]; loading: boolean } = { records: [], loading: false };
const mockRoutines: { list: Routine[] } = { list: [] };
jest.mock('@/shared/hooks/useReducedMotion');
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
}));
jest.mock('@/features/history/useHistory', () => ({
  useHistory: () => ({ records: mockHistory.records, loading: mockHistory.loading, error: null, refresh: () => Promise.resolve() }),
}));
jest.mock('@/features/routines/useRoutines', () => ({
  useRoutines: () => ({ routines: mockRoutines.list, loading: false, error: null, refresh: () => Promise.resolve() }),
}));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u' } }) }));
jest.mock('@/features/history/RecordDetailSheet', () => ({ RecordDetailSheet: () => null }));
jest.mock('@/features/insights/WeekSummarySection', () => ({ WeekSummarySection: () => null }));
jest.setTimeout(20000);

const routine = (id: string, kind: Routine['kind'], name: string): Routine => ({
  id,
  userId: 'u',
  name,
  kind,
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const record = (id: string, routineId: string, result: string): HistoryRecord =>
  ({ id, routineId, date: new Date().toISOString(), result, itemsChecked: [], durationSeconds: 5, pending: false }) as HistoryRecord;

async function renderScreen() {
  await render(
    <TestProviders>
      <HistoryScreen />
    </TestProviders>,
  );
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(useReducedMotion).mockReturnValue(true);
  mockHistory.loading = false;
  mockRoutines.list = [routine('out', 'departure', 'Saliendo de casa'), routine('in', 'arrival', 'Llegando')];
  mockHistory.records = [record('1', 'out', 'completed'), record('2', 'in', 'completed')];
});
afterEach(() => jest.useRealTimers());

describe('Historial con estadísticas', () => {
  it('muestra el listado por defecto y el selector Historial | Estadísticas', async () => {
    await renderScreen();
    // Cada nombre sale dos veces: como chip del filtro y como fila del listado.
    expect(screen.getAllByText('Saliendo de casa')).toHaveLength(2);
    expect(screen.getAllByText('Llegando')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Historial' }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByText('Racha actual')).toBeNull();
  });

  it('«Estadísticas» muestra las métricas de salidas y «Historial» devuelve el listado', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Estadísticas' }));
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByLabelText('Racha actual: 1 día')).toBeTruthy();
    expect(screen.getByLabelText('Salidas completadas: 1')).toBeTruthy();
    expect(screen.queryAllByText('Llegando')).toHaveLength(0);

    await fireEvent.press(screen.getByRole('radio', { name: 'Historial' }));
    expect(screen.getAllByText('Saliendo de casa')).toHaveLength(2);
  });

  it('con solo rutinas de llegada, Estadísticas muestra el estado vacío', async () => {
    mockHistory.records = [record('2', 'in', 'completed')];
    await renderScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Estadísticas' }));
    expect(screen.getByText('Aún no hay salidas')).toBeTruthy();
  });
});

describe('Historial: carga y vacío', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('primera carga: el esqueleto aparece tras el retardo y se anuncia como «Cargando historial»', async () => {
    mockHistory.records = [];
    mockHistory.loading = true;
    await render(
      <TestProviders>
        <HistoryScreen />
      </TestProviders>,
    );
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByRole('progressbar', { name: copy.LOADING_LABEL })).toBeTruthy();
    expect(screen.queryByText(copy.EMPTY_TITLE)).toBeNull();
  });

  it('sin registros: ilustración oculta a TalkBack, título, texto y acción que lleva a Inicio', async () => {
    mockHistory.records = [];
    await renderScreen();
    expect(screen.getByRole('header', { name: copy.EMPTY_TITLE })).toBeTruthy();
    expect(screen.getByText(copy.EMPTY_MESSAGE)).toBeTruthy();
    const art = screen.getByTestId('empty-illustration', { includeHiddenElements: true });
    expect(art.props.accessibilityElementsHidden).toBe(true);
    expect(art.props.importantForAccessibility).toBe('no-hide-descendants');

    await fireEvent.press(screen.getByRole('button', { name: copy.EMPTY_ACTION }));
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
  });
});
