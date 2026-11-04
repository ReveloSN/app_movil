/** Parte del ancho de la fila que hay que recorrer para que el deslizar cuente. */
export const SWIPE_COMMIT_FRACTION = 0.35;
/** Velocidad (dp/s) a partir de la cual un deslizamiento corto también cuenta (un "flick"). */
export const SWIPE_COMMIT_VELOCITY = 900;
/** Recorrido mínimo (dp) para que un flick cuente: evita marcar por un roce. */
export const SWIPE_MIN_FLICK_DISTANCE = 32;

/** Distancia (dp) a la que el deslizar queda "armado" (cruza el umbral). */
export function swipeThreshold(width: number): number {
  'worklet';
  return width * SWIPE_COMMIT_FRACTION;
}

/**
 * Decide si un deslizamiento a la derecha se confirma al soltar. `dx` = recorrido (dp) y `velocityX` =
 * velocidad (dp/s), ambos hacia la derecha en positivo. Pura: la usa el gesto en el hilo de UI.
 */
export function shouldCommitSwipe(dx: number, velocityX: number, width: number): boolean {
  'worklet';
  if (dx >= swipeThreshold(width)) return true;
  return velocityX >= SWIPE_COMMIT_VELOCITY && dx >= SWIPE_MIN_FLICK_DISTANCE;
}
