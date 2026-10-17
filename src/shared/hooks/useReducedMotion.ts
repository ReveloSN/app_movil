import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// Un solo valor para toda la app: se lee al cargar y se actualiza si la persona cambia el ajuste.
let reduced = false;
const listeners = new Set<() => void>();
let started = false;

function set(value: boolean) {
  if (value === reduced) return;
  reduced = value;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled().then(set, () => undefined);
  AccessibilityInfo.addEventListener('reduceMotionChanged', set);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * true si la persona activó "Quitar animaciones" en el sistema. Las animaciones de Reanimated ya lo
 * respetan solas (motion.ts); este hook es para la lógica (ej. no escalonar, no mover al presionar).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduced);
}
