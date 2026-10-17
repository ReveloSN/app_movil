import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Skeleton } from '@/components/atoms/Skeleton';
import { fadeIn } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SkeletonListProps {
  /** Cuántas filas dibujar. */
  rows?: number;
  /** card: tarjeta con ícono y dos líneas (Inicio, Historial); row: fila de ítem (P07, IA). */
  variant?: 'card' | 'row';
  /** Lo que oye el lector de pantalla (ej. "Cargando rutinas"). */
  accessibilityLabel: string;
  /** false dentro de un contenedor que ya tiene márgenes. */
  padded?: boolean;
}

/** Esqueleto de una lista mientras carga: anticipa la forma del contenido sin saltos al llegar. */
export function SkeletonList({ rows = 3, variant = 'card', accessibilityLabel, padded = true }: SkeletonListProps) {
  const styles = useThemedStyles(createStyles);
  const iconSize = variant === 'card' ? 48 : 24;

  return (
    <Animated.View
      entering={fadeIn}
      style={[styles.list, padded && styles.padded]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={[styles.item, variant === 'row' && styles.row]}>
          <Skeleton height={iconSize} width={iconSize} round />
          <View style={styles.lines}>
            <Skeleton height={16} width={index % 2 === 0 ? '70%' : '55%'} />
            {variant === 'card' ? <Skeleton height={12} width="40%" /> : null}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing }: AppTheme) =>
  StyleSheet.create({
    list: {
      gap: spacing.md,
    },
    padded: {
      padding: spacing.xl,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    row: {
      minHeight: sizes.checklistRowHeight,
      paddingVertical: spacing.sm,
      borderRadius: radii.lg,
    },
    lines: {
      flex: 1,
      gap: spacing.sm,
    },
  });
