import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import { IconButton } from '@/components/atoms/IconButton';
import { PressableScale } from '@/components/atoms/PressableScale';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { VERIFIED_TODAY_LABEL } from '@/features/home/home.copy';
import { formatDateTime, formatTime } from '@/shared/utils/formatDateTime';
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
  /** Ya se verificó hoy: marca la tarjeta con «Verificada hoy» (ícono + texto) y muestra solo la hora. */
  completedToday?: boolean;
  /** Texto y acción del botón de la tarjeta (ej. "Verificar ahora"). Sin él, no hay botón. */
  actionLabel?: string;
  onAction?(): void;
  /** Tocar el cuerpo de la tarjeta: abre la verificación, igual que el botón (Documento 3, P03). */
  onPress?(): void;
  /** Qué pasa al tocar el cuerpo, para lector de pantalla (ej. "Abre la verificación"). */
  pressHint?: string;
  /** Editar la rutina: botón explícito con ícono de lápiz. Sin él, no hay botón. */
  onEdit?(): void;
  /** Etiqueta hablada del botón de editar (ej. "Editar Salir de casa"). */
  editLabel?: string;
}

export function RoutineCard({
  name,
  icon,
  accentColor,
  accentTint,
  active,
  lastCompletedAt,
  completedToday = false,
  actionLabel,
  onAction,
  onPress,
  pressHint,
  onEdit,
  editLabel,
}: RoutineCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const lastCompleted = lastCompletedAt ? formatDateTime(lastCompletedAt) : null;
  const todayTime = completedToday && lastCompletedAt ? formatTime(lastCompletedAt) : null;
  const lastCompletedText = todayTime
    ? `Hoy, ${todayTime}`
    : lastCompleted
      ? `Última vez: ${lastCompleted}`
      : 'Aún no la has completado';
  const statusText = completedToday ? `${VERIFIED_TODAY_LABEL}. ${lastCompletedText}.` : `${lastCompletedText}.`;

  return (
    // La franja y el ícono llevan el color de la rutina; el nombre y el ícono la identifican sin él.
    <View style={[styles.card, { borderLeftColor: accentColor ?? colors.primary }]}>
      <View style={styles.top}>
        <PressableScale
          // Tarjeta grande: se encoge apenas (0,98) para no parecer que salta.
          pressedScale={0.98}
          // El flex va al contenedor animado (hijo de la fila); el Pressable interior solo alinea su contenido.
          containerStyle={styles.summaryContainer}
          style={styles.summary}
          onPress={onPress}
          disabled={!onPress}
          accessible
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityHint={onPress ? pressHint : undefined}
          // Solo se dice el estado cuando no es el de siempre: "Pausada".
          accessibilityLabel={active ? `${name}. ${statusText}` : `${name}. Pausada. ${statusText}`}
        >
          <View style={[styles.iconCircle, accentTint ? { backgroundColor: accentTint } : null]}>
            <Ionicons name={toIoniconName(icon, 'checkbox-outline')} size={iconSizes.lg} color={accentColor ?? colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.meta}>{lastCompletedText}</Text>
            {/* Bajo el nombre y no en la fila: junto al nombre lo cortaba y partía la hora en varias líneas. */}
            {completedToday ? (
              <View style={styles.doneChip}>
                <Chip tone="active" icon="checkmark-circle" label={VERIFIED_TODAY_LABEL} />
              </View>
            ) : null}
          </View>
          {active ? null : <Chip tone="paused" label="Pausada" />}
        </PressableScale>
        {/* Acción terciaria: fuera del cuerpo para que tocar la tarjeta nunca abra la edición por error. */}
        {onEdit ? <IconButton icon="create-outline" accessibilityLabel={editLabel ?? 'Editar'} onPress={onEdit} /> : null}
      </View>
      {actionLabel && onAction ? (
        <SecondaryButton icon="checkmark-done" label={actionLabel} accessibilityLabel={`${actionLabel}, ${name}`} onPress={onAction} />
      ) : null}
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
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    summaryContainer: {
      flex: 1,
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
    doneChip: {
      alignSelf: 'flex-start',
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
