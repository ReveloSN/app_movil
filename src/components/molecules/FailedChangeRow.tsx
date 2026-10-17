import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { TextButton } from '@/components/atoms/TextButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface FailedChangeRowProps {
  /** Qué cambio es (ej. "Crear la rutina «Casa»"). */
  title: string;
  /** Por qué el servidor no lo aceptó. */
  reason: string;
  retryLabel: string;
  discardLabel: string;
  onRetry(): void;
  onDiscard(): void;
}

/** Cambio que no se pudo sincronizar, con sus dos salidas. El error va con ícono + texto. */
export function FailedChangeRow({ title, reason, retryLabel, discardLabel, onRetry, onDiscard }: FailedChangeRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header} accessible accessibilityLabel={`${title}. ${reason}`}>
        <Ionicons name="alert-circle" size={iconSizes.md} color={colors.danger} />
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TextButton label={retryLabel} onPress={onRetry} />
        <TextButton label={discardLabel} tone="danger" onPress={onDiscard} />
      </View>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    header: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    reason: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
  });
