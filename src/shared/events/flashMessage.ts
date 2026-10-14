import { useSyncExternalStore } from 'react';

/**
 * Mensaje de confirmación de una sola vez entre pantallas (ej. CF-03 al volver a Inicio tras
 * guardar). Observer mínimo: quien lo muestra lo descarta al salir de la pantalla.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export function showFlashMessage(message: string): void {
  current = message;
  notify();
}

export function clearFlashMessage(): void {
  if (current === null) return;
  current = null;
  notify();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useFlashMessage = (): string | null => useSyncExternalStore(subscribe, () => current);
