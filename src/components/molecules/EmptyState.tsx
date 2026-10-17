import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { durations, fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
}

const iconEntering = ZoomIn.duration(durations.slow).reduceMotion(ReduceMotion.System);
const textEntering = FadeInUp.duration(durations.base).delay(80).reduceMotion(ReduceMotion.System);

export function EmptyState({ icon, message }: EmptyStateProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    // EV-01 / EV-02: el ícono entra con una escala suave y el texto lo sigue.
    <Animated.View entering={fadeIn} style={styles.container} accessible accessibilityLabel={message}>
      <Animated.View entering={iconEntering}>
        <Ionicons name={icon} size={iconSizes.xl} color={colors.textSecondary} />
      </Animated.View>
      <Animated.View entering={textEntering}>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.xxl,
      backgroundColor: colors.background,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
