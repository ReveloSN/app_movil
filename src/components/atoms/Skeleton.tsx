import { useEffect } from 'react';
import { StyleSheet, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { durations, easings, timing } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  /** Círculo (ej. ícono) en vez de barra. */
  round?: boolean;
}

/**
 * Bloque gris que late suave mientras carga (solo opacidad). Decorativo: quien lo usa anuncia "Cargando".
 * Con "Quitar animaciones" queda quieto.
 */
export function Skeleton({ width = '100%', height, round = false }: SkeletonProps) {
  const styles = useThemedStyles(createStyles);
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, timing(durations.slow * 2, easings.standard)), -1, true));
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return <Animated.View style={[styles.block, { width, height }, round && { borderRadius: height / 2 }, style]} />;
}

const createStyles = ({ colors, radii }: AppTheme) =>
  StyleSheet.create({
    block: {
      borderRadius: radii.sm,
      backgroundColor: colors.border,
    },
  });
