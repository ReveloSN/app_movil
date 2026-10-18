import { useEffect, type ReactNode } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SCENE_IMAGES, SCENE_STAGES, type SceneStage } from './sceneImages';
import type { StageWeights } from './sceneTheme';

/** Acercamiento muy lento: 1 → 1,04 en 12 s y vuelta (24 s el ciclo). */
const ZOOM_TO = 1.04;
const ZOOM_HALF_MS = 12_000;

interface SceneLayersProps {
  weights: StageWeights;
  /** Lado del cuadrado de la imagen (= ancho de la escena) y su borde superior dentro de la escena. */
  size: number;
  top: number;
  /** Duración del cambio de opacidad (0 = al instante). */
  transitionMs: number;
  zoom: boolean;
  /** Lo que se acerca junto con la imagen (ej. burbujas ancladas a la casa). */
  children?: ReactNode;
}

function StageLayer({ stage, weight, size, top, transitionMs }: { stage: SceneStage; weight: number } & Pick<SceneLayersProps, 'size' | 'top' | 'transitionMs'>) {
  const opacity = useSharedValue(weight);
  useEffect(() => {
    opacity.set(transitionMs > 0 ? withTiming(weight, { duration: transitionMs, easing: Easing.inOut(Easing.quad) }) : weight);
  }, [weight, transitionMs, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const { source, offset, sky } = SCENE_IMAGES[stage];
  const seam = Math.round(size * 0.14);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: sky.top }, style]}>
      <Image
        source={source}
        resizeMode="cover"
        style={[
          styles.image,
          { top, width: size, height: size },
          { transform: [{ translateX: offset.x * size }, { translateY: offset.y * size }, { scale: offset.scale }] },
        ]}
      />
      {/* Une el cielo que se extiende sobre la imagen con su borde superior, sin costura. */}
      <Svg style={[styles.seam, { top: top - 1, height: seam }]} width={size} height={seam}>
        <Defs>
          <LinearGradient id={`seam-${stage}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} stopOpacity={1} />
            <Stop offset="1" stopColor={sky.top} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={seam} fill={`url(#seam-${stage})`} />
      </Svg>
    </Animated.View>
  );
}

function useZoom(enabled: boolean): SharedValue<number> {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(scale);
      scale.set(withTiming(1, { duration: 400 }));
      return;
    }
    scale.set(withRepeat(withTiming(ZOOM_TO, { duration: ZOOM_HALF_MS, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(scale);
  }, [enabled, scale]);
  return scale;
}

/**
 * Las 4 ilustraciones apiladas, mezcladas solo con opacidad según la hora; encima, el cielo de cada una
 * se extiende hacia arriba para dejar sitio al texto. Todo se acerca muy despacio (si está activo).
 */
export function SceneLayers({ weights, size, top, transitionMs, zoom, children }: SceneLayersProps) {
  const scale = useZoom(zoom);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]} pointerEvents="none">
      {SCENE_STAGES.map((stage) => (
        <StageLayer key={stage} stage={stage} weight={weights[stage]} size={size} top={top} transitionMs={transitionMs} />
      ))}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    left: 0,
  },
  seam: {
    position: 'absolute',
    left: 0,
  },
});
