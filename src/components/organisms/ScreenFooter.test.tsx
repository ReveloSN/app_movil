import { act, render, screen } from '@testing-library/react-native';
import { Keyboard, StyleSheet, Text } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';
import { spacing } from '@/shared/theme/tokens';

import { ScreenFooter } from './ScreenFooter';

const paddingBottom = () => StyleSheet.flatten(screen.getByTestId('screen-footer').props.style).paddingBottom;

async function renderFooter(bottom: number) {
  await render(
    <TestProviders insets={{ bottom }}>
      <ScreenFooter>
        <Text>Crear rutina</Text>
      </ScreenFooter>
    </TestProviders>,
  );
}

describe('ScreenFooter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('suma el alto de la barra de 3 botones bajo el botón', async () => {
    await renderFooter(48);
    expect(paddingBottom()).toBe(spacing.md + 48);
    expect(screen.getByText('Crear rutina')).toBeTruthy();
  });

  it('con navegación por gestos suma solo la barra fina', async () => {
    await renderFooter(24);
    expect(paddingBottom()).toBe(spacing.md + 24);
  });

  it('con el teclado abierto no suma la barra (el teclado ya la cubre)', async () => {
    // Jest simula Keyboard sin eventos: se capturan los listeners para dispararlos a mano.
    const handlers = new Map<string, () => void>();
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
      handlers.set(event, handler as () => void);
      return { remove: () => handlers.delete(event) } as unknown as ReturnType<typeof Keyboard.addListener>;
    });
    await renderFooter(48);
    await act(async () => handlers.get('keyboardDidShow')?.());
    expect(paddingBottom()).toBe(spacing.md);
    await act(async () => handlers.get('keyboardDidHide')?.());
    expect(paddingBottom()).toBe(spacing.md + 48);
  });
});
