import type { ImageSourcePropType } from 'react-native';

export type SceneStage = 'morning' | 'midday' | 'evening' | 'night';

/** Orden de las capas (de abajo arriba) y de los tramos del día. */
export const SCENE_STAGES: readonly SceneStage[] = ['morning', 'midday', 'evening', 'night'];

export interface SceneImage {
  source: ImageSourcePropType;
  /**
   * Ajuste para que la casa no "salte" en los fundidos. Las 4 ilustraciones están alineadas
   * (desplazamiento medido entre ellas: 0 px), así que todos son neutros; queda para futuras imágenes.
   */
  offset: { x: number; y: number; scale: number };
  /**
   * Colores del cielo muestreados de la imagen: borde superior (top) y cielo sobre el horizonte (horizon).
   * Pintan el cielo que se extiende sobre la imagen, el fondo mientras carga y la banda de Inicio.
   */
  sky: { top: string; horizon: string };
}

const NEUTRAL = { x: 0, y: 0, scale: 1 } as const;

export const SCENE_IMAGES: Record<SceneStage, SceneImage> = {
  morning: {
    source: require('../../../../../assets/images/escena/escena-manana.webp'),
    offset: NEUTRAL,
    sky: { top: '#E5B9B3', horizon: '#FEDA90' },
  },
  midday: {
    source: require('../../../../../assets/images/escena/escena-mediodia.webp'),
    offset: NEUTRAL,
    sky: { top: '#68B6FD', horizon: '#CCEAFD' },
  },
  evening: {
    source: require('../../../../../assets/images/escena/escena-tarde.webp'),
    offset: NEUTRAL,
    sky: { top: '#A480AE', horizon: '#FDA252' },
  },
  night: {
    source: require('../../../../../assets/images/escena/escena-noche.webp'),
    offset: NEUTRAL,
    sky: { top: '#001955', horizon: '#164AA6' },
  },
};

export type BubbleKind = 'key' | 'lock' | 'shield';

/** Posiciones medidas sobre las ilustraciones, en fracción del lado de la imagen (0–1). */
export const IMAGE_ANCHORS = {
  /** Cielo libre para el texto: del borde superior de la imagen hasta aquí. */
  skyBottom: 0.4,
  /** Burbujas flotantes junto a la casa (llave a la izquierda; candado y escudo a la derecha). */
  bubbles: [
    { kind: 'key', x: 0.2, y: 0.48 },
    { kind: 'lock', x: 0.8, y: 0.44 },
    { kind: 'shield', x: 0.87, y: 0.6 },
  ] as readonly { kind: BubbleKind; x: number; y: number }[],
};
