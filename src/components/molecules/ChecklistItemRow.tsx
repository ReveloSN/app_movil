import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { toIoniconName } from '@/shared/utils/ioniconName';

interface ChecklistItemRowProps {
  label: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  icon: string | null;
  critical: boolean;
  checked: boolean;
  onToggle(): void;
}

/**
 * Fila tocable de la verificación (56pt). Marcado = verde + check; crítico = bandera + texto
 * para lector de pantalla. Ningún estado depende solo del color.
 */
export function ChecklistItemRow({ label, icon, critical, checked, onToggle }: ChecklistItemRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={critical ? `${label}, crítico` : label}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.pressed]}
    >
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={iconSizes.lg}
        color={checked ? colors.primary : colors.textSecondary}
      />
      <Ionicons name={toIoniconName(icon, 'cube-outline')} size={iconSizes.md} color={colors.textMuted} />
      <Text style={[styles.label, checked && styles.labelChecked]} numberOfLines={2}>
        {label}
      </Text>
      {critical ? <Ionicons name="flag" size={iconSizes.md} color={colors.criticalText} /> : null}
    </Pressable>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.card,
    },
    rowChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryTint,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    labelChecked: {
      ...typography.bodyStrong,
      color: colors.primary,
    },
  });
