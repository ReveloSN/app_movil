import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Skeleton, SkeletonGroup } from '@/components/atoms/Skeleton';
import { useDelayedFlag } from '@/shared/hooks/useDelayedFlag';
import { fadeIn } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface HomeSkeletonProps {
  /** true mientras cargan los datos. El esqueleto aparece tras ~150 ms; antes, solo el fondo (sin parpadeo). */
  loading: boolean;
  /** Lo que oye el lector de pantalla. */
  accessibilityLabel: string;
  /** Cuántas tarjetas de rutina dibujar bajo la próxima rutina. */
  cards?: number;
}

/** Esqueleto de Inicio: banda, tarjeta de próxima rutina y lista de rutinas, con la forma del contenido real. */
export function HomeSkeleton({ loading, accessibilityLabel, cards = 3 }: HomeSkeletonProps) {
  const styles = useThemedStyles(createStyles);
  const visible = useDelayedFlag(loading);

  if (!visible) return <View style={styles.container} />;

  return (
    <Animated.View entering={fadeIn} style={styles.container}>
      <SkeletonGroup accessibilityLabel={accessibilityLabel} style={styles.content}>
        <Skeleton variant="card" height={96} />
        <View style={styles.next}>
          <View style={styles.row}>
            <Skeleton variant="circle" width={48} />
            <View style={styles.lines}>
              <Skeleton width="35%" height={12} />
              <Skeleton width="60%" height={18} />
              <Skeleton width="45%" height={14} />
            </View>
          </View>
          <Skeleton height={52} />
        </View>
        {Array.from({ length: cards }, (_, index) => (
          <View key={index} style={styles.card}>
            <Skeleton variant="circle" width={48} />
            <View style={styles.lines}>
              <Skeleton width={index % 2 === 0 ? '70%' : '55%'} height={16} />
              <Skeleton width="40%" height={12} />
            </View>
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
    content: {
      gap: spacing.md,
      padding: spacing.xl,
    },
    next: {
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.accentSurface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    card: {
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
