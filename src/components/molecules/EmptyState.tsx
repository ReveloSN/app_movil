import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container} accessible accessibilityLabel={message}>
      <Ionicons name={icon} size={iconSizes.xl} color={colors.textSecondary} />
      <Text style={styles.message}>{message}</Text>
    </View>
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
