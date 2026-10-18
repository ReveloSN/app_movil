import {
  hourOf,
  readableTone,
  SCENE_TEXT,
  SCRIM_ALPHA,
  skyGradient,
} from '@/features/auth/components/SkyHouseScene/sceneTheme';

export interface HomeSky {
  /** Degradado de la banda: el cielo de la escena de Bienvenida a esta hora (interpolado entre tramos). */
  top: string;
  horizon: string;
  /** Texto y velo que garantizan ≥ 4,5:1 sobre ese degradado (probado en sceneTheme.test). */
  text: string;
  scrim: string;
  scrimAlpha: number;
}

/** Colores de la banda de Inicio a esta hora. */
export function homeSky(now: Date): HomeSky {
  const { top, horizon } = skyGradient(hourOf(now));
  const tone = readableTone([top, horizon]);
  return { top, horizon, text: SCENE_TEXT[tone].text, scrim: SCENE_TEXT[tone].scrim, scrimAlpha: SCRIM_ALPHA };
}
