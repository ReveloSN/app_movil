import { StyleSheet, View } from 'react-native';

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

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
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
      borderRadius: radii.sm,
      backgroundColor: colors.primary,
    },
  });
