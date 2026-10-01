import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SecondaryButtonProps {
  label: string;
  onPress(): void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
}

/** Botón con borde, para acciones secundarias (ej. "Añadir ítem"). */
export function SecondaryButton({ label, onPress, icon, disabled = false }: SecondaryButtonProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon ? <Ionicons name={icon} size={iconSizes.md} color={colors.primary} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: sizes.secondaryRowHeight,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radii.xl,
    },
    pressed: {
      backgroundColor: colors.primaryTint,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      ...typography.labelMedium,
      color: colors.primary,
    },
  });
