import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface SyncStatusRowProps {
  icon: IoniconName;
  label: string;
  /** error: hay cambios rechazados. El estado siempre va con ícono + texto, nunca solo color. */
  tone?: 'info' | 'error';
  style?: StyleProp<ViewStyle>;
  /** Subiendo ahora: el ícono gira despacio (indicador discreto; el texto ya lo dice). */
  busy?: boolean;
}

/** Fila compacta de estado de sincronización (ej. "3 cambios sin sincronizar"). */
export function SyncStatusRow({ icon, label, tone = 'info', style, busy = false }: SyncStatusRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const color = tone === 'error' ? colors.danger : colors.primary;
  const turn = useSharedValue(0);
  useEffect(() => {
    if (!busy) {
      cancelAnimation(turn);
      turn.set(0);
      return;
    }
    turn.set(withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear, reduceMotion: ReduceMotion.System }), -1));
  }, [busy, turn]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 360}deg` }] }));

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={icon} size={iconSizes.md} color={color} />
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.neutralSurface,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      flexShrink: 1,
    },
  });
