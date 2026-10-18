import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { Chip } from '@/components/atoms/Chip';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDateTime } from '@/shared/utils/formatDateTime';
import { toIoniconName } from '@/shared/utils/ioniconName';

interface RoutineCardProps {
  name: string;
  /** Nombre de ícono de Ionicons; si no es válido se usa uno genérico. */
  icon: string | null;
  /** Color de la rutina (ya resuelto al tema): franja e ícono. Sin él, el principal. */
  accentColor?: string;
  /** Tinte del mismo color para el fondo del ícono. */
  accentTint?: string;
  active: boolean;
  /** ISO 8601. */
  lastCompletedAt: string | null;
  /** Texto y acción del botón de la tarjeta (ej. "Verificar ahora"). Sin él, no hay botón. */
  actionLabel?: string;
  onAction?(): void;
  /** Tocar el resumen de la tarjeta (ej. abrir la edición). */
  onPress?(): void;
  /** Qué pasa al tocarla, para lector de pantalla (ej. "Edita la rutina"). */
  pressHint?: string;
}

export function RoutineCard({
  name,
  icon,
  accentColor,
  accentTint,
  active,
  lastCompletedAt,
  actionLabel,
  onAction,
  onPress,
  pressHint,
}: RoutineCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const lastCompleted = lastCompletedAt ? formatDateTime(lastCompletedAt) : null;
  const statusLabel = active ? 'Activa' : 'Pausada';
  const lastCompletedText = lastCompleted ? `Última vez: ${lastCompleted}` : 'Aún no la has completado';

  return (
    // La franja y el ícono llevan el color de la rutina; el nombre y el ícono la identifican sin él.
    <View style={[styles.card, { borderLeftColor: accentColor ?? colors.primary }]}>
      <PressableScale
        // Tarjeta grande: se encoge apenas (0,98) para no parecer que salta.
        pressedScale={0.98}
        style={styles.summary}
        onPress={onPress}
        disabled={!onPress}
        accessible
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityHint={onPress ? pressHint : undefined}
        accessibilityLabel={`${name}. ${statusLabel}. ${lastCompletedText}.`}
      >
        <View style={[styles.iconCircle, accentTint ? { backgroundColor: accentTint } : null]}>
          <Ionicons name={toIoniconName(icon, 'checkbox-outline')} size={iconSizes.lg} color={accentColor ?? colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.meta}>{lastCompletedText}</Text>
        </View>
        <Chip tone={active ? 'active' : 'paused'} label={statusLabel} />
        {onPress ? <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textSecondary} /> : null}
      </PressableScale>
      {actionLabel && onAction ? <SecondaryButton icon="checkmark-done" label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      borderLeftWidth: spacing.xs,
      backgroundColor: colors.card,
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
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
      ...typography.label,
      color: colors.textSecondary,
    },
  });
