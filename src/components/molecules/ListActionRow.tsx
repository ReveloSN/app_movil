import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ListActionRowProps {
  label: string;
  onPress(): void;
  disabled?: boolean;
  /** Por qué está deshabilitada, para lector de pantalla. */
  disabledHint?: string;
}

/** Última fila de una lista agrupada: "+ Añadir …" (mockup P04). */
export function ListActionRow({ label, onPress, disabled = false, disabledHint }: ListActionRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const color = disabled ? colors.textSecondary : colors.primary;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={disabled ? disabledHint : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}
    >
      <Ionicons name="add" size={iconSizes.md} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </PressableScale>
  );
}

const createStyles = ({ sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.lg,
    },
    label: {
      ...typography.labelMedium,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
