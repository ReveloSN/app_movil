import { checksum, decodeRoutineShare, encodeRoutineShare, MAX_CODE_LENGTH, ShareCodeError, type SharedRoutine } from './routine-share.codec';

// Buffer de Node (Jest): base64 estándar, independiente del códec, para comparar.
const NodeBuffer = (globalThis as unknown as {
  Buffer: { from(input: Uint8Array | number[] | string, encoding?: string): { toString(encoding: string): string } };
}).Buffer;

const ROUTINE: SharedRoutine = {
  name: 'Saliendo de casa',
  icon: 'home-outline',
  color: 'blue',
  items: [
    { label: 'Llaves', kind: 'carry', critical: true },
    { label: 'Estufa apagada', kind: 'check', critical: true },
    { label: 'Regar la planta 🌱', kind: 'do', critical: false },
  ],
};

const kindOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (cause) {
    return cause instanceof ShareCodeError ? cause.kind : 'other';
  }
  return 'none';
};

/** Arma un código "a mano" con un JSON cualquiera (para probar la validación). */
const codeFor = (json: string) => {
  const bytes = [...new TextEncoder().encode(json)];
  const b64 = NodeBuffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `VS1:${b64}.${checksum(json)}`;
};

describe('compartir rutina (código)', () => {
  it('ida y vuelta: misma rutina, con tildes y caracteres no latinos', () => {
    const code = encodeRoutineShare(ROUTINE);
    expect(code).toMatch(/^VS1:[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    expect(decodeRoutineShare(code)).toEqual(ROUTINE);
  });

  it('es compacto y coincide con base64url estándar', () => {
    const code = encodeRoutineShare(ROUTINE);
    const json = JSON.stringify({ v: 1, n: ROUTINE.name, i: 'home-outline', c: 'blue', t: [['Llaves', 0, 1], ['Estufa apagada', 2, 1], ['Regar la planta 🌱', 1, 0]] });
    expect(code).toBe(codeFor(json));
    expect(code.length).toBeLessThan(200);
  });

  it('lo encuentra aunque venga dentro del mensaje compartido', () => {
    const code = encodeRoutineShare(ROUTINE);
    expect(decodeRoutineShare(`Te comparto mi rutina:\n\n${code}\n\n¡Pruébala!`).name).toBe('Saliendo de casa');
  });

  it('no lleva avisos ni datos personales: solo nombre, ícono, color e ítems', () => {
    const json = NodeBuffer.from(encodeRoutineShare(ROUTINE).slice(4).split('.')[0], 'base64url').toString('utf8');
    expect(Object.keys(JSON.parse(json))).toEqual(['v', 'n', 'i', 'c', 't']);
  });

  it.each([
    ['vacío', '   ', 'empty'],
    ['sin código', 'hola, ¿cómo estás?', 'not_found'],
    ['otra versión', 'VS2:abcd.0123abcd', 'version'],
    ['cortado o mal copiado (suma distinta)', encodeRoutineShare(ROUTINE).slice(0, -1) + '0', 'checksum'],
    ['demasiado largo', 'x'.repeat(MAX_CODE_LENGTH * 2 + 1), 'too_long'],
    ['base64 inválido', 'VS1:a.0123abcd', 'corrupt'],
  ])('rechaza un código %s', (_case, input, kind) => {
    expect(kindOf(() => decodeRoutineShare(input))).toBe(kind);
  });

  it.each([
    ['versión del JSON distinta', JSON.stringify({ v: 9, n: 'X', i: '', c: '', t: [['A', 0, 0]] }), 'version'],
    ['nombre de más de 24', JSON.stringify({ v: 1, n: 'x'.repeat(25), i: '', c: '', t: [['A', 0, 0]] }), 'invalid'],
    ['sin ítems', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: [] }), 'invalid'],
    ['más de 12 ítems', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: Array.from({ length: 13 }, (_, i) => [`Í${i}`, 0, 0]) }), 'invalid'],
    ['ítem de más de 32', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: [['x'.repeat(33), 0, 0]] }), 'invalid'],
    ['caracteres de control', JSON.stringify({ v: 1, n: 'Ca\u0000sa', i: '', c: '', t: [['A', 0, 0]] }), 'invalid'],
    ['texto bidireccional engañoso', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: [['Llaves‮', 0, 0]] }), 'invalid'],
    ['tipo desconocido', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: [['A', 7, 0]] }), 'invalid'],
    ['crítico no binario', JSON.stringify({ v: 1, n: 'X', i: '', c: '', t: [['A', 0, true]] }), 'invalid'],
    ['JSON roto', '{"v":1,', 'corrupt'],
  ])('rechaza contenido con %s', (_case, json, kind) => {
    expect(kindOf(() => decodeRoutineShare(codeFor(json)))).toBe(kind);
  });

  it('ícono o color desconocidos no rompen: usan los de por defecto', () => {
    const routine = decodeRoutineShare(codeFor(JSON.stringify({ v: 1, n: 'Gimnasio', i: 'rocket', c: 'neon', t: [['Toalla', 0, 0]] })));
    expect(routine).toMatchObject({ icon: 'checkbox-outline', color: 'green' });
  });
});
