import { fireEvent, render, screen } from '@testing-library/react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';

import { WeeklyBarChart, type WeeklyBarDatum } from './WeeklyBarChart';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

const mockReduced = jest.mocked(useReducedMotion);

const SUMMARY = 'Salidas de esta semana: 6 de 7 días';

const week: WeeklyBarDatum[] = [
  { key: 'mon', label: 'L', value: 2, a11yLabel: 'lunes, 2 salidas completadas' },
  { key: 'tue', label: 'M', value: 0, a11yLabel: 'martes, 0 salidas completadas' },
  { key: 'wed', label: 'X', value: 1, a11yLabel: 'miércoles, 1 salida completada' },
  { key: 'thu', label: 'J', value: 3, a11yLabel: 'jueves, 3 salidas completadas', highlighted: true },
  { key: 'fri', label: 'V', value: 0, a11yLabel: 'viernes, 0 salidas completadas', muted: true },
  { key: 'sat', label: 'S', value: 0, a11yLabel: 'sábado, 0 salidas completadas', muted: true },
  { key: 'sun', label: 'D', value: 0, a11yLabel: 'domingo, 0 salidas completadas', muted: true },
];

/** Da ancho al gráfico (en Jest no hay diseño): dispara el onLayout de la fila de barras, padre de la barra. */
function layoutChart(barLabel: string, width = 280) {
  const row = screen.getByLabelText(barLabel, { includeHiddenElements: true }).parent!;
  fireEvent(row, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 120 } } });
}

describe('WeeklyBarChart', () => {
  beforeEach(() => mockReduced.mockReturnValue(true));

  it('el contenedor se anuncia con su resumen y cada barra con su texto hablado', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={week} summaryLabel={SUMMARY} />
      </TestProviders>,
    );
    expect(screen.getByRole('image', { name: SUMMARY })).toBeTruthy();
    for (const d of week) {
      expect(screen.getByLabelText(d.a11yLabel, { includeHiddenElements: true })).toBeTruthy();
    }
  });

  it('escribe el valor sobre cada barra y oculta el de los días futuros', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={week} summaryLabel={SUMMARY} />
      </TestProviders>,
    );
    expect(screen.getByText('2', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('3', { includeHiddenElements: true })).toBeTruthy();
    // Solo el martes (0, pasado) muestra número; viernes a domingo son futuros y no lo muestran.
    expect(screen.getAllByText('0', { includeHiddenElements: true })).toHaveLength(1);
  });

  it('pinta las etiquetas cortas de los días bajo las barras', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={week} summaryLabel={SUMMARY} />
      </TestProviders>,
    );
    for (const d of week) {
      expect(screen.getByText(d.label, { includeHiddenElements: true })).toBeTruthy();
    }
  });

  it('con un valor 0 y con el ancho medido no se rompe', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={[{ key: 'only', label: 'L', value: 0, a11yLabel: 'lunes, 0 salidas completadas' }]} summaryLabel="Sin salidas" />
      </TestProviders>,
    );
    layoutChart('lunes, 0 salidas completadas');
    expect(screen.getByLabelText('lunes, 0 salidas completadas')).toBeTruthy();
  });

  it('con data vacío solo muestra el resumen', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={[]} summaryLabel="Sin datos esta semana" />
      </TestProviders>,
    );
    expect(screen.getByRole('image', { name: 'Sin datos esta semana' })).toBeTruthy();
  });

  it('acepta un maxValue fijo y no divide por cero si es 0', async () => {
    await render(
      <TestProviders>
        <WeeklyBarChart data={week} maxValue={0} height={80} summaryLabel={SUMMARY} />
      </TestProviders>,
    );
    layoutChart('jueves, 3 salidas completadas');
    expect(screen.getByLabelText('jueves, 3 salidas completadas')).toBeTruthy();
  });

  it('con movimiento normal también llega a dibujar las barras', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <WeeklyBarChart data={week} summaryLabel={SUMMARY} />
      </TestProviders>,
    );
    layoutChart('miércoles, 1 salida completada');
    expect(screen.getByLabelText('miércoles, 1 salida completada')).toBeTruthy();
  });
});
