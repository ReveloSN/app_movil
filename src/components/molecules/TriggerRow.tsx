import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface TriggerRowProps {
  icon: IoniconName;
  /** Frase resumen (ej. "Te avisaremos cuando salgas de Casa."). */
  summary: string;
  /** Tipo de aviso (ej. "Salir del Wi-Fi"). */
  typeLabel: string;
  onEdit(): void;
  onRemove(): void;
}

/**
 * Fila de aviso dentro de la lista agrupada de P04 (04-5): se toca para editarlo en P06
 * (chevrón) y el ícono de papelera lo quita de la lista antes de guardar.
 */
export function TriggerRow({ icon, summary, typeLabel, onEdit, onRemove }: TriggerRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${summary} ${typeLabel}.`}
        accessibilityHint="Edita el aviso"
        onPress={onEdit}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
        <View style={styles.texts}>
          <Text style={styles.summary}>{summary}</Text>
          <Text style={styles.type}>{typeLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textSecondary} />
      </Pressable>
      <IconButton icon="trash-outline" tone="danger" accessibilityLabel={`Quitar aviso: ${summary}`} onPress={onRemove} />
    </View>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: sizes.checklistRowHeight,
      paddingLeft: spacing.lg,
      paddingRight: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
    texts: {
      flex: 1,
    },
    summary: {
      ...typography.body,
      color: colors.textPrimary,
    },
    type: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
