import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { statusLabel } from './permission.copy';
import type { PermissionState } from './permission.types';

/** Estado de un permiso: ícono + texto (nunca solo color). Lo usan P02 y Ajustes (11-2). */
export function PermissionStatus({ state }: { state: PermissionState | null }) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const granted = state?.granted ?? false;

  return (
    <View style={styles.status} accessible accessibilityLabel={`Estado: ${statusLabel(state)}`}>
      <Ionicons
        name={granted ? 'checkmark-circle' : 'alert-circle'}
        size={iconSizes.md}
        color={granted ? colors.primary : colors.criticalText}
      />
      <Text style={styles.text}>{statusLabel(state)}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    text: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      flexShrink: 1,
    },
  });
