import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface SyncStatusRowProps {
  icon: IoniconName;
  label: string;
  /** error: hay cambios rechazados. El estado siempre va con ícono + texto, nunca solo color. */
  tone?: 'info' | 'error';
  style?: StyleProp<ViewStyle>;
}

/** Fila compacta de estado de sincronización (ej. "3 cambios sin sincronizar"). */
export function SyncStatusRow({ icon, label, tone = 'info', style }: SyncStatusRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const color = tone === 'error' ? colors.danger : colors.primary;

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={iconSizes.md} color={color} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.neutralSurface,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      flexShrink: 1,
    },
  });
