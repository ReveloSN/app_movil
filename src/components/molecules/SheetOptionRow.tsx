import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SheetOptionRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress(): void;
  disabled?: boolean;
  /** Texto bajo la etiqueta (ej. por qué está desactivada). */
  hint?: string;
}

/** Opción de una hoja de acciones: ícono + texto, 56 dp de alto. */
export function SheetOptionRow({ icon, label, onPress, disabled = false, hint }: SheetOptionRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const color = disabled ? colors.textSecondary : colors.primary;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}
    >
      <Ionicons name={icon} size={iconSizes.lg} color={color} />
      <View style={styles.texts}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </PressableScale>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    labelDisabled: {
      color: colors.textSecondary,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
