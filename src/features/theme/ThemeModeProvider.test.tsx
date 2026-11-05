import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { ThemeModeProvider } from '@/features/theme/ThemeModeProvider';
import { useThemeMode } from '@/shared/theme/themeMode.context';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

let mockScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

function makeStorage(initial: string | null) {
  return {
    getItem: jest.fn().mockResolvedValue(initial),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  } as unknown as KeyValueStorage & { setItem: jest.Mock };
}

function Probe() {
  const { mode, preference, setPreference } = useThemeMode();
  return (
    <>
      <Text>{`${mode}|${preference}`}</Text>
      <Pressable accessibilityLabel="elegir oscuro" onPress={() => setPreference('dark')} />
    </>
  );
}

const tree = (storage: KeyValueStorage) => (
  <ThemeModeProvider storage={storage}>
    <Probe />
  </ThemeModeProvider>
);

async function mount(storage: KeyValueStorage) {
  const utils = await render(tree(storage));
  await act(async () => undefined);
  return utils;
}

describe('ThemeModeProvider', () => {
  it('sin valor guardado sigue al sistema y reacciona a sus cambios', async () => {
    mockScheme = 'dark';
    const storage = makeStorage(null);
    const { rerender } = await mount(storage);
    expect(screen.getByText('dark|system')).toBeTruthy();

    mockScheme = 'light';
    await rerender(tree(storage));
    await act(async () => undefined);
    expect(screen.getByText('light|system')).toBeTruthy();
  });

  it('respeta una preferencia vieja guardada aunque el sistema difiera', async () => {
    mockScheme = 'dark';
    await mount(makeStorage('light'));
    expect(screen.getByText('light|light')).toBeTruthy();
  });

  it('con esquema del sistema desconocido cae a claro', async () => {
    mockScheme = null;
    await mount(makeStorage(null));
    expect(screen.getByText('light|system')).toBeTruthy();
  });

  it('guarda la preferencia elegida', async () => {
    mockScheme = 'light';
    const storage = makeStorage(null);
    await mount(storage);
    await fireEvent.press(screen.getByLabelText('elegir oscuro'));
    expect(screen.getByText('dark|dark')).toBeTruthy();
    expect(storage.setItem).toHaveBeenCalledWith('theme-mode', 'dark');
  });
});
