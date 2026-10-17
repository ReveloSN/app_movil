import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { durations, easings, springs, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface AnimatedCheckProps {
  checked: boolean;
}

/**
 * Casilla de P07: al marcar, el círculo se rellena desde el centro y el check entra con un pequeño
 * giro; al desmarcar, se vacía. Es decorativa: el estado lo anuncia la fila (accessibilityState).
 */
export function AnimatedCheck({ checked }: AnimatedCheckProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fill = useSharedValue(checked ? 1 : 0);
  const mark = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    fill.set(withTiming(checked ? 1 : 0, timing(durations.fast, checked ? easings.enter : easings.exit)));
    mark.set(checked ? withSpring(1, springs.gentle) : withTiming(0, timing(durations.press, easings.exit)));
  }, [checked, fill, mark]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.get(), transform: [{ scale: 0.4 + 0.6 * fill.get() }] }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.get(),
    transform: [{ scale: 0.5 + 0.5 * mark.get() }, { rotate: `${(1 - mark.get()) * -30}deg` }],
  }));

  return (
    <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.ring} />
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.View style={markStyle}>
        <Ionicons name="checkmark" size={iconSizes.md} color={colors.onPrimary} />
      </Animated.View>
    </View>
  );
}

const createStyles = ({ colors, iconSizes, radii }: AppTheme) =>
  StyleSheet.create({
    box: {
      width: iconSizes.lg,
      height: iconSizes.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      ...StyleSheet.absoluteFill,
      borderRadius: radii.full,
      borderWidth: 2,
      borderColor: colors.textSecondary,
    },
    fill: {
      ...StyleSheet.absoluteFill,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
    },
  });
