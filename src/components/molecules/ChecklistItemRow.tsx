import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { toIoniconName } from '@/shared/utils/ioniconName';

interface ChecklistItemRowProps {
  label: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  icon: string | null;
  critical: boolean;
  /** Texto de "crítico" para lector de pantalla (ej. "crítico"). */
  criticalLabel: string;
  /** 07-5: nota bajo la etiqueta, en estilo Secundario. */
  note?: string | null;
  checked: boolean;
  onToggle(): void;
}

/**
 * Fila tocable de la verificación (56pt). Marcado = verde + check; crítico = bandera + texto
 * para lector de pantalla. Ningún estado depende solo del color.
 */
export function ChecklistItemRow({ label, icon, critical, criticalLabel, note, checked, onToggle }: ChecklistItemRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={[critical ? `${label}, ${criticalLabel}` : label, note].filter(Boolean).join('. ')}
      onPress={onToggle}
      style={[styles.row, checked && styles.rowChecked]}
    >
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={iconSizes.lg}
        color={checked ? colors.primary : colors.textSecondary}
      />
      <Ionicons name={toIoniconName(icon, 'cube-outline')} size={iconSizes.md} color={colors.textMuted} />
      <View style={styles.texts}>
        <Text style={[styles.label, checked && styles.labelChecked]} numberOfLines={2}>
          {label}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={2}>
            {note}
          </Text>
        ) : null}
      </View>
      {critical ? <Ionicons name="flag" size={iconSizes.md} color={colors.criticalText} /> : null}
    </PressableScale>
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
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.card,
    },
    rowChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryTint,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
    },
    note: {
      ...typography.label,
      color: colors.textSecondary,
    },
    labelChecked: {
      ...typography.bodyStrong,
      color: colors.primary,
    },
  });
