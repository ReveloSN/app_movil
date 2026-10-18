import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { createAiClient, type InvokeFunction } from './ai.client';
import { aiErrorMessage } from './ai.copy';
import { toRoutineSeed, toSuggestions } from './ai.draft';
import { DEFAULT_AI_PREFS, loadAiPrefs, saveAiPrefs } from './ai.prefs';
import { AiClientError } from './ai.types';
import { createSuggestionCache, suggestionCacheKey } from './suggestion.cache';

const httpError = (status: number, code?: string) => ({
  name: 'FunctionsHttpError',
  context: { status, json: async () => (code ? { error: { code, message: 'x' } } : null) },
});

const kindOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'ok';
  } catch (cause) {
    return cause instanceof AiClientError ? cause.kind : 'otro';
  }
};

describe('cliente de IA', () => {
  it('llama a ai-routine con el cuerpo y devuelve los datos', async () => {
    const invoke = jest.fn<ReturnType<InvokeFunction>, Parameters<InvokeFunction>>(async () => ({ data: { mode: 'suggest', suggestions: [] }, error: null }));
    const call = createAiClient(invoke);
    await expect(call({ mode: 'suggest', name: 'Gym', items: [] })).resolves.toEqual({ mode: 'suggest', suggestions: [] });
    expect(invoke).toHaveBeenCalledWith('ai-routine', { body: { mode: 'suggest', name: 'Gym', items: [] } });
  });

  it.each([
    ['quota_exceeded', 429, 'quota_exceeded'],
    ['not_a_routine', 422, 'not_a_routine'],
    ['invalid_output', 502, 'invalid_output'],
    ['invalid_input', 400, 'invalid_input'],
    ['provider_timeout', 504, 'timeout'],
    ['provider_error', 502, 'server'],
    [undefined, 429, 'quota_exceeded'],
    [undefined, 500, 'server'],
  ])('mapea el error del servidor %s (%i) a %s', async (code, status, kind) => {
    const call = createAiClient(async () => ({ data: null, error: httpError(status, code) }));
    expect(await kindOf(call({ mode: 'draft', prompt: 'Salgo' }))).toBe(kind);
  });

  it('reintenta una vez solo si falla la red, y luego dice "sin conexión"', async () => {
    const invoke = jest.fn(async () => ({ data: null, error: { name: 'FunctionsFetchError' } }));
    const call = createAiClient(invoke);
    expect(await kindOf(call({ mode: 'draft', prompt: 'Salgo' }))).toBe('offline');
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('si la red vuelve en el reintento, funciona', async () => {
    const invoke = jest
      .fn<ReturnType<InvokeFunction>, Parameters<InvokeFunction>>()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce({ data: { ok: true }, error: null });
    await expect(createAiClient(invoke)({ mode: 'draft', prompt: 'Salgo' })).resolves.toEqual({ ok: true });
  });

  it('no reintenta un error del servidor', async () => {
    const invoke = jest.fn(async () => ({ data: null, error: httpError(429, 'quota_exceeded') }));
    await kindOf(createAiClient(invoke)({ mode: 'draft', prompt: 'Salgo' }));
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('corta por tiempo', async () => {
    const call = createAiClient(() => new Promise(() => undefined), { timeoutMs: 10 });
    expect(await kindOf(call({ mode: 'draft', prompt: 'Salgo' }))).toBe('timeout');
  });

  it('cada error tiene un mensaje que orienta', () => {
    expect(aiErrorMessage('offline')).toMatch(/Conéctate/);
    expect(aiErrorMessage('quota_exceeded')).toMatch(/Mañana/);
  });
});

describe('borrador de IA → valores iniciales de P04', () => {
  const data = (draft: Record<string, unknown>) => ({ mode: 'draft', draft });

  it('convierte un borrador válido, con su aviso por horario', () => {
    const seed = toRoutineSeed(
      data({
        name: 'Salgo a la universidad',
        icon: 'school-outline',
        color: 'blue',
        items: [
          { label: 'Carné', type: 'carry', critical: true },
          { label: 'Portátil', type: 'carry', critical: false, note: 'Con cargador' },
        ],
        trigger: { type: 'schedule', time: '06:30', days: [5, 1] },
      }),
    );
    expect(seed).toEqual({
      draft: {
        name: 'Salgo a la universidad',
        icon: 'school-outline',
        color: 'blue',
        items: [
          { label: 'Carné', kind: 'carry', critical: true },
          { label: 'Portátil', kind: 'carry', critical: false, note: 'Con cargador' },
        ],
      },
      schedule: { type: 'schedule', time: { hour: 6, minute: 30 }, days: [1, 5] },
      suggestsWifiExit: false,
    });
  });

  it('ícono y color inválidos caen a los de por defecto; el tipo desconocido a "llevar"', () => {
    const seed = toRoutineSeed(data({ name: 'Salir', icon: 'rocket', color: 'pink', items: [{ label: 'Llaves', type: 'volar' }] }));
    expect(seed.draft).toMatchObject({ icon: 'checkbox-outline', color: 'green', items: [{ label: 'Llaves', kind: 'carry', critical: false }] });
  });

  it('recorta a 12 ítems (ER-05), los textos a 32/60 y quita repetidos', () => {
    const items = [
      { label: 'Llaves', type: 'carry' },
      { label: 'llaves', type: 'carry' },
      { label: 'x'.repeat(40), type: 'do', note: 'n'.repeat(80) },
      ...Array.from({ length: 20 }, (_, i) => ({ label: `Cosa ${i}`, type: 'check' })),
    ];
    const seed = toRoutineSeed(data({ name: 'Una rutina con nombre muy largo', items }));
    expect(seed.draft.items).toHaveLength(12);
    expect(seed.draft.items[1]).toEqual({ label: 'x'.repeat(32), kind: 'do', critical: false, note: 'n'.repeat(60) });
    expect(seed.draft.name.length).toBeLessThanOrEqual(24);
  });

  it('Wi-Fi se marca como sugerencia; un horario inválido se ignora', () => {
    const base = { name: 'Salir', items: [{ label: 'Llaves', type: 'carry' }] };
    expect(toRoutineSeed(data({ ...base, trigger: { type: 'wifi_exit' } }))).toMatchObject({ schedule: null, suggestsWifiExit: true });
    expect(toRoutineSeed(data({ ...base, trigger: { type: 'schedule', time: '99:00', days: [1] } })).schedule).toBeNull();
  });

  it('sin nombre o sin ítems válidos → invalid_output', async () => {
    expect(await kindOf(Promise.resolve().then(() => toRoutineSeed(data({ name: '', items: [{ label: 'Llaves' }] }))))).toBe('invalid_output');
    expect(await kindOf(Promise.resolve().then(() => toRoutineSeed(data({ name: 'Salir', items: [{ label: '  ' }] }))))).toBe('invalid_output');
    expect(await kindOf(Promise.resolve().then(() => toRoutineSeed('nada')))).toBe('invalid_output');
  });

  it('sugerencias revalidadas: máx. 4, sin repetir las que ya están', () => {
    expect(toSuggestions({ suggestions: ['Toalla', 'Agua', 'agua', 'Candado', 'Tenis', 'Gorra'] }, ['toalla'])).toEqual([
      'Agua',
      'Candado',
      'Tenis',
      'Gorra',
    ]);
  });
});

describe('caché de sugerencias', () => {
  it('la misma rutina (sin importar orden, mayúsculas ni espacios) no repite la llamada', () => {
    const cache = createSuggestionCache();
    cache.set('Gimnasio', ['Toalla', 'Agua'], ['Candado']);
    expect(cache.get(' gimnasio ', ['agua', 'TOALLA'])).toEqual(['Candado']);
    expect(cache.get('Gimnasio', ['Toalla'])).toBeUndefined();
    expect(suggestionCacheKey('A', ['b', 'a'])).toBe(suggestionCacheKey('a', ['A', 'B']));
  });

  it('no crece sin límite', () => {
    const cache = createSuggestionCache(2);
    cache.set('a', [], ['1']);
    cache.set('b', [], ['2']);
    cache.set('c', [], ['3']);
    expect(cache.get('a', [])).toBeUndefined();
    expect(cache.get('c', [])).toEqual(['3']);
  });
});

describe('consentimiento y ajuste local', () => {
  it('por defecto la IA está activa pero sin aceptar el aviso', async () => {
    expect(await loadAiPrefs(memoryStorage())).toEqual(DEFAULT_AI_PREFS);
    expect(DEFAULT_AI_PREFS).toEqual({ enabled: true, consented: false });
  });

  it('guarda la aceptación y el interruptor', async () => {
    const storage = memoryStorage();
    await saveAiPrefs({ enabled: false, consented: true }, storage);
    expect(await loadAiPrefs(storage)).toEqual({ enabled: false, consented: true });
  });

  it('una aceptación del aviso anterior (sin estadísticas) se vuelve a pedir una vez', async () => {
    const storage = memoryStorage({ 'ai-prefs': JSON.stringify({ enabled: true, consented: true }) });
    expect(await loadAiPrefs(storage)).toEqual({ enabled: true, consented: false });
    await saveAiPrefs({ enabled: true, consented: true }, storage);
    expect(await loadAiPrefs(storage)).toEqual({ enabled: true, consented: true });
  });

  it('un valor corrupto vuelve a los valores por defecto', async () => {
    expect(await loadAiPrefs(memoryStorage({ 'ai-prefs': '{roto' }))).toEqual(DEFAULT_AI_PREFS);
  });
});
