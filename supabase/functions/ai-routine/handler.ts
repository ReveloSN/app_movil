// Orquestación de una solicitud (servidor), con sus dependencias inyectadas. Sin APIs de Deno.

import {
  AiError,
  ERROR_STATUS,
  type AiErrorCode,
  type AiMode,
  type AiRequest,
  type AiResponse,
  type ErrorBody,
} from './contract.ts';
import { parseRequest } from './input.ts';
import { parseModelJson, sanitizeDraft, sanitizeSuggestions } from './output.ts';
import { responseSchemaFor, systemPromptFor, userMessageFor } from './prompt.ts';
import type { AiProvider } from './provider.ts';
import { sanitizeInsight, sanitizeWeekly } from './stats.ts';

export interface HandlerDeps {
  provider: AiProvider;
  /** Suma una llamada a la cuota diaria del usuario. false si ya estaba agotada (atómico en SQL). */
  consumeQuota(): Promise<boolean>;
}

export interface HandlerResult {
  status: number;
  body: AiResponse | ErrorBody;
  /** Para el registro: modo y código de error, nunca el contenido. */
  log: { mode: AiMode | null; code: AiErrorCode | null };
}

const errorResult = (code: AiErrorCode, message: string, mode: AiMode | null): HandlerResult => ({
  status: ERROR_STATUS[code],
  body: { error: { code, message } },
  log: { mode, code },
});

function toResponse(request: AiRequest, raw: Record<string, unknown>): AiResponse {
  switch (request.mode) {
    case 'draft':
      return { mode: 'draft', draft: sanitizeDraft(raw) };
    case 'suggest':
      return { mode: 'suggest', suggestions: sanitizeSuggestions(raw, request.items) };
    case 'insights':
      return { mode: 'insights', insight: sanitizeInsight(raw, request) };
    case 'weekly_summary':
      return { mode: 'weekly_summary', summary: sanitizeWeekly(raw) };
  }
}

/**
 * Valida la entrada, cobra la cuota, llama al proveedor y valida su salida. La cuota se cobra antes
 * de llamar (así un abuso nunca llega al proveedor): un intento fallido también cuenta.
 */
export async function handleAiRequest(body: unknown, deps: HandlerDeps): Promise<HandlerResult> {
  let mode: AiMode | null = null;
  try {
    const request = parseRequest(body);
    mode = request.mode;
    if (!(await deps.consumeQuota())) throw new AiError('quota_exceeded', 'Se agotaron las sugerencias con IA de hoy.');

    const text = await deps.provider.generate({
      system: systemPromptFor(request.mode),
      user: userMessageFor(request),
      schema: responseSchemaFor(request.mode),
    });
    const raw = parseModelJson(text);
    const result = toResponse(request, raw);
    return { status: 200, body: result, log: { mode, code: null } };
  } catch (cause) {
    if (cause instanceof AiError) return errorResult(cause.code, cause.message, mode);
    return errorResult('server_error', 'Error inesperado del servidor.', mode);
  }
}
