import { Redirect } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';

import { LoadingState } from '@/components/molecules/LoadingState';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRoutines } from '@/features/routines/useRoutines';

import { hasFinishedOnboarding, markOnboardingFinished } from './onboardingFlag.store';

/**
 * Lleva al onboarding (P01) en el primer uso: la cuenta no tiene rutinas y este usuario no lo
 * terminó ni lo saltó en este teléfono. Quien ya tiene rutinas (p. ej. en otro teléfono) entra directo.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { routines, loading, error } = useRoutines();
  // Flag leído por usuario: { userId, finished }. Mientras no corresponda al usuario actual, se está leyendo.
  const [flag, setFlag] = useState<{ userId: string; finished: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    hasFinishedOnboarding(userId).then(
      (finished) => {
        if (active) setFlag({ userId, finished });
      },
      // Si no se puede leer, no se bloquea la app.
      () => {
        if (active) setFlag({ userId, finished: true });
      },
    );
    return () => {
      active = false;
    };
  }, [userId]);

  // Quien ya tiene rutinas no necesita el onboarding: se marca para que borrar todas después
  // no lo devuelva al primer uso en plena sesión.
  const hasRoutines = routines.length > 0;
  useEffect(() => {
    if (!userId || !hasRoutines || !flag || flag.userId !== userId || flag.finished) return;
    markOnboardingFinished(userId).then(
      () => setFlag({ userId, finished: true }),
      () => undefined,
    );
  }, [userId, hasRoutines, flag]);

  const flagReady = flag !== null && flag.userId === userId;
  // Con rutinas (o con error al cargarlas) no hace falta saber nada más.
  if (hasRoutines || error) return children;
  if (!flagReady || loading) return <LoadingState />;
  if (!flag.finished) return <Redirect href="/onboarding" />;
  return children;
}
