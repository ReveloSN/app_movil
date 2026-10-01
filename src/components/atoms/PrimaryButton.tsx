import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '@/shared/theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress(): void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function PrimaryButton({ label, onPress, loading = false, disabled = false, accessibilityHint }: PrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    backgroundColor: colors.primaryDisabled,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.button,
    color: colors.onPrimary,
  },
});
