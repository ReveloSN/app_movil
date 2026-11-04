import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import { InsightCard } from '@/components/molecules/InsightCard';
import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { createLocalStore, type LocalStore } from '@/db/local/local.store';
import { fixedDeps, memoryStorage } from '@/db/local/testing/memoryStorage';
import { requestPatternInsight } from '@/features/ai/ai.service';
import { AiClientError } from '@/features/ai/ai.types';
import { TestProviders } from '@/shared/testing/TestProviders';

import { resetForgotMigrations } from './forgot.migrate';
import { useForgotItem } from './useForgotItem';
import { useRoutineInsight } from './useRoutineInsight';

const mockLocal: { repositories?: LocalRepositories; store?: LocalStore } = {};
const mockToast = { show: jest.fn(), hide: jest.fn() };
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({
  useLocalRepositories: () => mockLocal.repositories,
  useLocalStore: () => mockLocal.store,
}));
jest.mock('@/features/feedback/toast.context', () => ({ useToast: () => mockToast }));
jest.mock('@/features/routines/useRoutines', () => ({ useRoutines: () => ({ routines: [{ id: 'r1', name: 'Saliendo de casa' }] }) }));
jest.mock('@/features/notifications/TriggerRuntimeProvider', () => ({ useTriggerRuntime: () => ({ rearm: () => Promise.resolve() }) }));
// Por defecto IA apagada: el mensaje es el determinista (la función nunca depende de la IA).
const mockAi = { enabled: false, consented: false };
const mockNetwork = { isConnected: true };
jest.mock('@/features/ai/ai.prefs', () => ({ useAiPrefs: () => mockAi }));
jest.mock('@/features/ai/ai.service', () => ({ requestPatternInsight: jest.fn() }));
jest.mock('@/shared/network/useNetworkStatus', () => ({ useNetworkStatus: () => mockNetwork }));
const mockInsight = jest.mocked(requestPatternInsight);

jest.setTimeout(20000);

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

async function seed() {
  const store = createLocalStore('user-1', memoryStorage());
  const repos = createLocalRepositories(store, fixedDeps());
  mockLocal.repositories = repos;
  mockLocal.store = store;
  const routine = await repos.routines.create({ id: 'r1', name: 'Saliendo de casa', icon: 'home-outline', color: 'green' });
  const charger = await repos.items.create({ routineId: routine.id, label: 'Cargador', type: 'carry', critical: false, sortOrder: 0 });
  for (const days of [1, 3, 5]) {
    await repos.records.create({
      routineId: routine.id,
      result: 'partial',
      date: daysAgo(days),
      itemsChecked: [{ itemId: charger.id, label: 'Cargador', critical: false, checked: false }],
      durationSeconds: 9,
    });
  }
  return { repos, routineId: routine.id, chargerId: charger.id };
}

beforeEach(async () => {
  mockToast.show.mockReset();
  mockInsight.mockReset();
  Object.assign(mockAi, { enabled: false, consented: false });
  mockNetwork.isConnected = true;
  resetForgotMigrations();
  await AsyncStorage.clear();
});

describe('useRoutineInsight', () => {
  it('detecta el olvido y propone marcarlo como crítico; "Sí, marcar" lo actualiza', async () => {
    const { repos, routineId, chargerId } = await seed();
    const { result } = await renderHook(() => useRoutineInsight(routineId));

    await waitFor(() => expect(result.current.message).toBe('Sueles omitir «Cargador». ¿Lo marcamos como crítico?'));
    await act(async () => result.current.accept());

    expect((await repos.items.getByRoutine(routineId)).find((item) => item.id === chargerId)?.critical).toBe(true);
    expect(mockToast.show).toHaveBeenCalledWith('«Cargador» ahora es crítico.');
    expect(result.current.message).toBeNull();
  });

  it('en una rutina de llegada no propone nada aunque haya omisiones', async () => {
    const { repos, routineId } = await seed();
    await repos.routines.update(routineId, { kind: 'arrival' });
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await act(async () => undefined);
    await act(async () => undefined);
    expect(result.current.message).toBeNull();
  });

  it('"Ahora no" lo oculta y no vuelve a salir esa semana', async () => {
    const { routineId } = await seed();
    const first = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(first.result.current.message).not.toBeNull());
    await act(async () => first.result.current.dismiss());
    expect(first.result.current.message).toBeNull();

    const second = await renderHook(() => useRoutineInsight(routineId));
    await act(async () => undefined);
    expect(second.result.current.message).toBeNull();
  });
});

