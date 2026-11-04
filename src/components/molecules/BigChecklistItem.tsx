import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedCheck } from '@/components/atoms/AnimatedCheck';
import { PressableScale } from '@/components/atoms/PressableScale';
import { durations, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { toIoniconName } from '@/shared/utils/ioniconName';

/** Alto mínimo de la fila (dp) y tamaño del texto (sp) del modo salida. */
export const BIG_ITEM_MIN_HEIGHT = 64;

interface BigChecklistItemProps {
  label: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  icon: string | null;
  critical: boolean;
  /** Texto de "crítico": se ve en una etiqueta y se lee en voz alta (ej. "Crítico"). */
  criticalLabel: string;
  checked: boolean;
  onToggle(): void;
}

/**
 * Fila grande del modo salida: toda la fila es el objetivo táctil (≥ 64 dp), texto de 20 sp. Marcado =
 * casilla rellena + texto en color de acción; crítico = bandera con etiqueta escrita (no solo color).
 */
export function BigChecklistItem({ label, icon, critical, criticalLabel, checked, onToggle }: BigChecklistItemProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const highlight = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    highlight.set(withTiming(checked ? 1 : 0, timing(durations.fast)));
  }, [checked, highlight]);
  const highlightStyle = useAnimatedStyle(() => ({ opacity: highlight.get() }));

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={critical ? `${label}, ${criticalLabel}` : label}
      onPress={onToggle}
      style={[styles.row, critical && styles.rowCritical, checked && styles.rowChecked]}
    >
      <Animated.View pointerEvents="none" style={[styles.highlight, highlightStyle]} />
      <AnimatedCheck checked={checked} />
      <Ionicons name={toIoniconName(icon, 'cube-outline')} size={iconSizes.lg} color={colors.textMuted} />
      <View style={styles.texts}>
        <Text style={[styles.label, checked && styles.labelChecked]} numberOfLines={2}>
          {label}
        </Text>
        {critical ? (
          <View style={styles.badge}>
            <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} />
            <Text style={styles.badgeText}>{criticalLabel}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: BIG_ITEM_MIN_HEIGHT,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    // Crítico: borde más grueso (además de la etiqueta escrita).
    rowCritical: {
      borderWidth: 2,
      borderColor: colors.criticalText,
    },
    rowChecked: {
      borderColor: colors.primary,
    },
    highlight: {
      ...StyleSheet.absoluteFill,
      borderRadius: radii.xxl,
      backgroundColor: colors.primaryTint,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    // h2 = 20 sp: el mínimo del modo salida.
    label: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    labelChecked: {
      color: colors.primary,
    },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.full,
      backgroundColor: colors.criticalBg,
    },
    badgeText: {
      ...typography.caption,
      color: colors.criticalText,
    },
  });
