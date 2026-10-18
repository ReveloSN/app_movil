// Lógica pura de la escena de Bienvenida: hora local, peso de cada imagen, textos, sol y luna.
// Sin React: se prueba con Jest (sceneTheme.test.ts).

import { saluteForHour } from '@/features/home/home.copy';
import { contrastRatio } from '@/shared/theme/contrast';

import { SCENE_IMAGES, SCENE_STAGES, type SceneStage } from './sceneImages';

export type StageWeights = Record<SceneStage, number>;

/** Cambios de tramo (hora decimal): 5:30 noche→mañana, 10:30 →mediodía, 16:30 →tarde, 19:00 →noche. */
const BOUNDARIES: readonly { at: number; from: SceneStage; to: SceneStage }[] = [
  { at: 5.5, from: 'night', to: 'morning' },
  { at: 10.5, from: 'morning', to: 'midday' },
  { at: 16.5, from: 'midday', to: 'evening' },
  { at: 19, from: 'evening', to: 'night' },
];

/** Duración del fundido alrededor de cada cambio: 45 min, centrado en la hora del cambio. */
export const BLEND_HOURS = 0.75;

/** Hora decimal 0–24 (ej. 18:30 → 18.5). */
export const hourOf = (date: Date) => date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

export const normalizeHour = (hour: number) => ((hour % 24) + 24) % 24;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Tramo que manda a esta hora (sin fundido). */
export function stageAt(hour: number): SceneStage {
  const h = normalizeHour(hour);
  if (h >= 5.5 && h < 10.5) return 'morning';
  if (h >= 10.5 && h < 16.5) return 'midday';
  if (h >= 16.5 && h < 19) return 'evening';
  return 'night';
}

/** Peso (opacidad) de cada imagen a esta hora: suman 1; dos se mezclan solo cerca de un cambio. */
export function stageWeights(hour: number): StageWeights {
  const h = normalizeHour(hour);
  const weights: StageWeights = { morning: 0, midday: 0, evening: 0, night: 0 };
  const half = BLEND_HOURS / 2;
  const boundary = BOUNDARIES.find(({ at }) => Math.abs(h - at) < half);
  if (!boundary) {
    weights[stageAt(h)] = 1;
    return weights;
  }
  const t = smoothstep(clamp01((h - (boundary.at - half)) / BLEND_HOURS));
  weights[boundary.from] = 1 - t;
  weights[boundary.to] = t;
  return weights;
}

