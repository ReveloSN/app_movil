import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface NextRoutineCardProps {
  /** Rótulo del bloque (ej. "Próxima rutina"). */
  label: string;
  name: string;
  /** Cuándo suena (ej. "Hoy, 6:00 p. m."). */
  when: string;
  actionLabel: string;
  onAction(): void;
  /** Ícono de la rutina (Ionicons). */
  icon: IoniconName;
  /** Color de la rutina y su tinte (ya resueltos al tema). */
  accentColor: string;
  accentTint: string;
}

/** Bloque destacado de Inicio (P03-2): nombre en estilo Título y cuándo suena debajo. */
export function NextRoutineCard({ label, name, when, actionLabel, onAction, icon, accentColor, accentTint }: NextRoutineCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <View style={styles.row} accessible accessibilityLabel={`${label}: ${name}. ${when}.`}>
        <View style={[styles.iconCircle, { backgroundColor: accentTint }]}>
          <Ionicons name={icon} size={iconSizes.lg} color={accentColor} />
        </View>
        <View style={styles.texts}>
          <View style={styles.labelRow}>
            <Ionicons name="alarm-outline" size={iconSizes.sm} color={colors.primary} />
            <Text style={styles.label}>{label}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.when}>{when}</Text>
        </View>
      </View>
      <SecondaryButton icon="checkmark-done" label={actionLabel} onPress={onAction} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      borderWidth: 1,
      // Tarjeta destacada: superficie teñida (el borde toma el color de la rutina).
      backgroundColor: colors.accentSurface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconCircle: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texts: {
      flex: 1,
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
