import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme/tokens';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel={message}>
      <Ionicons name={icon} size={48} color={colors.textSecondary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
