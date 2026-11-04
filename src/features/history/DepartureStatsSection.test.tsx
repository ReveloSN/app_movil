import { act, render, screen } from '@testing-library/react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { DepartureStatsSection } from './DepartureStatsSection';
import { departureSummary } from './stats';
import * as copy from './stats.copy';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

// Miércoles 4/11/2026; offset 0 para no depender de la zona de la máquina.
const NOW = new Date(Date.UTC(2026, 10, 4, 12, 0));
const utc = () => 0;
const record = (id: string, day: number, result: string, routineId = 'out'): VerificationRecord =>
  ({ id, routineId, date: new Date(Date.UTC(2026, 10, day, 8)).toISOString(), result, itemsChecked: [], durationSeconds: 5 }) as VerificationRecord;

const summaryOf = (records: VerificationRecord[]) => departureSummary(records, new Set(['out']), NOW, utc);

async function show(records: VerificationRecord[], status: 'loading' | 'empty' | 'ready' = 'ready') {
  await render(
    <TestProviders>
      <DepartureStatsSection status={status} summary={summaryOf(records)} />
    </TestProviders>,
  );
  // Deja terminar las animaciones de entrada y los contadores.
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(useReducedMotion).mockReturnValue(true);
});
afterEach(() => jest.useRealTimers());

describe('DepartureStatsSection', () => {
  it('con datos: rachas, cumplimiento, total y semana con sus etiquetas', async () => {
    await show([
      record('a', 2, 'completed'),
      record('b', 2, 'partial'),
      record('c', 3, 'completed'),
      record('d', 4, 'completed'),
      record('e', 4, 'completed'),
      record('f', 4, 'skipped'),
      record('x', 4, 'completed', 'arrival'),
    ]);

    expect(screen.getByLabelText('Racha actual: 3 días')).toBeTruthy();
    expect(screen.getByLabelText('Mejor racha: 3 días')).toBeTruthy();
    expect(screen.getAllByText('días')).toHaveLength(2);
    expect(screen.getByLabelText('Últimos 7 días: 67 %, 1 parcial no cuenta')).toBeTruthy();
    expect(screen.getByLabelText('Últimos 30 días: 67 %, 1 parcial no cuenta')).toBeTruthy();
    expect(screen.getAllByText('67 %')).toHaveLength(2);
    expect(screen.getAllByText('1 parcial no cuenta')).toHaveLength(2);
    expect(screen.getByLabelText('Salidas completadas: 4')).toBeTruthy();

    expect(screen.getByLabelText('Salidas completadas esta semana: 4')).toBeTruthy();
    expect(screen.getByLabelText('lunes, 1 salida completada')).toBeTruthy();
    expect(screen.getByLabelText('martes, 1 salida completada')).toBeTruthy();
    expect(screen.getByLabelText('miércoles (hoy), 2 salidas completadas')).toBeTruthy();
    expect(screen.getByLabelText('viernes, todavía no llega')).toBeTruthy();
    expect(screen.getByText('X', { includeHiddenElements: true })).toBeTruthy();
  });

  it('rate nulo: «Sin salidas aún» en vez de 0 %', async () => {
    // Una salida hace 20 días: entra en 30 días pero no en 7.
    const oldRecord: VerificationRecord = { ...record('o', 1, 'completed'), date: new Date(Date.UTC(2026, 9, 15, 8)).toISOString() };
    await show([oldRecord]);

    expect(screen.getByLabelText('Últimos 7 días: sin salidas aún')).toBeTruthy();
    expect(screen.getByText(copy.NO_DEPARTURES_YET)).toBeTruthy();
    expect(screen.queryByText('0 %')).toBeNull();
    expect(screen.getByLabelText('Últimos 30 días: 100 %')).toBeTruthy();
    expect(screen.getByLabelText('Racha actual: 0 días')).toBeTruthy();
    expect(screen.getByLabelText('Mejor racha: 1 día')).toBeTruthy();
  });

  it('sin salidas: estado vacío amable', async () => {
    await show([], 'empty');
    expect(screen.getByText(copy.STATS_EMPTY_TITLE)).toBeTruthy();
    expect(screen.getByText(copy.STATS_EMPTY_MESSAGE)).toBeTruthy();
    expect(screen.queryByLabelText(/Racha actual/)).toBeNull();
  });

  it('cargando: placeholder anunciado', async () => {
    await show([], 'loading');
    expect(screen.getByLabelText(copy.STATS_LOADING_LABEL)).toBeTruthy();
  });
});

describe('stats.copy', () => {
  it('singular y plural', () => {
    expect(copy.daysUnit(1)).toBe('día');
    expect(copy.daysUnit(0)).toBe('días');
    expect(copy.daysUnit(2)).toBe('días');
    expect(copy.partialsNote(0)).toBeNull();
    expect(copy.partialsNote(1)).toBe('1 parcial no cuenta');
    expect(copy.partialsNote(3)).toBe('3 parciales no cuentan');
    expect(copy.completedCount(0)).toBe('sin salidas completadas');
    expect(copy.completedCount(1)).toBe('1 salida completada');
    expect(copy.completedCount(5)).toBe('5 salidas completadas');
  });
});
