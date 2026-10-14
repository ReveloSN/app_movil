import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface TextButtonProps {
  label: string;
  onPress(): void;
  /** danger: acciones destructivas (ej. "Eliminar rutina"). */
  tone?: 'primary' | 'danger';
  disabled?: boolean;
}

/** Botón solo texto (ej. "Cancelar" en el encabezado). Área táctil mínima de 44pt. */
export function TextButton({ label, onPress, tone = 'primary', disabled = false }: TextButtonProps) {
  const { colors } = useAppTheme();
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
      <Text style={[styles.label, { color: tone === 'danger' ? colors.danger : colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = ({ sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    button: {
      minHeight: sizes.secondaryRowHeight,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    pressed: {
      opacity: 0.6,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      ...typography.labelMedium,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
