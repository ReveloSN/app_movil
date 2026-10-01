import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface PrimaryButtonProps {
  label: string;
  onPress(): void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

// El botón mide 52 (mockup); el hitSlop amplía el área táctil a 56 (regla de accesibilidad).
const HIT_SLOP = 2;

export function PrimaryButton({ label, onPress, loading = false, disabled = false, accessibilityHint }: PrimaryButtonProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, inactive && styles.inactive]}
    >
      {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    button: {
      minHeight: sizes.primaryButtonHeight,
      borderRadius: radii.xl,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: colors.primaryPressed,
    },
    inactive: {
      opacity: 0.5,
    },
    label: {
      ...typography.bodyStrong,
      color: colors.onPrimary,
    },
  });
