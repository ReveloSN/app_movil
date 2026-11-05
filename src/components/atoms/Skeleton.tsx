import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, easings, timing } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export type SkeletonVariant = 'line' | 'circle' | 'card';

interface SkeletonProps {
  /** line: barra de texto; circle: ícono o avatar; card: bloque de tarjeta. Por defecto line. */
  variant?: SkeletonVariant;
  width?: DimensionValue;
  /** Por defecto: line 16, circle igual al ancho (o 48), card 96. */
  height?: number;
  /** Atajo de variant="circle" (así lo usan los chips y filas existentes). */
  round?: boolean;
}

const DEFAULT_HEIGHT = { line: 16, circle: 48, card: 96 } as const;
/** Opacidad del bloque quieto (reducir movimiento): legible sobre la tarjeta en claro y oscuro. */
const STATIC_OPACITY = 0.7;
const PULSE_FROM = 0.55;

/**
 * Bloque gris que late suave mientras carga (solo opacidad). Decorativo: quien lo usa dentro de un
 * SkeletonGroup anuncia "Cargando" una sola vez. Con "Quitar animaciones" queda quieto.
 */
export function Skeleton({ variant = 'line', width, height, round = false }: SkeletonProps) {
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const kind: SkeletonVariant = round ? 'circle' : variant;
  const size = height ?? (kind === 'circle' && typeof width === 'number' ? width : DEFAULT_HEIGHT[kind]);
  const resolvedWidth = width ?? (kind === 'circle' ? size : '100%');
  const pulse = useSharedValue(reduced ? STATIC_OPACITY : PULSE_FROM);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(pulse);
      pulse.set(STATIC_OPACITY);
      return;
    }
    pulse.set(PULSE_FROM);
    pulse.set(withRepeat(withTiming(1, timing(durations.slow * 2, easings.standard)), -1, true));
    return () => cancelAnimation(pulse);
  }, [pulse, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <Animated.View
      testID={`skeleton-${kind}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, kind === 'card' && styles.card, { width: resolvedWidth, height: size }, kind === 'circle' && { borderRadius: size / 2 }, style]}
    />
  );
}

interface SkeletonGroupProps {
  children: ReactNode;
  /** Lo que oye el lector de pantalla; por defecto "Cargando". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Contenedor de varios Skeleton: un solo elemento accesible ("Cargando"), sus bloques no se leen. */
export function SkeletonGroup({ children, accessibilityLabel = 'Cargando', style }: SkeletonGroupProps) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }} style={style}>
      {children}
    </View>
  );
}

const createStyles = ({ colors, radii }: AppTheme) =>
  StyleSheet.create({
    block: {
      borderRadius: radii.sm,
      backgroundColor: colors.border,
    },
    card: {
      borderRadius: radii.xxl,
    },
  });
