// Edge Function `ai-routine` (Deno). Solo cablea el entorno: la lógica vive en handler.ts.
// Secretos: GEMINI_API_KEY y/o DEEPSEEK_API_KEY (al menos uno), GEMINI_MODEL (ej. gemini-3.5-flash-lite),
// DEEPSEEK_MODEL (ej. deepseek-flash), AI_PROVIDERS (orden, ej. "gemini,deepseek"; el primero es el
// principal y el resto, respaldo) y AI_DAILY_LIMIT (opcional, por defecto 20).
// verify_jwt sigue activo (supabase/config.toml).

import { AiError, ERROR_STATUS, type AiErrorCode } from './contract.ts';
import { createDeepSeekProvider } from './deepseek.provider.ts';
import { createFallbackProvider } from './fallback.provider.ts';
import { createGeminiProvider } from './gemini.provider.ts';
import { handleAiRequest } from './handler.ts';
import type { AiProvider } from './provider.ts';
import { consumeAiQuota, pickKey, userIdFromJwt, type SupabaseKeys } from './supabase.rest.ts';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';
const DEFAULT_PROVIDERS = 'gemini,deepseek';
const DEFAULT_DAILY_LIMIT = 20;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

const errorResponse = (code: AiErrorCode, message: string) => json(ERROR_STATUS[code], { error: { code, message } });

/** Registro sin contenido: nunca el texto de la persona ni la respuesta del modelo. */
const logEvent = (event: Record<string, unknown>) => console.log(JSON.stringify({ fn: 'ai-routine', ...event }));

/** Proveedores en el orden de AI_PROVIDERS; los que no tienen clave se omiten. */
function buildProviders(): AiProvider[] {
  const order = (Deno.env.get('AI_PROVIDERS') || DEFAULT_PROVIDERS).split(',').map((name) => name.trim());
  const providers: AiProvider[] = [];
  for (const name of order) {
    if (name === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (apiKey) providers.push(createGeminiProvider({ apiKey, model: Deno.env.get('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL }));
    } else if (name === 'deepseek') {
      const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
      if (apiKey) providers.push(createDeepSeekProvider({ apiKey, model: Deno.env.get('DEEPSEEK_MODEL') || DEFAULT_DEEPSEEK_MODEL }));
    }
  }
  return providers;
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return errorResponse('method_not_allowed', 'Usa POST.');
  const startedAt = Date.now();

  const providers = buildProviders();
  const keys: SupabaseKeys = {
    url: Deno.env.get('SUPABASE_URL') ?? '',
    publishableKey: pickKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'), Deno.env.get('SUPABASE_ANON_KEY')),
    secretKey: pickKey(Deno.env.get('SUPABASE_SECRET_KEYS'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
  };
  if (providers.length === 0 || !keys.url || !keys.publishableKey || !keys.secretKey) {
    logEvent({ code: 'server_misconfigured' });
    return errorResponse('server_misconfigured', 'Falta configurar la función (secretos).');
  }

  const userId = await userIdFromJwt(keys, request.headers.get('Authorization')).catch(() => null);
  if (!userId) return errorResponse('unauthorized', 'Inicia sesión para usar la IA.');

  const limit = Number(Deno.env.get('AI_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const body: unknown = await request.json().catch(() => null);
  const result = await handleAiRequest(body, {
    provider: createFallbackProvider(providers),
    consumeQuota: () =>
      consumeAiQuota(keys, userId, limit).catch((cause: unknown) => {
        throw new AiError('server_error', cause instanceof Error ? cause.message : 'No se pudo leer la cuota.');
      }),
  });

  logEvent({ ...result.log, status: result.status, ms: Date.now() - startedAt });
  return json(result.status, result.body);
});
