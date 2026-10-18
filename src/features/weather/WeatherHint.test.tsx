import { fireEvent, render, screen } from '@testing-library/react-native';

import { toCheckedEntries } from '@/features/checklist/checklist.outcome';
import { detectPatterns } from '@/features/insights/insights.detect';
import { TestProviders } from '@/shared/testing/TestProviders';

import { WeatherHint } from './WeatherHint';
import { WEATHER_RULES } from './weather.rules';

const mockSuggestion = { rule: WEATHER_RULES[0] as (typeof WEATHER_RULES)[number] | null, dismiss: jest.fn() };
jest.mock('./useWeatherSuggestion', () => ({ useWeatherSuggestion: () => mockSuggestion }));

jest.setTimeout(20000);

async function renderHint(onAdd = jest.fn()) {
  await render(
    <TestProviders>
      <WeatherHint onAdd={onAdd} />
    </TestProviders>,
  );
  return onAdd;
}

describe('WeatherHint (P07)', () => {
  beforeEach(() => {
    mockSuggestion.rule = WEATHER_RULES[0];
    mockSuggestion.dismiss.mockReset();
  });

  it('con lluvia: pregunta y "Añadir solo hoy" añade un ítem temporal de origen clima', async () => {
    const onAdd = await renderHint();
    expect(screen.getByText('Hoy puede llover. ¿Añadimos «Paraguas»?')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Añadir solo hoy' }));

    expect(onAdd).toHaveBeenCalledWith({ id: 'weather-umbrella', label: 'Paraguas', icon: 'umbrella-outline', origin: 'weather' });
    expect(mockSuggestion.dismiss).toHaveBeenCalled();
  });

  it('"No" la oculta sin tocar la verificación', async () => {
    const onAdd = await renderHint();
    await fireEvent.press(screen.getByRole('button', { name: 'No' }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(mockSuggestion.dismiss).toHaveBeenCalled();
  });

  it('sin sugerencia (sin ciudad, sin red o sin lluvia) no muestra nada', async () => {
    mockSuggestion.rule = null;
    await renderHint();
    expect(screen.queryByText(/puede llover/)).toBeNull();
  });
});

describe('ítem temporal del clima', () => {
  const temporary = { id: 'weather-umbrella', label: 'Paraguas', icon: 'umbrella-outline', critical: false, note: null, checked: false, origin: 'weather' as const };

  it('queda en el registro con su origen (no cambia la rutina)', () => {
    expect(toCheckedEntries([temporary])).toEqual([{ itemId: 'weather-umbrella', label: 'Paraguas', critical: false, checked: false, origin: 'weather' }]);
  });

  it('no forma patrones de olvido aunque se omita varias veces', () => {
    const records = [1, 2, 3, 4].map((day) => ({
      id: `r${day}`,
      routineId: 'r1',
      date: new Date(Date.now() - day * 86_400_000).toISOString(),
      result: 'partial',
      itemsChecked: toCheckedEntries([temporary]),
      durationSeconds: 5,
    }));
    expect(detectPatterns(records, new Date())).toEqual([]);
  });
});
