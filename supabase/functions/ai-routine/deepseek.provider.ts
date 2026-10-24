// Proveedor DeepSeek (API compatible con OpenAI, salida JSON). Solo usa fetch: se prueba con Jest.
// Docs: https://api-docs.deepseek.com/guides/json_mode

import { AiError } from './contract.ts';
import type { AiGeneration, AiProvider } from './provider.ts';

interface DeepSeekConfig {
  apiKey: string;
  /** Ej. "deepseek-flash". Viene del secreto DEEPSEEK_MODEL. */
  model: string;
  /** Tiempo máximo de la llamada. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEFAULT_TIMEOUT_MS = 20_000;

interface DeepSeekResponse {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
}

/** DeepSeek no impone el esquema: se le muestra en el prompt (y exige la palabra "json"). */
const systemWithSchema = (system: string, schema: Record<string, unknown>) =>
  `${system}\n\nResponde solo con un objeto json que cumpla este esquema:\n${JSON.stringify(schema)}`;

export function createDeepSeekProvider({ apiKey, model, timeoutMs = DEFAULT_TIMEOUT_MS, fetch: doFetch = fetch }: DeepSeekConfig): AiProvider {
  return {
    name: 'deepseek',
    async generate({ system, user, schema }: AiGeneration): Promise<string> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await doFetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemWithSchema(system, schema) },
              { role: 'user', content: user },
            ],
            temperature: 0.4,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
            // El razonamiento viene activado por defecto y solo añade espera.
            thinking: { type: 'disabled' },
          }),
          signal: controller.signal,
        });
      } catch (cause) {
        if (controller.signal.aborted) throw new AiError('provider_timeout', 'El proveedor tardó demasiado.');
        throw new AiError('provider_error', `No se pudo llamar al proveedor (${cause instanceof Error ? cause.name : 'error'}).`);
      } finally {
        clearTimeout(timer);
      }

      // No se registra el cuerpo: podría repetir el texto de la persona.
      if (!response.ok) throw new AiError('provider_error', `El proveedor respondió ${response.status}.`);
      const data = (await response.json().catch(() => null)) as DeepSeekResponse | null;
      const choice = data?.choices?.[0];
      const text = choice?.message?.content ?? '';
      if (!text.trim()) throw new AiError('invalid_output', `Respuesta vacía (${choice?.finish_reason ?? 'sin motivo'}).`);
      return text;
    },
  };
}
