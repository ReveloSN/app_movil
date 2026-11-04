import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Skeleton, SkeletonGroup } from '@/components/atoms/Skeleton';
import { useDelayedFlag } from '@/shared/hooks/useDelayedFlag';
import { fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './history.copy';

interface HistorySkeletonProps {
  /** true mientras carga el primer listado. El esqueleto aparece tras ~150 ms; antes, solo el fondo (sin parpadeo). */
  loading: boolean;
  /** Cuántas filas de registro dibujar. */
  rows?: number;
}

/** Esqueleto del Historial con la forma de una fila de registro: ícono, rutina y hora, y el resultado a la derecha. */
export function HistorySkeleton({ loading, rows = 5 }: HistorySkeletonProps) {
  const { sizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const visible = useDelayedFlag(loading);

  if (!visible) return <View style={styles.container} />;

  return (
    <Animated.View entering={fadeIn} style={styles.container}>
      <SkeletonGroup accessibilityLabel={copy.LOADING_LABEL} style={styles.list}>
        {Array.from({ length: rows }, (_, index) => (
          <View key={index} style={styles.row}>
            <Skeleton variant="circle" width={sizes.secondaryRowHeight} />
            <View style={styles.lines}>
              <Skeleton height={16} width={index % 2 === 0 ? '70%' : '55%'} />
              <Skeleton height={12} width="30%" />
            </View>
            <Skeleton height={28} width={84} />
          </View>
        ))}
      </SkeletonGroup>
    </Animated.View>
  );
}

const createStyles = ({ colors, radii, spacing }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      gap: spacing.md,
      padding: spacing.xl,
      paddingTop: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    lines: {
      flex: 1,
      gap: spacing.sm,
    },
  });
