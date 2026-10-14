import { accountLabel } from './settings.copy';

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
