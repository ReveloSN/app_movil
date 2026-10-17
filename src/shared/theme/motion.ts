import { Easing, FadeIn, FadeOut, ReduceMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Tokens de movimiento (ver docs/ux/04-motion-y-diseno.md). Animaciones cortas que ayudan a entender
 * o a confirmar: nunca bloquean un toque ni retrasan un resultado. Solo se animan transform y opacity.
 * Todas siguen el ajuste "Quitar animaciones" del sistema (ReduceMotion.System): con él activo, saltan al final.
 */
export const durations = {
  /** Respuesta al toque (presionar). */
  press: 120,
  /** Cambios pequeños: casilla, progreso, chips. */
  fast: 160,
  /** Entradas y salidas de elementos. */
  base: 220,
  /** Hojas, modales, confirmaciones. */
  slow: 320,
} as const;

export const easings = {
  /** Entra rápido y se asienta (elementos que aparecen). */
  enter: Easing.out(Easing.cubic),
  /** Sale acelerando (elementos que se van). */
  exit: Easing.in(Easing.quad),
  /** Cambios de estado en el sitio. */
  standard: Easing.bezier(0.2, 0, 0, 1),
} as const;

export const springs = {
  /** Vuelta del botón tras presionar: firme, sin rebote visible. */
  press: { damping: 20, stiffness: 420, mass: 0.6, reduceMotion: ReduceMotion.System },
  /** Énfasis único (ej. "Listo" al completar): un pulso suave. */
  gentle: { damping: 14, stiffness: 220, mass: 0.8, reduceMotion: ReduceMotion.System },
} as const satisfies Record<string, WithSpringConfig>;

/** Retroalimentación al presionar botones, tarjetas y filas. */
export const pressFeedback = { scale: 0.97, opacity: 0.85 } as const;

/** Entrada escalonada de listas: retraso por elemento y tope (los siguientes entran sin esperar más). */
export const stagger = { step: 40, maxItems: 8 } as const;

/** Desplazamiento de las entradas (en dp): lo justo para notar de dónde viene. */
export const offsets = { enter: 12, toast: 24 } as const;

export const timing = (duration: number, easing: WithTimingConfig['easing'] = easings.standard): WithTimingConfig => ({
  duration,
  easing,
  reduceMotion: ReduceMotion.System,
});

/** Retraso escalonado del elemento `index` (con tope). */
export const staggerDelay = (index: number) => Math.min(index, stagger.maxItems) * stagger.step;

// Animaciones de diseño (entering/exiting) comunes.
export const fadeIn = FadeIn.duration(durations.base).reduceMotion(ReduceMotion.System);
export const fadeOut = FadeOut.duration(durations.fast).reduceMotion(ReduceMotion.System);
