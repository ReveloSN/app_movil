import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { AccountSection } from './AccountSection';

const mockUser: { current: { id: string; isAnonymous: boolean; email: string | null } } = {
  current: { id: 'guest-1', isAnonymous: true, email: null },
};
const mockSignOut = jest.fn();
const mockClearStore = jest.fn();
const mockClearHome = jest.fn();

jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: mockUser.current, signOut: mockSignOut }) }));
jest.mock('@/features/sync/SyncProvider', () => ({ useSync: () => ({ pendingCount: 0, failedChanges: [] }) }));
jest.mock('@/db/local/local.store', () => ({ getLocalStore: () => ({ clear: mockClearStore }) }));
jest.mock('@/features/geofence/homeGeofence.store', () => ({ clearHomeGeofence: (...args: unknown[]) => mockClearHome(...args) }));

jest.setTimeout(20000);

async function renderSection() {
  await render(
    <TestProviders>
      <AccountSection />
    </TestProviders>,
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockSignOut.mockResolvedValue({ error: null });
  mockClearStore.mockResolvedValue(undefined);
  mockClearHome.mockResolvedValue(undefined);
});

describe('AccountSection: cerrar sesión', () => {
  it('un invitado pierde su copia local, su casa y los olvidos de la versión anterior', async () => {
    mockUser.current = { id: 'guest-1', isAnonymous: true, email: null };
    await AsyncStorage.setItem('forgot-events:guest-1', '[{"id":"x"}]');
    await AsyncStorage.setItem('forgot-events:otra-cuenta', '[{"id":"y"}]');
    await renderSection();

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    // El invitado confirma en el diálogo (el último botón con ese nombre).
    const buttons = screen.getAllByRole('button', { name: 'Cerrar sesión' });
    await fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockClearHome).toHaveBeenCalledWith('guest-1'));
    expect(mockClearStore).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('forgot-events:guest-1')).toBeNull();
    // Lo de otras cuentas no se toca.
    expect(await AsyncStorage.getItem('forgot-events:otra-cuenta')).not.toBeNull();
  });

  it('una cuenta con correo no borra nada local al cerrar sesión', async () => {
    mockUser.current = { id: 'u-1', isAnonymous: false, email: 'ana@correo.com' };
    await AsyncStorage.setItem('forgot-events:u-1', '[{"id":"x"}]');
    await renderSection();

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockClearStore).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('forgot-events:u-1')).not.toBeNull();
  });
});
