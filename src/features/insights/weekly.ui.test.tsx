import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import { WeekSummaryCard } from '@/components/molecules/WeekSummaryCard';
import { memoryStorage } from '@/db/local/testing/memoryStorage';
import { requestWeekSummary } from '@/features/ai/ai.service';
import { AiClientError } from '@/features/ai/ai.types';
import { TestProviders } from '@/shared/testing/TestProviders';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { useWeeklySummary, WEEKLY_FALLBACK_NOTE } from './useWeeklySummary';
import { createWeeklySummaryStore } from './weekly.store';

const mockAccess = { visible: true, online: true, whenConsented: (action: () => void) => action(), consent: { visible: false, onAccept: jest.fn(), onDecline: jest.fn() } };
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@/features/ai/useAiAccess', () => ({ useAiAccess: () => mockAccess }));
jest.mock('@/features/ai/ai.service', () => ({ requestWeekSummary: jest.fn() }));

jest.setTimeout(20000);

const NOW = new Date(2026, 9, 15, 20, 0);
const RECORDS: VerificationRecord[] = [
  { id: 'a', routineId: 'r1', date: new Date(2026, 9, 12, 7).toISOString(), result: 'completed', itemsChecked: [], durationSeconds: 5 },
  {
    id: 'b',
    routineId: 'r1',
    date: new Date(2026, 9, 14, 7).toISOString(),
    result: 'partial',
    itemsChecked: [{ label: 'Cargador', critical: false, checked: false }],
    durationSeconds: 5,
  },
];
const mockedRequest = requestWeekSummary as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockedRequest.mockReset();
  mockAccess.visible = true;
  mockAccess.online = true;
});

describe('useWeeklySummary', () => {
  it('con IA: lo redacta la IA, lo guarda por semana y sirve sin conexión', async () => {
    mockedRequest.mockResolvedValue({ resumen: 'Buena semana.', recomendacion: 'Deja el cargador junto a las llaves.' });
    const { result } = await renderHook(() => useWeeklySummary(RECORDS, NOW));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.generate());

    await waitFor(() => expect(result.current.summary?.source).toBe('ai'));
    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ weekStart: '2026-10-12', completed: 1, partial: 1 }));
    expect(await createWeeklySummaryStore('user-1').get('2026-10-12')).toMatchObject({ resumen: 'Buena semana.', source: 'ai' });

    // Al volver (otra vez montado), se lee del teléfono sin llamar a la IA.
    const again = await renderHook(() => useWeeklySummary(RECORDS, NOW));
    await waitFor(() => expect(again.result.current.summary?.resumen).toBe('Buena semana.'));
    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it('si la IA falla (sin cuota), avisa y muestra el resumen automático', async () => {
    mockedRequest.mockRejectedValue(new AiClientError('quota_exceeded'));
    const { result } = await renderHook(() => useWeeklySummary(RECORDS, NOW));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.generate());

    await waitFor(() => expect(result.current.summary?.source).toBe('local'));
    expect(result.current.notice).toContain(WEEKLY_FALLBACK_NOTE);
    expect(result.current.summary?.recomendacion).toContain('Cargador');
  });

  it('si el servidor aún no tiene el modo (entrada inválida), dice que la IA no está disponible', async () => {
    mockedRequest.mockRejectedValue(new AiClientError('invalid_input'));
    const { result } = await renderHook(() => useWeeklySummary(RECORDS, NOW));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.generate());
    await waitFor(() => expect(result.current.summary?.source).toBe('local'));
    expect(result.current.notice).not.toContain('demasiado largo');
  });

  it('sin conexión (o con la IA apagada) no llama a la IA: resumen automático', async () => {
    mockAccess.online = false;
    const { result } = await renderHook(() => useWeeklySummary(RECORDS, NOW));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.generate());

    await waitFor(() => expect(result.current.summary?.source).toBe('local'));
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('semana sin verificaciones: vacía', async () => {
    const { result } = await renderHook(() => useWeeklySummary([], NOW));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.empty).toBe(true);
  });
});

describe('weekly.store', () => {
  it('guarda solo las últimas 12 semanas y tolera datos corruptos', async () => {
    const storage = memoryStorage({ 'weekly-summary:u1': '{roto' });
    const store = createWeeklySummaryStore('u1', storage);
    expect(await store.get('2026-10-12')).toBeNull();
    for (let i = 0; i < 14; i += 1) {
      await store.set(`2026-${String(i + 1).padStart(2, '0')}-01`, { resumen: 'r', recomendacion: 'x', source: 'local', createdAt: '' });
    }
    expect(Object.keys(JSON.parse(storage.data['weekly-summary:u1']))).toHaveLength(12);
    expect(await store.get('2026-01-01')).toBeNull();
  });
});

describe('WeekSummaryCard', () => {
  const renderCard = (props: Parameters<typeof WeekSummaryCard>[0]) =>
    render(
      <TestProviders>
        <WeekSummaryCard {...props} />
      </TestProviders>,
    );

  it('cargando: ocupado y sin texto suelto', async () => {
    await renderCard({ title: 'Tu semana', state: { kind: 'loading' } });
    expect(screen.getByLabelText('Tu semana').props.accessibilityState).toMatchObject({ busy: true });
  });

  it('vacía: lo dice sin culpa', async () => {
    await renderCard({ title: 'Tu semana', state: { kind: 'empty', message: 'Esta semana aún no hay verificaciones.' } });
    expect(screen.getByText('Esta semana aún no hay verificaciones.')).toBeTruthy();
  });

  it('lista: conteos y el botón para generarla', async () => {
    const onGenerate = jest.fn();
    await renderCard({ title: 'Tu semana', state: { kind: 'ready', counts: '1 completa · 1 parcial · 0 hoy no salgo', generateLabel: 'Generar resumen', onGenerate } });
    expect(screen.getByText('1 completa · 1 parcial · 0 hoy no salgo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Generar resumen' })).toBeTruthy();
  });

  it('con resumen y aviso (sin conexión): muestra todo y de dónde salió', async () => {
    await renderCard({
      title: 'Tu semana',
      state: { kind: 'summary', counts: '1 completa', resumen: 'Buena semana.', recomendacion: 'Una cosa.', sourceLabel: 'Resumen automático', ai: false },
      notice: 'Sin conexión. Te mostramos el resumen automático.',
    });
    expect(screen.getByText('Buena semana.')).toBeTruthy();
    expect(screen.getByText('Una cosa.')).toBeTruthy();
    expect(screen.getByText('Resumen automático')).toBeTruthy();
    expect(screen.getByText('Sin conexión. Te mostramos el resumen automático.')).toBeTruthy();
  });
});
