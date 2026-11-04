import { useEffect, useState } from 'react';

/** Retardo mínimo antes de mostrar un esqueleto: si la carga es instantánea, nunca parpadea. */
export const SKELETON_DELAY_MS = 150;

/**
 * Devuelve `active` solo después de que lleva `delayMs` seguido en true; vuelve a false al instante.
 * Sirve para mostrar un esqueleto únicamente cuando la carga realmente tarda.
 */
export function useDelayedFlag(active: boolean, delayMs: number = SKELETON_DELAY_MS): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, delayMs]);

  return active && elapsed;
}