describe('useRoutineInsight con IA', () => {
  const DETERMINISTIC = 'Sueles omitir «Cargador». ¿Lo marcamos como crítico?';

  it('con consentimiento y red, la IA redacta: una sola llamada por apertura', async () => {
    Object.assign(mockAi, { enabled: true, consented: true });
    mockInsight.mockResolvedValue({ message: 'El «Cargador» se te suele quedar. ¿Lo marcamos como crítico?', action: 'mark_critical' });
    const { routineId } = await seed();
    const { result, rerender } = await renderHook(() => useRoutineInsight(routineId));

    await waitFor(() => expect(result.current.message).toBe('El «Cargador» se te suele quedar. ¿Lo marcamos como crítico?'));
    expect(mockInsight).toHaveBeenCalledTimes(1);
    expect(mockInsight).toHaveBeenCalledWith(
      { item: 'Cargador', routine: 'Saliendo de casa', weekday: null, misses: 3, observations: 3, critical: false },
      'item|r1|cargador|',
      'user-1',
    );
    // Se va y vuelve la red: el efecto se repite, pero no hay otra llamada.
    mockNetwork.isConnected = false;
    await rerender({});
    mockNetwork.isConnected = true;
    await rerender({});
    await act(async () => undefined);
    expect(mockInsight).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'sin red',
      () => {
        Object.assign(mockAi, { enabled: true, consented: true });
        mockNetwork.isConnected = false;
      },
    ],
    ['sin consentimiento', () => Object.assign(mockAi, { enabled: true, consented: false })],
    ['con la IA apagada', () => Object.assign(mockAi, { enabled: false, consented: true })],
  ])('%s no llama a la IA y queda el texto local', async (_case, setup) => {
    setup();
    const { routineId } = await seed();
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(result.current.message).toBe(DETERMINISTIC));
    await act(async () => undefined);
    expect(mockInsight).not.toHaveBeenCalled();
  });

  it.each([
    ['sin cuota (429)', () => mockInsight.mockRejectedValue(new AiClientError('quota_exceeded'))],
    ['error del servidor', () => mockInsight.mockRejectedValue(new AiClientError('server'))],
    ['acción distinta a la del botón', () => mockInsight.mockResolvedValue({ message: 'Otra cosa', action: 'none' })],
  ])('%s → texto determinista local', async (_case, setup) => {
    Object.assign(mockAi, { enabled: true, consented: true });
    setup();
    const { routineId } = await seed();
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(mockInsight).toHaveBeenCalledTimes(1));
    await act(async () => undefined);
    expect(result.current.message).toBe(DETERMINISTIC);
  });

  it('un patrón pospuesto no llama a la IA', async () => {
    Object.assign(mockAi, { enabled: true, consented: true });
    const { routineId } = await seed();
    const first = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(first.result.current.message).not.toBeNull());
    await act(async () => first.result.current.dismiss());
    mockInsight.mockClear();

    const second = await renderHook(() => useRoutineInsight(routineId));
    await act(async () => undefined);
    expect(second.result.current.message).toBeNull();
    expect(mockInsight).not.toHaveBeenCalled();
  });
});

