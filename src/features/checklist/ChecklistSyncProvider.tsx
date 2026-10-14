import { useEffect, type ReactNode } from 'react';

import { appRepositories } from '@/db/app.repositories';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';

import { flush } from './pendingSync';

interface ChecklistSyncProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto el repositorio de Supabase. */
  repository?: Pick<VerificationRecordRepository, 'create'>;
}

/**
 * Envía los registros pendientes al abrir la app y cada vez que vuelve la conexión.
 * Solo con sesión: los registros se guardan con la cuenta que los creó.
 */
export function ChecklistSyncProvider({ children, repository = appRepositories.records }: ChecklistSyncProviderProps) {
  const { isConnected } = useNetworkStatus();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isConnected || !userId) return;
    flush(userId, repository).catch((cause: unknown) => {
      if (__DEV__) console.warn('[pendingSync.flush]', cause);
    });
  }, [isConnected, userId, repository]);

  return children;
}
