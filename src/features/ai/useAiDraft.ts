import { useCallback, useState } from 'react';

import { aiErrorMessage } from './ai.copy';
import type { AiRoutineSeed } from './ai.draft';
import { requestRoutineDraft } from './ai.service';
import { AiClientError } from './ai.types';

type Request = typeof requestRoutineDraft;

/** "Crear borrador": estado de carga y mensaje de error que orienta. Devuelve el borrador o null. */
export function useAiDraft(request: Request = requestRoutineDraft) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (prompt: string): Promise<AiRoutineSeed | null> => {
      setLoading(true);
      setError(null);
      try {
        return await request(prompt);
      } catch (cause) {
        if (__DEV__ && !(cause instanceof AiClientError)) console.warn('[ai.draft]', cause);
        setError(aiErrorMessage(cause instanceof AiClientError ? cause.kind : 'server'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  return { create, loading, error, clearError: () => setError(null) };
}
