import { AiClientError, type AiErrorKind, type AiRequest } from './ai.types';

/** Lo que usa el cliente de `supabase.functions.invoke` (inyectable en tests). */
export type InvokeFunction = (
  name: string,
  options: { body: AiRequest },
) => Promise<{ data: unknown; error: { name?: string; context?: unknown } | null }>;

interface AiClientOptions {
  /** Tiempo máximo de espera de la app (algo más que el del servidor con el proveedor). */
  timeoutMs?: number;
  /** Reintentos solo ante un fallo de red. */
  networkRetries?: number;
}

const FUNCTION_NAME = 'ai-routine';
const DEFAULT_TIMEOUT_MS = 15_000;

/** Código de error del servidor → lo que la app distingue. */
const SERVER_CODES: Record<string, AiErrorKind> = {
  quota_exceeded: 'quota_exceeded',
  not_a_routine: 'not_a_routine',
  invalid_output: 'invalid_output',
  invalid_input: 'invalid_input',
  unauthorized: 'unauthorized',
  provider_timeout: 'timeout',
};

const isNetworkError = (error: { name?: string }) => error.name === 'FunctionsFetchError';

/** Lee `{ error: { code } }` de la respuesta HTTP de la función. */
async function kindOfHttpError(context: unknown): Promise<AiErrorKind> {
  const response = context as { json?: () => Promise<unknown>; status?: number } | undefined;
  try {
    const body = (await response?.json?.()) as { error?: { code?: unknown } } | undefined;
    const code = body?.error?.code;
    if (typeof code === 'string' && SERVER_CODES[code]) return SERVER_CODES[code];
  } catch {
    // Cuerpo ilegible: se decide por el estado.
  }
  if (response?.status === 429) return 'quota_exceeded';
  if (response?.status === 401) return 'unauthorized';
  return 'server';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AiClientError('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (cause: unknown) => {
        clearTimeout(timer);
        reject(cause);
      },
    );
  });
}

/**
 * Llama a la función `ai-routine`. Devuelve el `data` crudo (lo valida quien lo usa) o lanza
 * AiClientError con el motivo. Solo reintenta cuando falla la red; nunca ante un error del servidor.
 */
export function createAiClient(invoke: InvokeFunction, { timeoutMs = DEFAULT_TIMEOUT_MS, networkRetries = 1 }: AiClientOptions = {}) {
  return async function call(request: AiRequest): Promise<unknown> {
    for (let attempt = 0; ; attempt += 1) {
      let result: Awaited<ReturnType<InvokeFunction>>;
      try {
        result = await withTimeout(invoke(FUNCTION_NAME, { body: request }), timeoutMs);
      } catch (cause) {
        if (cause instanceof AiClientError) throw cause;
        if (attempt < networkRetries) continue;
        throw new AiClientError('offline');
      }
      const { data, error } = result;
      if (!error) return data;
      if (isNetworkError(error)) {
        if (attempt < networkRetries) continue;
        throw new AiClientError('offline');
      }
      throw new AiClientError(error.name === 'FunctionsHttpError' ? await kindOfHttpError(error.context) : 'server');
    }
  };
}

export type AiClient = ReturnType<typeof createAiClient>;
