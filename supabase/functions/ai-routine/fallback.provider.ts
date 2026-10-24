// Proveedor con respaldo: prueba los proveedores en orden y pasa al siguiente si uno falla.

import { AiError, type AiErrorCode } from './contract.ts';
import type { AiGeneration, AiProvider } from './provider.ts';

/** Fallos del proveedor (no de la entrada de la persona): vale la pena probar con otro. */
const RETRYABLE: readonly AiErrorCode[] = ['provider_timeout', 'provider_error', 'invalid_output'];

export function createFallbackProvider(providers: readonly AiProvider[]): AiProvider {
  if (providers.length === 0) throw new Error('Se necesita al menos un proveedor de IA.');
  return {
    name: providers.map((provider) => provider.name).join('+'),
    async generate(request: AiGeneration): Promise<string> {
      let lastError: AiError | null = null;
      for (const provider of providers) {
        try {
          return await provider.generate(request);
        } catch (cause) {
          if (!(cause instanceof AiError) || !RETRYABLE.includes(cause.code)) throw cause;
          lastError = cause;
        }
      }
      throw lastError ?? new AiError('provider_error', 'Ningún proveedor respondió.');
    },
  };
}
