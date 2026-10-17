import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface NextRoutineCardProps {
  /** Rótulo del bloque (ej. "Próxima rutina"). */
  label: string;
  name: string;
  /** Cuándo suena (ej. "Hoy, 6:00 p. m."). */
  when: string;
  actionLabel: string;
  onAction(): void;
}

/** Bloque destacado de Inicio (P03-2): nombre en estilo Título y cuándo suena debajo. */
export function NextRoutineCard({ label, name, when, actionLabel, onAction }: NextRoutineCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.texts} accessible accessibilityLabel={`${label}: ${name}. ${when}.`}>
        <View style={styles.labelRow}>
          <Ionicons name="alarm-outline" size={iconSizes.sm} color={colors.primary} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.when}>{when}</Text>
      </View>
      <SecondaryButton icon="checkmark-done" label={actionLabel} onPress={onAction} />
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    texts: {
      gap: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    label: {
      ...typography.caption,
      color: colors.primary,
    },
    name: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    when: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
