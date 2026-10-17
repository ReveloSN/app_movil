// Proveedor Gemini (API REST generateContent con salida JSON). Solo usa fetch: se prueba con Jest.
// Docs: https://ai.google.dev/api/generate-content

import { AiError } from './contract.ts';
import type { AiGeneration, AiProvider } from './provider.ts';

interface GeminiConfig {
  apiKey: string;
  /** Ej. "gemini-3.5-flash-lite" (capa gratuita). Viene del secreto GEMINI_MODEL. */
  model: string;
  /** Tiempo máximo de la llamada. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 10_000;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export function createGeminiProvider({ apiKey, model, timeoutMs = DEFAULT_TIMEOUT_MS, fetch: doFetch = fetch }: GeminiConfig): AiProvider {
  return {
    name: 'gemini',
    async generate({ system, user, schema }: AiGeneration): Promise<string> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await doFetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
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
      const data = (await response.json().catch(() => null)) as GeminiResponse | null;
      if (data?.promptFeedback?.blockReason) throw new AiError('provider_error', 'El proveedor bloqueó la solicitud.');
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      if (!text.trim()) throw new AiError('invalid_output', `Respuesta vacía (${candidate?.finishReason ?? 'sin motivo'}).`);
      return text;
    },
  };
}