/** Mezcla dos colores #RRGGBB. */
export function mixColors(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** Color ponderado por los pesos de cada tramo. */
function weighted(weights: StageWeights, pick: (stage: SceneStage) => string): string {
  let color = pick(SCENE_STAGES[0]);
  let accumulated = weights[SCENE_STAGES[0]];
  for (const stage of SCENE_STAGES.slice(1)) {
    const weight = weights[stage];
    if (weight <= 0) continue;
    accumulated += weight;
    color = mixColors(color, pick(stage), weight / accumulated);
  }
  return color;
}

/** Degradado del cielo a esta hora (banda de Inicio, fondo mientras cargan las imágenes). */
export function skyGradient(hour: number): { top: string; horizon: string } {
  const weights = stageWeights(hour);
  return {
    top: weighted(weights, (stage) => SCENE_IMAGES[stage].sky.top),
    horizon: weighted(weights, (stage) => SCENE_IMAGES[stage].sky.horizon),
  };
}

/** Texto oscuro (sobre velo claro) de día y claro (sobre velo oscuro) de noche. */
export type SceneTone = 'dark' | 'light';

export const sceneTone = (hour: number): SceneTone => (stageWeights(hour).night >= 0.5 ? 'light' : 'dark');

/**
 * Velo detrás del texto: blanco o negro con esta opacidad donde está el texto. Medido sobre los píxeles
 * reales del área del texto en las 4 imágenes y en los fundidos: contraste mínimo 4,94:1 (mitad del
 * fundido tarde→noche); en cada imagen sola, ≥ 7:1.
 */
export const SCRIM_ALPHA = 0.35;

/** Colores del texto de la escena y de su velo, por tono. */
export const SCENE_TEXT = {
  dark: { text: '#15201B', scrim: '#FFFFFF' },
  light: { text: '#FFFFFF', scrim: '#000000' },
} as const;

/** Contraste del texto sobre un color de cielo con el velo aplicado (lo usan las pruebas). */
export function sceneTextContrast(tone: SceneTone, sky: string): number {
  const { text, scrim } = SCENE_TEXT[tone];
  return contrastRatio(text, mixColors(sky, scrim, SCRIM_ALPHA));
}

/** Tono más legible sobre estos colores (banda de Inicio); se usa con el velo de SCENE_TEXT. */
export function readableTone(colors: readonly string[]): SceneTone {
  const worst = (text: string) => Math.min(...colors.map((color) => contrastRatio(text, color)));
  return worst(SCENE_TEXT.dark.text) >= worst(SCENE_TEXT.light.text) ? 'dark' : 'light';
}

export interface SceneHeadline {
  greeting: string;
  title: string;
  subtitle: string;
}

// Voz y tono (docs/ux/01-contenido.md §02): tuteo, breve, sin culpa, sin emojis. Propuestos, pendientes de validar.
const HEADLINES: Record<SceneStage, Omit<SceneHeadline, 'greeting'>> = {
  morning: { title: 'Antes de cruzar la puerta', subtitle: 'Revisa en segundos lo que no puede faltar.' },
  midday: { title: 'Lo importante, contigo', subtitle: 'Rutinas cortas que aparecen solas.' },
  evening: { title: '¿Vas saliendo?', subtitle: 'Llaves, cargador y estufa, en una lista.' },
  night: { title: 'Cierra el día con calma', subtitle: 'Puerta, gas y alarma, revisados.' },
};

/** Saludo (el mismo de Inicio) y titular del tramo de esta hora. */
export function sceneHeadline(hour: number): SceneHeadline {
  const h = normalizeHour(hour);
  return { greeting: saluteForHour(Math.floor(h)), ...HEADLINES[stageAt(h)] };
}

export interface CelestialPosition {
  /** Centro, en fracción del lado de la imagen (0–1). */
  x: number;
  y: number;
  /** 0 = oculto, 1 = visible. */
  opacity: number;
}

const SUN_RISE = 5.5;
const SUN_SET = 19.2;
const FADE = 0.4;

/**
 * Sol: sale bajo a la izquierda (donde brilla el amanecer de la imagen), sube hacia la derecha y baja
 * al oeste, siempre en la franja de cielo.
 */
export function sunPosition(hour: number): CelestialPosition {
  const h = normalizeHour(hour);
  const t = clamp01((h - SUN_RISE) / (SUN_SET - SUN_RISE));
  const opacity = clamp01(Math.min((h - SUN_RISE) / FADE + 0.5, (SUN_SET - h) / FADE + 0.5));
  return { x: 0.08 + 0.86 * t, y: 0.4 - 0.3 * Math.sin(Math.PI * t), opacity };
}

const MOON_RISE = 19;
const MOON_HOURS = 10.5;

/** Luna: de 19:00 a 5:30, arriba a la derecha (de derecha a izquierda), lejos del texto. */
export function moonPosition(hour: number): CelestialPosition {
  const h = normalizeHour(hour);
  const since = h >= 12 ? h - MOON_RISE : h + 24 - MOON_RISE;
  const t = clamp01(since / MOON_HOURS);
  const opacity = clamp01(Math.min(since / FADE + 0.5, (MOON_HOURS - since) / FADE + 0.5));
  return { x: 0.9 - 0.18 * t, y: 0.18 - 0.1 * Math.sin(Math.PI * t), opacity };
}

/** Estrellas: solo de noche, con la misma opacidad que la imagen nocturna. */
export const starsOpacity = (hour: number) => stageWeights(hour).night;

/** "07:05": hora que muestra el modo demostración. */
export function formatSceneHour(hour: number): string {
  // El margen evita que 7,9999… (suma de pasos de 0,1 h) se lea como 07:59.
  const total = Math.floor(normalizeHour(hour) * 60 + 1e-6) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
