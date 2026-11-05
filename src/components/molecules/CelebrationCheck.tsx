import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, easings, springs, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Trazo del check en un lienzo de 100×100 y su largo (22,6 + 46,6, con un poco de margen).
const CHECK_PATH = 'M 28 52 L 44 68 L 74 34';
const CHECK_LENGTH = 72;

interface CelebrationCheckProps {
  /** Se dice en voz alta al aparecer (ej. "Todo listo"). Con reducir movimiento es la única celebración. */
  announcement: string;
  size?: number;
}

/**
 * Check de celebración: el círculo entra con un resorte suave y el trazo del check se dibuja encima.
 * Con "Quitar animaciones" aparece ya dibujado, quieto. Es decorativo: se anuncia con announceForAccessibility.
 */
export function CelebrationCheck({ announcement, size = 112 }: CelebrationCheckProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const draw = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      pop.set(1);
      draw.set(1);
      return;
    }
    pop.set(withSpring(1, springs.gentle));
    draw.set(withDelay(durations.fast, withTiming(1, timing(durations.slow, easings.enter))));
  }, [reducedMotion, pop, draw]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);

  const circleStyle = useAnimatedStyle(() => ({ opacity: pop.get(), transform: [{ scale: 0.6 + 0.4 * pop.get() }] }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - draw.get()) }));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.circle, { borderRadius: size / 2 }, circleStyle]} />
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <AnimatedPath
          d={CHECK_PATH}
          stroke={colors.onPrimary}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={pathProps}
        />
      </Svg>
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    circle: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.primary,
    },
  });
