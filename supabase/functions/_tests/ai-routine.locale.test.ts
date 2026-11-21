import { handleAiRequest, type HandlerDeps } from '../ai-routine/handler';
import { parseRequest } from '../ai-routine/input';
import { systemPromptFor } from '../ai-routine/prompt';
import type { AiGeneration } from '../ai-routine/provider';

const DRAFT_REPLY = JSON.stringify({
  status: 'ok',
  name: 'Leaving for campus',
  icon: 'school-outline',
  color: 'blue',
  items: [{ label: 'Keys', type: 'carry', critical: true }],
});

describe('ai-routine · idioma de la respuesta', () => {
  it('sin locale, la entrada queda como siempre (apps anteriores)', () => {
    expect(parseRequest({ mode: 'draft', prompt: 'salgo a clase' })).toEqual({ mode: 'draft', prompt: 'salgo a clase' });
    expect(parseRequest({ mode: 'suggest', name: 'Gym', items: [] })).toEqual({ mode: 'suggest', name: 'Gym', items: [] });
  });

  it('acepta "en" y "es" en todos los modos', () => {
    expect(parseRequest({ mode: 'draft', prompt: 'x', locale: 'en' })).toEqual({ mode: 'draft', prompt: 'x', locale: 'en' });
    expect(parseRequest({ mode: 'suggest', name: 'Gym', items: ['Towel'], locale: 'es' })).toMatchObject({ locale: 'es' });
    expect(
      parseRequest({ mode: 'weekly_summary', locale: 'en', stats: { weekStart: '2026-11-02', completed: 3, partial: 0, skipped: 1, streak: 2, previousCompleted: 2, topSkipped: [], bestDay: 1, worstDay: 3 } }),
    ).toMatchObject({ locale: 'en' });
  });

  it('rechaza un idioma que no existe', () => {
    expect(() => parseRequest({ mode: 'draft', prompt: 'x', locale: 'fr' })).toThrow('"locale" debe ser "es" o "en".');
    expect(() => parseRequest({ mode: 'draft', prompt: 'x', locale: 5 })).toThrow('"locale"');
  });

  it('el prompt en español es el de siempre y no menciona inglés', () => {
    const prompt = systemPromptFor('draft');
    expect(prompt).toContain('Hablas en español');
    expect(prompt).toContain('"Saliendo a la universidad"');
    expect(prompt).not.toContain('Idioma de la respuesta');
    expect(systemPromptFor('draft', 'es')).toBe(prompt);
  });

  it('el prompt en inglés pide responder en inglés, con ejemplos en inglés, en todos los modos', () => {
    for (const mode of ['draft', 'suggest', 'insights', 'weekly_summary'] as const) {
      const prompt = systemPromptFor(mode, 'en');
      expect(prompt).toContain('Idioma de la respuesta (obligatorio): inglés');
      expect(prompt).toContain('"Keys"');
      expect(prompt).not.toContain('Hablas en español');
      // La directiva es lo último que lee el modelo.
      expect(prompt.trimEnd().endsWith('no cambian.')).toBe(true);
    }
    expect(systemPromptFor('draft', 'en')).toContain('"Leaving for campus"');
  });

  it('el idioma de la solicitud llega al proveedor', async () => {
    const calls: AiGeneration[] = [];
    const deps: HandlerDeps = {
      consumeQuota: async () => true,
      provider: { name: 'fake', generate: async (request) => (calls.push(request), DRAFT_REPLY) },
    };

    const english = await handleAiRequest({ mode: 'draft', prompt: 'leaving for campus', locale: 'en' }, deps);
    const spanish = await handleAiRequest({ mode: 'draft', prompt: 'salgo a clase' }, deps);

    expect(english.status).toBe(200);
    expect(spanish.status).toBe(200);
    expect(calls[0].system).toContain('Idioma de la respuesta (obligatorio): inglés');
    expect(calls[1].system).not.toContain('Idioma de la respuesta');
  });
});