describe('useRoutineInsight con olvidos ("Olvidé algo")', () => {
  const DAY_PLURAL = ['Los domingos', 'Los lunes', 'Los martes', 'Los miércoles', 'Los jueves', 'Los viernes', 'Los sábados'];
  // El mismo día de la semana (hora local) de las últimas semanas.
  const weeksAgo = (weeks: number) => new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000 - 60_000).toISOString();
  const lead = () => DAY_PLURAL[new Date(weeksAgo(1)).getDay()];

  /** 3 olvidos de `label` el mismo día de la semana y 4 salidas ese día. */
  async function seedForgot(label: string) {
    const seeded = await seed();
    for (const weeks of [1, 2, 3]) await seeded.repos.forgotEvents.add({ routineId: seeded.routineId, label, date: weeksAgo(weeks) });
    for (const weeks of [1, 2, 3, 4]) {
      await seeded.repos.records.create({ routineId: seeded.routineId, result: 'completed', date: weeksAgo(weeks), durationSeconds: 5 });
    }
    return seeded;
  }

  it('un ítem que no está en la rutina: "Agregar a la rutina" lo agrega', async () => {
    const { repos, routineId } = await seedForgot('Paraguas');
    const { result } = await renderHook(() => useRoutineInsight(routineId));

    await waitFor(() => expect(result.current.message).toBe(`${lead()} sueles olvidar «Paraguas». ¿Lo agregamos a tu rutina?`));
    expect(result.current.acceptLabel).toBe('Agregar a la rutina');
    await act(async () => result.current.accept());

    expect((await repos.items.getByRoutine(routineId)).map((item) => item.label)).toEqual(['Cargador', 'Paraguas']);
    expect(mockToast.show).toHaveBeenCalledWith('Añadimos «Paraguas» a tu rutina.');
    expect(result.current.message).toBeNull();
  });

  it('con la rutina llena avisa y no agrega', async () => {
    const { repos, routineId } = await seedForgot('Paraguas');
    for (let i = 1; i < 12; i += 1) await repos.items.create({ routineId, label: `Ítem ${i}`, sortOrder: i });
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(result.current.acceptLabel).toBe('Agregar a la rutina'));

    await act(async () => result.current.accept());

    expect(await repos.items.getByRoutine(routineId)).toHaveLength(12);
    expect(result.current.error).toBe('Tu rutina ya tiene 12 ítems: quita uno para agregarlo.');
    expect(result.current.message).not.toBeNull();
  });

  it('un ítem que ya está (escrito distinto): "Marcar crítico"', async () => {
    const { repos, routineId, chargerId } = await seedForgot('cargadór');
    const { result } = await renderHook(() => useRoutineInsight(routineId));

    await waitFor(() => expect(result.current.message).toBe(`${lead()} sueles olvidar «cargadór». ¿Lo marcamos como crítico?`));
    expect(result.current.acceptLabel).toBe('Marcar crítico');
    await act(async () => result.current.accept());

    expect((await repos.items.getByRoutine(routineId)).find((item) => item.id === chargerId)?.critical).toBe(true);
    expect(await repos.items.getByRoutine(routineId)).toHaveLength(1);
  });

  it('la IA recibe el olvido agregado (source forgot) y solo se usa si propone la misma acción', async () => {
    Object.assign(mockAi, { enabled: true, consented: true });
    mockInsight.mockResolvedValue({ message: 'Se te suele quedar el «Paraguas». ¿Lo agregamos a tu rutina?', action: 'add_item' });
    const { routineId } = await seedForgot('Paraguas');
    const { result } = await renderHook(() => useRoutineInsight(routineId));

    await waitFor(() => expect(result.current.message).toBe('Se te suele quedar el «Paraguas». ¿Lo agregamos a tu rutina?'));
    expect(mockInsight).toHaveBeenCalledTimes(1);
    const weekday = new Date(weeksAgo(1)).getDay();
    expect(mockInsight).toHaveBeenCalledWith(
      { source: 'forgot', label: 'Paraguas', routine: 'Saliendo de casa', weekday, misses: 3, observations: 4, inRoutine: false, critical: false },
      `forgot_weekday|r1|paraguas|${weekday}`,
      'user-1',
    );
  });

  it('sin red ni IA, la sugerencia del olvido sale igual (texto local)', async () => {
    mockNetwork.isConnected = false;
    const { routineId } = await seedForgot('Paraguas');
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(result.current.message).toContain('«Paraguas»'));
    expect(mockInsight).not.toHaveBeenCalled();
  });

  it('migra antes los olvidos que vivían solo en el teléfono', async () => {
    const { routineId } = await seed();
    const old = [1, 2, 3].map((weeks) => ({ id: `old-${weeks}`, routineId, recordId: null, label: 'Gafas', date: weeksAgo(weeks) }));
    await AsyncStorage.setItem('forgot-events:user-1', JSON.stringify(old));
    for (const weeks of [1, 2, 3, 4]) {
      await mockLocal.repositories!.records.create({ routineId, result: 'completed', date: weeksAgo(weeks), durationSeconds: 5 });
    }
    const { result } = await renderHook(() => useRoutineInsight(routineId));
    await waitFor(() => expect(result.current.message).toContain('«Gafas»'));
    expect(await AsyncStorage.getItem('forgot-events:user-1')).toBeNull();
  });
});

