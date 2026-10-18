import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SCENE_TEXT, SCRIM_ALPHA, type SceneTone } from './sceneTheme';

interface SceneScrimProps {
  width: number;
  /** Hasta dónde llega el texto (el velo se desvanece justo debajo). */
  textBottom: number;
  tone: SceneTone;
  transitionMs: number;
}

const FADE_BELOW = 40;

function Veil({ tone, width, height, textStop, visible, transitionMs }: {
  tone: SceneTone;
  width: number;
  height: number;
  textStop: number;
  visible: boolean;
  transitionMs: number;
}) {
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.set(transitionMs > 0 ? withTiming(visible ? 1 : 0, { duration: 300 }) : visible ? 1 : 0);
  }, [visible, transitionMs, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const color = SCENE_TEXT[tone].scrim;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`veil-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={SCRIM_ALPHA + 0.08} />
            <Stop offset={textStop} stopColor={color} stopOpacity={SCRIM_ALPHA} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#veil-${tone})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Degradado sutil detrás del titular: claro de día y oscuro de noche, para un contraste ≥ 4,5:1 sobre
 * las 4 imágenes (medido en sceneTheme). Cambia de uno a otro con un fundido corto.
 */
export function SceneScrim({ width, textBottom, tone, transitionMs }: SceneScrimProps) {
  const height = textBottom + FADE_BELOW;
  const textStop = textBottom / height;
  return (
    <Animated.View style={[styles.scrim, { height }]} pointerEvents="none">
      <Veil tone="dark" width={width} height={height} textStop={textStop} visible={tone === 'dark'} transitionMs={transitionMs} />
      <Veil tone="light" width={width} height={height} textStop={textStop} visible={tone === 'light'} transitionMs={transitionMs} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
