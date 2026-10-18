import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import LoginScreen from '../../../app/(auth)/login';

const mockSignIn = jest.fn();
jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn, signInAsGuest: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useIsFocused: () => true,
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.setTimeout(20000);

async function renderLogin() {
  await render(
    <TestProviders>
      <LoginScreen />
    </TestProviders>,
  );
}

describe('Bienvenida: inicio de sesión', () => {
  beforeEach(() => mockSignIn.mockReset());

  it('muestra la escena, los campos con su etiqueta y las tres acciones', async () => {
    await renderLogin();

    expect(screen.getByLabelText('Paisaje que cambia con la hora del día: una casa con sol o luna')).toBeTruthy();
    expect(screen.getByLabelText('Correo')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar sin cuenta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '¿No tienes cuenta? Regístrate' })).toBeTruthy();
  });

  it('sin datos: errores en línea bajo cada campo, anunciados, y no intenta entrar', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderLogin();

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Escribe tu correo.')).toBeTruthy();
    expect(screen.getByText('Escribe tu contraseña.')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Escribe tu correo.');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('el ojo muestra y oculta la contraseña', async () => {
    await renderLogin();
    const password = screen.getByLabelText('Contraseña');
    expect(password.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeTruthy();
  });

  it('con datos válidos llama al inicio de sesión de siempre', async () => {
    mockSignIn.mockResolvedValue({ error: 'Correo o contraseña incorrectos.' });
    await renderLogin();

    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@correo.com');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secreto1');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(mockSignIn).toHaveBeenCalledWith({ email: 'ana@correo.com', password: 'secreto1' });
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy();
  });
});
