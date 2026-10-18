import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import type { CelestialPosition } from './sceneTheme';

const SUN_SIZE = 92;
const MOON_SIZE = 84;

interface BodyProps {
  position: CelestialPosition;
  /** Mapea coordenadas de la imagen (0–1) a la escena. */
  toScene(u: number, v: number): { x: number; y: number };
  transitionMs: number;
}

function useBodyStyle({ position, toScene, transitionMs }: BodyProps, size: number) {
  const target = toScene(position.x, position.y);
  const x = useSharedValue(target.x - size / 2);
  const y = useSharedValue(target.y - size / 2);
  const opacity = useSharedValue(position.opacity);

  useEffect(() => {
    const animate = (value: number) =>
      transitionMs > 0 ? withTiming(value, { duration: transitionMs, easing: Easing.inOut(Easing.cubic) }) : value;
    x.set(animate(target.x - size / 2));
    y.set(animate(target.y - size / 2));
    opacity.set(animate(position.opacity));
  }, [target.x, target.y, position.opacity, transitionMs, size, x, y, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));
}

/** Sol con resplandor, en su arco según la hora. */
export function Sun(props: BodyProps) {
  const style = useBodyStyle(props, SUN_SIZE);
  return (
    <Animated.View style={[styles.body, style]} pointerEvents="none">
      <Svg width={SUN_SIZE} height={SUN_SIZE} viewBox="0 0 92 92">
        <Defs>
          <RadialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0.45" stopColor="#FFF2C4" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FFE9A8" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="sun-core" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFC2" />
            <Stop offset="1" stopColor="#FFCD6C" />
          </LinearGradient>
        </Defs>
        <Circle cx={46} cy={46} r={46} fill="url(#sun-glow)" />
        <Circle cx={46} cy={46} r={21} fill="url(#sun-core)" />
      </Svg>
    </Animated.View>
  );
}

/** Luna creciente con halo, de 19:00 a 5:30. */
export function Moon(props: BodyProps) {
  const style = useBodyStyle(props, MOON_SIZE);
  return (
    <Animated.View style={[styles.body, style]} pointerEvents="none">
      <Svg width={MOON_SIZE} height={MOON_SIZE} viewBox="0 0 84 84">
        <Defs>
          <RadialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0.4" stopColor="#FFF6CF" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#FFF6CF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="moon-core" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFBC2" />
            <Stop offset="1" stopColor="#FFE394" />
          </LinearGradient>
        </Defs>
        <Circle cx={42} cy={42} r={42} fill="url(#moon-glow)" />
        <Circle cx={42} cy={42} r={18} fill="url(#moon-core)" />
        {/* Sombra que dibuja la fase creciente, del color del cielo nocturno. */}
        <Circle cx={51} cy={35} r={15} fill="#06205E" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
