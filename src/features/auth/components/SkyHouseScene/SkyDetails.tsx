import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

// Estrellas en la franja de cielo (fracción del ancho y del alto de esa franja).
const STARS: readonly [number, number, number][] = [
  [0.07, 0.08, 1.3], [0.27, 0.12, 1], [0.47, 0.06, 1.4], [0.66, 0.16, 1.1], [0.83, 0.07, 1.2], [0.93, 0.28, 1.1],
  [0.05, 0.42, 1], [0.34, 0.44, 1], [0.72, 0.42, 1.2], [0.89, 0.56, 1], [0.26, 0.62, 1.3], [0.5, 0.27, 1],
];

interface StarsProps {
  width: number;
  /** Alto de la franja de cielo donde caben. */
  height: number;
  opacity: number;
  transitionMs: number;
}

/** Estrellas: solo de noche (su opacidad sigue a la imagen nocturna). Fijas: no cuestan animación. */
export function Stars({ width, height, opacity, transitionMs }: StarsProps) {
  const value = useSharedValue(opacity);
  useEffect(() => {
    value.set(transitionMs > 0 ? withTiming(opacity, { duration: transitionMs }) : opacity);
  }, [opacity, transitionMs, value]);
  const style = useAnimatedStyle(() => ({ opacity: value.get() }));

  return (
    <Animated.View style={[styles.fill, { height }, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        {STARS.map(([x, y, r], index) => (
          <Circle key={index} cx={x * width} cy={y * height} r={r} fill="#FAF7DD" opacity={index % 3 === 0 ? 0.9 : 0.55} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const CLOUD_WIDTH = 120;
// Tres nubes a distinta altura y velocidad (segundos en cruzar la escena).
const CLOUDS = [
  { y: 0.1, scale: 1, seconds: 90, start: 0.15 },
  { y: 0.26, scale: 0.75, seconds: 120, start: 0.65 },
  { y: 0.4, scale: 0.6, seconds: 150, start: 0.4 },
] as const;

function Cloud({ width, top, scale, seconds, start, running, opacity }: {
  width: number;
  top: number;
  scale: number;
  seconds: number;
  start: number;
  running: boolean;
  opacity: number;
}) {
  const span = width + CLOUD_WIDTH;
  const progress = useSharedValue(start);

  useEffect(() => {
    if (!running) {
      cancelAnimation(progress);
      return;
    }
    // Sigue desde donde quedó y luego da vueltas completas, muy despacio.
    const remaining = (1 - progress.get()) * seconds * 1000;
    progress.set(
      withTiming(1, { duration: remaining, easing: Easing.linear }, (finished) => {
        if (!finished) return;
        progress.set(0);
        progress.set(withRepeat(withTiming(1, { duration: seconds * 1000, easing: Easing.linear }), -1, false));
      }),
    );
    return () => cancelAnimation(progress);
  }, [running, seconds, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * span - CLOUD_WIDTH }, { scale }],
  }));

  return (
    <Animated.View style={[styles.cloud, { top, opacity }, style]} pointerEvents="none">
      <Svg width={CLOUD_WIDTH} height={48} viewBox="0 0 120 48">
        <Ellipse cx={60} cy={34} rx={56} ry={13} fill="#FFFFFF" />
        <Circle cx={40} cy={24} r={17} fill="#FFFFFF" />
        <Circle cx={68} cy={19} r={22} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

interface CloudsProps {
  width: number;
  /** Alto de la franja de cielo. */
  height: number;
  running: boolean;
  /** Más tenues de noche. */
  night: number;
}

/** 2–3 nubes que cruzan despacio (solo transform). Pausadas fuera de pantalla o en segundo plano. */
export function Clouds({ width, height, running, night }: CloudsProps) {
  const opacity = 0.7 - 0.5 * night;
  return (
    <View style={[styles.fill, { height }]} pointerEvents="none">
      {CLOUDS.map((cloud) => (
        <Cloud key={cloud.seconds} width={width} top={cloud.y * height} {...cloud} running={running} opacity={opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  cloud: {
    position: 'absolute',
    left: 0,
  },
});
