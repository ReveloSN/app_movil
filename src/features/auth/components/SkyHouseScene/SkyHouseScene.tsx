import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { spacing, typography } from '@/shared/theme/tokens';

import { Moon, Sun } from './CelestialBodies';
import { FloatingBubbles } from './FloatingBubbles';
import { IMAGE_ANCHORS } from './sceneImages';
import { SceneLayers } from './SceneLayers';
import { SceneScrim } from './SceneScrim';
import {
  formatSceneHour,
  moonPosition,
  SCENE_TEXT,
  sceneHeadline,
  sceneTone,
  skyGradient,
  stageWeights,
  starsOpacity,
  sunPosition,
} from './sceneTheme';
import { Clouds, Stars } from './SkyDetails';
import { useSceneActive } from './useSceneActive';
import { useSceneHour } from './useSceneHour';

/** Texto alternativo de la escena (la ilustración es una sola imagen para el lector de pantalla). */
export const SCENE_ALT = 'Paisaje que cambia con la hora del día: una casa con sol o luna';
/** Mantener presionado ~2 s activa o quita el recorrido de 24 h (para presentar la app). */
const DEMO_LONG_PRESS_MS = 2000;
const CROSSFADE_MS = 800;
const DEMO_TRANSITION_MS = 90;

interface SkyHouseSceneProps {
  /** Margen superior para la barra de estado (la escena se dibuja detrás de ella). */
  topInset: number;
  /** Fuerza el modo reducido (pruebas); por defecto, el ajuste del sistema. */
  reducedMotion?: boolean;
}

/**
 * Escena de Bienvenida: 4 ilustraciones (mañana, mediodía, tarde y noche) mezcladas según la hora local,
 * con sol, luna, nubes, estrellas y burbujas animados encima. El texto va en el flujo del diseño: con letra
 * grande la escena crece en vez de recortarlo.
 */
export function SkyHouseScene({ topInset, reducedMotion: forcedReduced }: SkyHouseSceneProps) {
  const { width } = useWindowDimensions();
  const systemReduced = useReducedMotion();
  const reduced = forcedReduced ?? systemReduced;
  const active = useSceneActive();
  const { hour, demo, toggleDemo } = useSceneHour(active);
  const [height, setHeight] = useState(width);
  const [textBottom, setTextBottom] = useState(width * IMAGE_ANCHORS.skyBottom);

  const weights = useMemo(() => stageWeights(hour), [hour]);
  const tone = sceneTone(hour);
  const words = sceneHeadline(hour);
  const textColor = SCENE_TEXT[tone].text;
  const transitionMs = reduced ? 0 : demo ? DEMO_TRANSITION_MS : CROSSFADE_MS;
  const moving = active && !reduced;

  // La imagen (cuadrada, del ancho de la escena) se apoya abajo; sobre ella se extiende su cielo.
  const imageTop = height - width;
  const toScene = useCallback((u: number, v: number) => ({ x: u * width, y: imageTop + v * width }), [width, imageTop]);
  const skyHeight = Math.max(0, imageTop + width * (IMAGE_ANCHORS.skyBottom + 0.02));

  const onSceneLayout = (event: LayoutChangeEvent) => setHeight(Math.round(event.nativeEvent.layout.height));
  const onTextLayout = (event: LayoutChangeEvent) => {
    const { y, height: textHeight } = event.nativeEvent.layout;
    setTextBottom(Math.round(y + textHeight));
  };

  return (
    <Pressable
      // No es un botón: el mantener-presionado es solo para la demostración y no se anuncia.
      accessible={false}
      onLongPress={toggleDemo}
      delayLongPress={DEMO_LONG_PRESS_MS}
      style={[styles.scene, { minHeight: width, backgroundColor: skyGradient(hour).top }]}
      onLayout={onSceneLayout}
    >
      {/* La barra de estado se lee sobre el cielo: iconos claros de noche y oscuros de día. */}
      <StatusBar style={tone === 'light' ? 'light' : 'dark'} />
      <View style={StyleSheet.absoluteFill} accessible accessibilityRole="image" accessibilityLabel={SCENE_ALT}>
        <SceneLayers weights={weights} size={width} top={imageTop} transitionMs={transitionMs} zoom={moving}>
          <FloatingBubbles toScene={toScene} floating={moving} night={tone === 'light'} />
        </SceneLayers>
        <Stars width={width} height={skyHeight} opacity={starsOpacity(hour)} transitionMs={transitionMs} />
        <Sun position={sunPosition(hour)} toScene={toScene} transitionMs={transitionMs} />
        <Moon position={moonPosition(hour)} toScene={toScene} transitionMs={transitionMs} />
        {reduced ? null : <Clouds width={width} height={skyHeight} running={moving} night={weights.night} />}
        <SceneScrim width={width} textBottom={textBottom} tone={tone} transitionMs={transitionMs} />
      </View>

      <View style={[styles.copy, { paddingTop: topInset + spacing.lg }]} onLayout={onTextLayout}>
        <Text style={[styles.greeting, { color: textColor }]}>{words.greeting}</Text>
        <Text style={[styles.title, { color: textColor }]} accessibilityRole="header">
          {words.title}
        </Text>
        <Text style={[styles.subtitle, { color: textColor }]}>{words.subtitle}</Text>
        {demo ? (
          <Text style={[styles.demo, { color: textColor }]} accessibilityLiveRegion="polite">
            {`Demostración · ${formatSceneHour(hour)}`}
          </Text>
        ) : null}
      </View>
      {/* Lo que queda debajo del cielo: la casa y el jardín de la imagen. */}
      <View style={{ height: width * (1 - IMAGE_ANCHORS.skyBottom) }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: '100%',
    overflow: 'hidden',
  },
  copy: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    // Deja libre la esquina superior derecha, por donde pasan la luna y el sol de la tarde.
    maxWidth: '78%',
  },
  greeting: {
    ...typography.labelMedium,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
  },
  demo: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
