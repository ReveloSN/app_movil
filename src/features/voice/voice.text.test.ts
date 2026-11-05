import { composeDictation, normalizeDictation } from './voice.text';

describe('normalizeDictation', () => {
  it('colapsa espacios y saltos de línea y recorta los bordes', () => {
    expect(normalizeDictation('  salgo   a la\nuniversidad \t ')).toBe('salgo a la universidad');
  });

  it('devuelve vacío si solo hay espacios', () => {
    expect(normalizeDictation('   \n ')).toBe('');
    expect(normalizeDictation('')).toBe('');
  });
});

describe('composeDictation', () => {
  it('une lo escrito con lo dictado', () => {
    expect(composeDictation('Salgo', 'a la u', 200)).toBe('Salgo a la u');
  });

  it('sin base, devuelve solo lo dictado', () => {
    expect(composeDictation('', ' hola  mundo ', 200)).toBe('hola mundo');
  });

  it('recorta al máximo sin dejar espacio al final', () => {
    const result = composeDictation('', `${'a'.repeat(9)} ${'b'.repeat(50)}`, 10);
    expect(result).toBe('a'.repeat(9));
    expect(composeDictation('', 'x'.repeat(300), 200)).toHaveLength(200);
  });

  it('vacío si no hay nada', () => {
    expect(composeDictation('', '  ', 200)).toBe('');
  });
});