describe('useForgotItem ("Olvidé algo")', () => {
  it('añade el ítem a la rutina y anota el olvido', async () => {
    const { repos, routineId } = await seed();
    const { result } = await renderHook(() => useForgotItem(routineId, 'rec-1'));

    let done = false;
    await act(async () => {
      done = await result.current.add('  Paraguas ');
    });

    expect(done).toBe(true);
    expect((await repos.items.getByRoutine(routineId)).map((item) => item.label)).toContain('Paraguas');
    expect(await repos.forgotEvents.getAll()).toEqual([expect.objectContaining({ routineId, recordId: 'rec-1', label: 'Paraguas' })]);
    // Se anotó en la copia local y quedó en la cola para subir (funciona sin red).
    const { outbox } = await mockLocal.store!.read();
    expect(outbox.some((pending) => pending.kind === 'insertForgot' && pending.event.label === 'Paraguas')).toBe(true);
    expect(mockToast.show).toHaveBeenCalledWith('Añadimos «Paraguas» a tu rutina.');
  });

  it('con 12 ítems lo anota pero no lo añade (límite)', async () => {
    const { repos, routineId } = await seed();
    for (let i = 1; i < 12; i += 1) await repos.items.create({ routineId, label: `Ítem ${i}`, sortOrder: i });
    const { result } = await renderHook(() => useForgotItem(routineId, null));

    await act(async () => {
      await result.current.add('Paraguas');
    });

    expect(await repos.items.getByRoutine(routineId)).toHaveLength(12);
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('12 ítems') }));
    expect(await repos.forgotEvents.getAll()).toHaveLength(1);
  });

  it('si el ítem ya está en la rutina (sin importar mayúsculas ni tildes) lo anota sin duplicarlo', async () => {
    const { repos, routineId } = await seed();
    const { result } = await renderHook(() => useForgotItem(routineId, null));
    await act(async () => {
      await result.current.add('cargadór');
    });
    expect(await repos.items.getByRoutine(routineId)).toHaveLength(1);
    expect(await repos.forgotEvents.getAll()).toHaveLength(1);
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ message: 'Lo anotamos. «cargadór» ya está en tu rutina.' }));
  });

  it('migra antes los olvidos que vivían solo en el teléfono, una sola vez', async () => {
    const { repos, routineId } = await seed();
    const old = { id: 'old-1', routineId, recordId: null, label: 'Llaves', date: daysAgo(10) };
    await AsyncStorage.setItem('forgot-events:user-1', JSON.stringify([old]));
    const { result } = await renderHook(() => useForgotItem(routineId, null));

    await act(async () => {
      await result.current.add('Paraguas');
    });
    await act(async () => {
      await result.current.add('Gafas');
    });

    const events = await repos.forgotEvents.getAll();
    expect(events.map((event) => event.label).sort()).toEqual(['Gafas', 'Llaves', 'Paraguas']);
    expect(await AsyncStorage.getItem('forgot-events:user-1')).toBeNull();
    const { outbox } = await mockLocal.store!.read();
    expect(outbox.filter((pending) => pending.kind === 'insertForgot' && pending.event.id === 'old-1')).toHaveLength(1);
  });

  it('sin texto no guarda y explica qué falta', async () => {
    const { routineId } = await seed();
    const { result } = await renderHook(() => useForgotItem(routineId, null));
    let done = true;
    await act(async () => {
      done = await result.current.add('   ');
    });
    expect(done).toBe(false);
    expect(result.current.error).toBe('Escribe el ítem.');
  });
});

describe('InsightCard', () => {
  it('muestra el mensaje y sus dos acciones; con error, lo dice', async () => {
    const onAccept = jest.fn();
    const onDismiss = jest.fn();
    await render(
      <TestProviders>
        <InsightCard icon="bulb-outline" message="Sueles omitir «Cargador»." acceptLabel="Sí, marcar" dismissLabel="Ahora no" onAccept={onAccept} onDismiss={onDismiss} error="No pudimos actualizar la rutina." />
      </TestProviders>,
    );
    expect(screen.getByText('Sueles omitir «Cargador».')).toBeTruthy();
    expect(screen.getByText('No pudimos actualizar la rutina.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, marcar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ahora no' }));
    expect(onAccept).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('mientras guarda, la acción principal está ocupada y "Ahora no" desactivado', async () => {
    await render(
      <TestProviders>
        <InsightCard icon="bulb-outline" message="Hola" acceptLabel="Sí, marcar" dismissLabel="Ahora no" onAccept={jest.fn()} onDismiss={jest.fn()} busy />
      </TestProviders>,
    );
    expect(screen.getByRole('button', { name: 'Sí, marcar' }).props.accessibilityState).toMatchObject({ busy: true });
    expect(screen.getByRole('button', { name: 'Ahora no' }).props.accessibilityState).toMatchObject({ disabled: true });
  });
});
