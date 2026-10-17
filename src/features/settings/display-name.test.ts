import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName } from './display-name';

describe('nombre de Ajustes', () => {
  it('quita espacios sobrantes', () => {
    expect(normalizeDisplayName('  Ana   María ')).toBe('Ana María');
  });

  it('vacío o solo espacios es "sin nombre"', () => {
    expect(normalizeDisplayName('')).toBeNull();
    expect(normalizeDisplayName('   ')).toBeNull();
  });

  it('nunca pasa del límite de la columna', () => {
    expect(normalizeDisplayName('x'.repeat(40))?.length).toBe(DISPLAY_NAME_MAX_LENGTH);
  });
});
