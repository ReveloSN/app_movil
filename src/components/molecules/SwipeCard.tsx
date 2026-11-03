import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { SwipeDirection } from '@/features/checklist/checklist.deck';
import { durations, easings, springs, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { toIoniconName } from '@/shared/utils/ioniconName';

/** Parte del ancho que hay que recorrer para que el deslizar cuente. */
const SWIPE_FRACTION = 0.28;
const SWIPE_VELOCITY = 0.7;
/** Giro máximo de la tarjeta al arrastrarla, en grados. */
const MAX_TILT = 8;

interface SwipeCardProps {
  label: string;
  icon: string | null;
  critical: boolean;
  /** Texto de "crítico" (visible y para lector de pantalla). */
  criticalLabel: string;
  note?: string | null;
  /** Texto de cada lado; siempre con ícono, nunca solo color. */
  carryLabel: string;
  notCarryLabel: string;
  onSwipe(direction: SwipeDirection): void;
}

/**
 * Tarjeta de un ítem que se arrastra: a la derecha "lo llevo", a la izquierda "no lo llevo". Mientras se
 * arrastra aparece el texto del lado elegido. El deslizar nunca es la única forma de responder: la
 * pantalla ofrece los mismos botones.
 */
export function SwipeCard({ label, icon, critical, criticalLabel, note, carryLabel, notCarryLabel, onSwipe }: SwipeCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const dragX = useSharedValue(0);
  const threshold = width * SWIPE_FRACTION;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy),
        onPanResponderMove: (_, { dx }) => {
          dragX.set(dx);
        },
        onPanResponderRelease: (_, { dx, vx }) => {
          const direction: SwipeDirection | null =
            dx > threshold || vx > SWIPE_VELOCITY ? 'right' : dx < -threshold || vx < -SWIPE_VELOCITY ? 'left' : null;
          if (!direction) {
            dragX.set(withSpring(0, springs.press));
            return;
          }
          dragX.set(
            withTiming((direction === 'right' ? 1 : -1) * width * 1.2, timing(durations.fast, easings.exit), (finished) => {
              if (finished) scheduleOnRN(onSwipe, direction);
            }),
          );
        },
        onPanResponderTerminate: () => {
          dragX.set(withSpring(0, springs.press));
        },
      }),
    [dragX, onSwipe, threshold, width],
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.get() },
      { rotate: `${interpolate(dragX.get(), [-width, 0, width], [-MAX_TILT, 0, MAX_TILT])}deg` },
    ],
  }));
  const carryStyle = useAnimatedStyle(() => ({ opacity: interpolate(dragX.get(), [0, threshold], [0, 1], 'clamp') }));
  const notCarryStyle = useAnimatedStyle(() => ({ opacity: interpolate(dragX.get(), [-threshold, 0], [1, 0], 'clamp') }));

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      accessible
      accessibilityLabel={[critical ? `${label}, ${criticalLabel}` : label, note].filter(Boolean).join('. ')}
      {...panResponder.panHandlers}
    >
      <Ionicons name={toIoniconName(icon, 'cube-outline')} size={iconSizes.xl} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {critical ? (
        <View style={styles.criticalBadge}>
          <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} />
          <Text style={styles.criticalText}>{criticalLabel}</Text>
        </View>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampCarry, carryStyle]}>
        <Ionicons name="checkmark" size={iconSizes.md} color={colors.onPrimary} />
        <Text style={styles.stampCarryText}>{carryLabel}</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampNotCarry, notCarryStyle]}>
        <Ionicons name="close" size={iconSizes.md} color={colors.textPrimary} />
        <Text style={styles.stampNotCarryText}>{notCarryLabel}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      minHeight: 260,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    label: {
      ...typography.h1,
      textAlign: 'center',
      color: colors.textPrimary,
    },
    note: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    criticalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.criticalBg,
    },
    criticalText: {
      ...typography.labelMedium,
      color: colors.criticalText,
    },
    stamp: {
      position: 'absolute',
      top: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
    },
    stampCarry: {
      left: spacing.lg,
      backgroundColor: colors.primary,
    },
    stampNotCarry: {
      right: spacing.lg,
      backgroundColor: colors.neutralSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stampCarryText: {
      ...typography.labelMedium,
      color: colors.onPrimary,
    },
    stampNotCarryText: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
  });
