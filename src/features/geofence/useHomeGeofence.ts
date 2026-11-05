import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';

import { registerHomeGeofence } from './geofence.service';
import type { GeofenceStatus, HomeGeofence } from './geofence.types';
import { clearHomeGeofence, loadHomeGeofence, saveHomeGeofence } from './homeGeofence.store';

/** Lo leído para un usuario: así nunca se muestra la casa de otra sesión mientras carga la nueva. */
interface Loaded {
  userId: string;
  home: HomeGeofence | null;
}

/** La casa de la geocerca del usuario con sesión: leerla, guardarla y quitarla. Solo vive en el teléfono. */
export function useHomeGeofence() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    loadHomeGeofence(userId).then(
      (home) => current && setLoaded({ userId, home }),
      () => current && setLoaded({ userId, home: null }),
    );
    return () => {
      current = false;
    };
  }, [userId]);

  const ready = userId !== null && loaded?.userId === userId;
  const home = ready ? loaded.home : null;

  const save = useCallback(
    async (next: HomeGeofence): Promise<GeofenceStatus> => {
      if (!userId) return 'no-home';
      await saveHomeGeofence(userId, next);
      setLoaded({ userId, home: next });
      // Se (re)registra al guardar: sin permiso de segundo plano queda solo el aviso por Wi-Fi.
      return registerHomeGeofence(userId);
    },
    [userId],
  );

  const remove = useCallback(async () => {
    if (!userId) return;
    await clearHomeGeofence(userId);
    setLoaded({ userId, home: null });
    await registerHomeGeofence(userId); // Sin casa: quita la geocerca del sistema.
  }, [userId]);

  return { home, loading: userId !== null && !ready, save, remove };
}
