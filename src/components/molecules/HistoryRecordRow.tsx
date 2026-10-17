import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, type ChipTone } from '@/components/atoms/Chip';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatTime } from '@/shared/utils/formatDateTime';
import { toIoniconName, type IoniconName } from '@/shared/utils/ioniconName';

interface HistoryRecordRowProps {
  routineName: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  routineIcon: string | null;
  /** ISO 8601. */
  date: string;
  result: { tone: ChipTone; icon: IoniconName; label: string };
  /** Si llega, la verificación aún no se subió: se muestra este texto con un ícono. */
  pendingLabel?: string;
}

/** Fila del historial (P09): rutina, hora y resultado. El resultado va con ícono + texto, no solo color. */
export function HistoryRecordRow({ routineName, routineIcon, date, result, pendingLabel }: HistoryRecordRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const time = formatTime(date);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={[routineName, time, result.label, pendingLabel].filter(Boolean).join('. ')}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={toIoniconName(routineIcon, 'checkbox-outline')} size={iconSizes.md} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {routineName}
        </Text>
        {time ? <Text style={styles.time}>{time}</Text> : null}
        {pendingLabel ? (
          <View style={styles.pending}>
            <Ionicons name="cloud-upload-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.time}>{pendingLabel}</Text>
          </View>
        ) : null}
      </View>
      <Chip tone={result.tone} icon={result.icon} label={result.label} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    iconCircle: {
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
    time: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
    pending: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });
