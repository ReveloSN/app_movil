import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface PrimaryButtonProps {
  label: string;
  onPress(): void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Si el texto visible no basta para el lector de pantalla. Debe empezar por el texto visible. */
  accessibilityLabel?: string;
}

// El botón mide 52 (mockup); el hitSlop amplía el área táctil a 56 (regla de accesibilidad).
const HIT_SLOP = 2;

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  accessibilityHint,
  icon,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={iconSizes.md} color={colors.onPrimary} /> : null}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    button: {
      minHeight: sizes.primaryButtonHeight,
      borderRadius: radii.xl,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      flexDirection: 'row',
      gap: spacing.sm,
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
