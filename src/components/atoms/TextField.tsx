import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Muestra "n/máx" junto a la etiqueta (requiere maxLength). */
  showCounter?: boolean;
}

export function TextField({ label, error, showCounter = false, onFocus, onBlur, ...inputProps }: TextFieldProps) {
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
      <TextInput
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
        style={[styles.input, focused && styles.inputFocused, error ? styles.inputError : null]}
        {...inputProps}
      />
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
    input: {
      ...typography.body,
      minHeight: sizes.inputHeight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      color: colors.textPrimary,
      backgroundColor: colors.card,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    inputError: {
      borderColor: colors.danger,
      borderWidth: 2,
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
