import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface VerifyHeaderProps {
  name: string;
  icon: IoniconName;
  /** Color de la rutina y su tinte (ya resueltos al tema). */
  accentColor: string;
  accentTint: string;
  checked: number;
  total: number;
  /** Texto de cierre, ej. "Cerrar verificación". */
  closeLabel: string;
  /** Conteo visible, ej. "3 de 8". */
  countLabel: string;
  /** Texto del progreso para lector de pantalla, ej. "3 de 8 ítems listos". */
  progressLabel: string;
  onClose(): void;
}

/** Encabezado de la verificación (P07-1 y P07-3): rutina, cierre y avance con su número a la vista. */
export function VerifyHeader({
  name,
  icon,
  accentColor,
  accentTint,
  checked,
  total,
  closeLabel,
  countLabel,
  progressLabel,
  onClose,
}: VerifyHeaderProps) {
  const { iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {/* Ícono con el color de la rutina: la identifica de un vistazo (el nombre va al lado). */}
        <View style={[styles.badge, { backgroundColor: accentTint }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name={icon} size={iconSizes.md} color={accentColor} />
        </View>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
          {name}
        </Text>
        <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} />
      </View>
      {/* La barra y su número van juntos: el lector oye el avance una sola vez, por la barra. */}
      <View style={styles.progressRow}>
        <View style={styles.bar}>
          <ProgressBar value={checked} max={total} accessibilityLabel={progressLabel} />
        </View>
        <Text style={styles.count} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {countLabel}
        </Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    header: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    // Del alto de la línea del título: decorativa, no quita sitio a la lista.
    badge: {
      width: typography.h1.lineHeight,
      height: typography.h1.lineHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    bar: {
      flex: 1,
    },
    // Cifras de ancho fijo: el número no empuja la barra al pasar de 9 a 10.
    count: {
      ...typography.caption,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
