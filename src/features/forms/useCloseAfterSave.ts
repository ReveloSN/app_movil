import { router } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/features/feedback/toast.context';
import type { ToastOptions } from '@/features/feedback/toast.types';

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

/**
 * A dónde se vuelve al guardar: `home` cierra todo el flujo hasta Inicio (P04, también desde Plantillas);
 * `back` vuelve a la pantalla anterior (P06 → P04). Sin historial (entrada directa), siempre a Inicio.
 */
export type SaveDestination = 'home' | 'back';

const HOME = '/(tabs)';

export function closeTo(destination: SaveDestination): void {
  if (!router.canGoBack()) router.replace(HOME);
  else if (destination === 'home') router.dismissTo(HOME);
  else router.back();
}

/**
 * Mecanismo único de "guardar y cerrar" para las pantallas con DC-03: protege los cambios sin guardar y,
 * tras un guardado correcto, muestra el aviso breve y cierra la pantalla (la protección deja pasar esa
 * salida sin apagarse). Si el guardado falla, quien llama simplemente no llama a `close`.
 */
export function useCloseAfterSave(dirty: boolean, destination: SaveDestination) {
  const guard = useUnsavedChangesGuard(dirty);
  const toast = useToast();
  const { leave } = guard;

  const close = useCallback(
    (message?: string | ToastOptions) => {
      if (message) toast.show(message);
      leave(() => closeTo(destination));
    },
    [toast, leave, destination],
  );

  return { ...guard, close };
}
