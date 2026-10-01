import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDateTime } from '@/shared/utils/formatDateTime';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const FALLBACK_ICON: IoniconName = 'checkbox-outline';

const toIoniconName = (icon: string | null): IoniconName =>
  icon && icon in Ionicons.glyphMap ? (icon as IoniconName) : FALLBACK_ICON;

interface RoutineCardProps {
  name: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  icon: string | null;
  active: boolean;
  /** ISO 8601. */
  lastCompletedAt: string | null;
}

export function RoutineCard({ name, icon, active, lastCompletedAt }: RoutineCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const lastCompleted = lastCompletedAt ? formatDateTime(lastCompletedAt) : null;
  const statusLabel = active ? 'Activa' : 'Pausada';
  const lastCompletedText = lastCompleted ? `Última vez: ${lastCompleted}` : 'Aún no la has completado';

  return (
    <View style={styles.card} accessible accessibilityLabel={`${name}. ${statusLabel}. ${lastCompletedText}.`}>
      <View style={styles.iconCircle}>
        <Ionicons name={toIoniconName(icon)} size={iconSizes.lg} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta}>{lastCompletedText}</Text>
      </View>
      <Chip tone={active ? 'active' : 'paused'} label={statusLabel} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    iconCircle: {
      // Mismo alto que una fila secundaria del mockup.
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryTint,
    },
    body: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    meta: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
  });
