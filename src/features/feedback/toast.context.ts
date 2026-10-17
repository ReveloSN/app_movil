import { createContext, useContext } from 'react';

import type { ToastContextValue } from './toast.types';

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Avisos breves (snackbar) que sobreviven a la navegación: `useToast().show('Rutina guardada.')`. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  }
  return context;
}
