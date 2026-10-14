import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SectionLabelProps {
  label: string;
  /** Texto a la derecha (ej. contador "4/12"). */
  trailing?: string;
  /** Lectura completa para lector de pantalla (ej. "Ítems, 4 de 12"). */
  accessibilityLabel?: string;
}

/** Encabezado de bloque de formulario en mayúsculas (mockup P04: "ÍTEMS", "AVISOS"). */
export function SectionLabel({ label, trailing, accessibilityLabel }: SectionLabelProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={styles.label}>{label}</Text>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    trailing: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
