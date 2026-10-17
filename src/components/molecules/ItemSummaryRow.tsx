import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface ItemSummaryRowProps {
  label: string;
  icon: IoniconName;
  critical: boolean;
  /** Texto de "crítico" junto a la bandera (nunca solo color ni solo ícono). */
  criticalLabel: string;
  note?: string;
  error?: string;
  onPress(): void;
  /** Lectura del botón de editar (ej. "Editar Llaves"). */
  editHint: string;
  /** Sin él no se muestra el botón de quitar. */
  onRemove?(): void;
  removeLabel: string;
}

/** Fila de un ítem en P04: ícono, etiqueta, bandera de crítico y nota. Tocarla abre P05. */
export function ItemSummaryRow({
  label,
  icon,
  critical,
  criticalLabel,
  note,
  error,
  onPress,
  editHint,
  onRemove,
  removeLabel,
}: ItemSummaryRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.row, error ? styles.rowError : null]}>
      <Pressable
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[label, critical ? criticalLabel : null, note, error].filter(Boolean).join('. ')}
        accessibilityHint={editHint}
      >
        <Ionicons name={icon} size={iconSizes.md} color={colors.textMuted} />
        <View style={styles.texts}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {note ? (
            <Text style={styles.note} numberOfLines={2}>
              {note}
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        {critical ? (
          <View style={styles.critical}>
            <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} />
            <Text style={styles.criticalText}>{criticalLabel}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textSecondary} />
      </Pressable>
      {onRemove ? <IconButton icon="trash-outline" tone="danger" accessibilityLabel={removeLabel} onPress={onRemove} /> : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingRight: spacing.xs,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    rowError: {
      borderWidth: 2,
      borderColor: colors.danger,
    },
    main: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.checklistRowHeight,
      paddingVertical: spacing.sm,
      paddingLeft: spacing.lg,
    },
    pressed: {
      opacity: 0.7,
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
    error: {
      ...typography.caption,
      color: colors.danger,
    },
    critical: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
      backgroundColor: colors.criticalBg,
    },
    criticalText: {
      ...typography.caption,
      color: colors.criticalText,
    },
  });
