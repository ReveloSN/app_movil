import { accountLabel, GUEST_SIGN_OUT_MESSAGE, signOutWarning } from './settings.copy';

describe('signOutWarning', () => {
  const account = { id: 'user-1', email: 'ana@example.com', isAnonymous: false };

  it('a un invitado siempre se le advierte que pierde sus rutinas', () => {
    expect(signOutWarning({ ...account, email: null, isAnonymous: true }, 0)).toBe(GUEST_SIGN_OUT_MESSAGE);
  });

  it('con cambios sin sincronizar, avisa cuántos y que quedan en el teléfono', () => {
    expect(signOutWarning(account, 3)).toBe(
      'Tienes 3 cambios sin sincronizar. Quedan guardados en este teléfono y se subirán cuando vuelvas a entrar con esta cuenta.',
    );
  });

  it('sin nada pendiente, se cierra sin preguntar', () => {
    expect(signOutWarning(account, 0)).toBeNull();
  });
});

describe('accountLabel', () => {
  it('muestra el correo de una cuenta normal', () => {
    expect(accountLabel({ id: 'user-1', email: 'ana@example.com', isAnonymous: false })).toBe('ana@example.com');
  });

  it('muestra que es invitado cuando no hay cuenta', () => {
    expect(accountLabel({ id: 'guest-1', email: null, isAnonymous: true })).toBe('Invitado (sin cuenta)');
  });

  it('sin usuario muestra un guion', () => {
    expect(accountLabel(null)).toBe('—');
  });
});
