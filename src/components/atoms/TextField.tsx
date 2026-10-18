import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Muestra "n/máx" junto a la etiqueta (requiere maxLength). */
  showCounter?: boolean;
  /** Para llevar el foco al campo (ej. al primer error). */
  ref?: Ref<TextInput>;
  /** Ícono decorativo al inicio del campo (ej. sobre de "Correo"). */
  icon?: IoniconName;
  /** Acción al final del campo (ej. mostrar u ocultar la contraseña). */
  trailing?: ReactNode;
}

export function TextField({ label, error, showCounter = false, onFocus, onBlur, ref, icon, trailing, ...inputProps }: TextFieldProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const length = inputProps.value?.length ?? 0;
  const max = inputProps.maxLength;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showCounter && max ? (
          <Text style={styles.counter} accessibilityLabel={`${length} de ${max} caracteres`}>
            {length}/{max}
          </Text>
        ) : null}
      </View>
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        {icon ? (
          <Ionicons name={icon} size={iconSizes.md} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? (
        // Ícono + texto: el error no se comunica solo con color.
        <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={iconSizes.sm} color={colors.danger} accessibilityElementsHidden importantForAccessibility="no" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      flexShrink: 1,
    },
    counter: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
    // El borde va en la fila (ícono + campo + acción); el foco y el error lo engrosan.
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: sizes.inputHeight,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.card,
    },
    fieldFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
      paddingHorizontal: spacing.md - 1,
    },
    fieldError: {
      borderColor: colors.danger,
      borderWidth: 2,
      paddingHorizontal: spacing.md - 1,
    },
    input: {
      ...typography.body,
      flex: 1,
      minHeight: sizes.inputHeight - 2,
      paddingHorizontal: 0,
      color: colors.textPrimary,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      flexShrink: 1,
    },
  });
