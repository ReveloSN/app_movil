import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppearanceSection } from '@/features/settings/AppearanceSection';
import { TestProviders } from '@/shared/testing/TestProviders';
import { ThemeModeContext } from '@/shared/theme/themeMode.context';

describe('AppearanceSection', () => {
  it('muestra Claro, Oscuro y Sistema con la preferencia marcada y la cambia', async () => {
    const setPreference = jest.fn();
    await render(
      <TestProviders>
        <ThemeModeContext.Provider value={{ mode: 'light', preference: 'system', setPreference }}>
          <AppearanceSection />
        </ThemeModeContext.Provider>
      </TestProviders>,
    );
    expect(screen.getByRole('radio', { name: 'Sistema' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('radio', { name: 'Claro' }).props.accessibilityState).toMatchObject({ selected: false });
    await fireEvent.press(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(setPreference).toHaveBeenCalledWith('dark');
  });
});
