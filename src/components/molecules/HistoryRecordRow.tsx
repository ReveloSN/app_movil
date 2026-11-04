import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { Chip, type ChipTone } from '@/components/atoms/Chip';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatTime } from '@/shared/utils/formatDateTime';
import { toIoniconName, type IoniconName } from '@/shared/utils/ioniconName';

interface HistoryRecordRowProps {
  routineName: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  routineIcon: string | null;
  /** Color de la rutina y su tinte (ya resueltos al tema); sin ellos, el principal. */
  accentColor?: string;
  accentTint?: string;
  /** ISO 8601. */
  date: string;
  result: { tone: ChipTone; icon: IoniconName; label: string };
  /** Etiqueta del tipo de rutina (ej. «Llegada»): ícono + texto. Sin ella, no se muestra nada. */
  kindLabel?: string;
  /** Si llega, la verificación aún no se subió: se muestra este texto con un ícono. */
  pendingLabel?: string;
  /** Abre el detalle del registro. */
  onPress?(): void;
  pressHint?: string;
}

/** Fila del historial (P09): rutina, hora y resultado. El resultado va con ícono + texto, no solo color. */
export function HistoryRecordRow({
  routineName,
  routineIcon,
  accentColor,
  accentTint,
  date,
  result,
  kindLabel,
  pendingLabel,
  onPress,
  pressHint,
}: HistoryRecordRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const time = formatTime(date);

  return (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? pressHint : undefined}
      accessibilityLabel={[routineName, kindLabel, time, result.label, pendingLabel].filter(Boolean).join('. ')}
    >
      <View style={[styles.iconCircle, accentTint ? { backgroundColor: accentTint } : null]}>
        <Ionicons name={toIoniconName(routineIcon, 'checkbox-outline')} size={iconSizes.md} color={accentColor ?? colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {routineName}
        </Text>
        {kindLabel ? (
          <View style={styles.pending}>
            <Ionicons name="enter-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.time}>{kindLabel}</Text>
          </View>
        ) : null}
        {time ? <Text style={styles.time}>{time}</Text> : null}
        {pendingLabel ? (
          <View style={styles.pending}>
            <Ionicons name="cloud-upload-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.time}>{pendingLabel}</Text>
          </View>
        ) : null}
      </View>
      <Chip tone={result.tone} icon={result.icon} label={result.label} />
    </PressableScale>
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
