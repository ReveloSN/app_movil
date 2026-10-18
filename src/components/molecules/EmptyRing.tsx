import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { IoniconName } from '@/shared/utils/ioniconName';

const SIZE = 120;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface EmptyRingProps {
  icon: IoniconName;
}

/**
 * Ilustración del estado vacío: un anillo con un arco de color que gira despacio alrededor del ícono.
 * Decorativa (el texto del estado lo dice todo); con "Quitar animaciones" queda quieta.
 */
export function EmptyRing({ icon }: EmptyRingProps) {
  const { colors, iconSizes } = useAppTheme();
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.set(
      withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear, reduceMotion: ReduceMotion.System }), -1, false),
    );
    return () => cancelAnimation(turn);
  }, [turn]);

  const arcStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 360}deg` }] }));

  return (
    <View style={styles.ring} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.primaryTint} strokeWidth={STROKE} fill="none" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, arcStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <LinearGradient id="empty-arc" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.primary} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="url(#empty-arc)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE * 0.3} ${CIRCUMFERENCE}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
      <View style={[styles.core, { backgroundColor: colors.accentSurface }]}>
        <Ionicons name={icon} size={iconSizes.xl} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: SIZE - 28,
    height: SIZE - 28,
    borderRadius: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
