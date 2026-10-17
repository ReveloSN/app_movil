import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { durations, easings, timing } from '@/shared/theme/motion';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ProgressBarProps {
  value: number;
  max: number;
  /** Texto para lectores de pantalla (ej. "2 de 5 ítems listos"). */
  accessibilityLabel: string;
}

export function ProgressBar({ value, max, accessibilityLabel }: ProgressBarProps) {
  const styles = useThemedStyles(createStyles);
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  // Avanza suave: se anima la escala horizontal (no el ancho) para no recalcular el diseño en cada cuadro.
  const progress = useSharedValue(ratio);
  useEffect(() => {
    progress.set(withTiming(ratio, timing(durations.base, easings.standard)));
  }, [ratio, progress]);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes }: AppTheme) =>
  StyleSheet.create({
    track: {
      height: sizes.progressBarHeight,
      borderRadius: radii.sm,
      backgroundColor: colors.primaryTint,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      width: '100%',
      transformOrigin: 'left',
      borderRadius: radii.sm,
      backgroundColor: colors.primary,
    },
  });
