import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { resetWeatherPrefsForTests } from './weather.prefs';
import { WeatherSettingsSection } from './WeatherSettingsSection';

jest.setTimeout(20000);

const CITIES = {
  results: [{ id: 3688689, name: 'Bogotá', latitude: 4.6097, longitude: -74.0817, country: 'Colombia', admin1: 'Bogotá D.C.' }],
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetWeatherPrefsForTests();
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => CITIES } as Response);
});
afterEach(() => jest.restoreAllMocks());

async function renderSection() {
  await render(
    <TestProviders>
      <WeatherSettingsSection />
    </TestProviders>,
  );
}

describe('Ajustes · Clima', () => {
  it('sin ciudad: el interruptor está desactivado y se ve la atribución', async () => {
    await renderSection();
    expect(screen.getByLabelText('Sugerencias de clima').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText('Datos del clima: Open-Meteo.com')).toBeTruthy();
    expect(screen.getByText('Elige una ciudad para activarlas.')).toBeTruthy();
  });

  it('la primera búsqueda explica qué se envía; al aceptar busca y se elige la ciudad', async () => {
    await renderSection();
    await fireEvent.changeText(screen.getByLabelText('Ciudad para el clima'), 'Bogotá');
    await fireEvent.press(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByText('Se envía la ciudad elegida a Open-Meteo para consultar el clima; no se envía nada más.')).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Entendido' }));
    const option = await screen.findByRole('button', { name: 'Usar Bogotá, Bogotá D.C., Colombia' });
    await fireEvent.press(option);

    await waitFor(() => expect(screen.getByText('Bogotá, Bogotá D.C., Colombia')).toBeTruthy());
    expect(screen.getByLabelText('Sugerencias de clima').props.value).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem('weather-prefs')) ?? '{}')).toMatchObject({ enabled: true, consented: true, city: { name: 'Bogotá' } });
  });

  it('sin red, lo dice con un siguiente paso', async () => {
    await AsyncStorage.setItem('weather-prefs', JSON.stringify({ consented: true, enabled: false, city: null }));
    (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError('Network request failed'));
    await renderSection();
    await fireEvent.changeText(screen.getByLabelText('Ciudad para el clima'), 'Bogotá');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buscar' }).props.accessibilityState).toMatchObject({ disabled: false }));
    await fireEvent.press(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByText('No pudimos buscar la ciudad. Revisa tu conexión e inténtalo de nuevo.')).toBeTruthy();
  });
});
