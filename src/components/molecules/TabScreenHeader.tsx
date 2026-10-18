import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const HEADER_HEIGHT = 56;

/** Encabezado de las pestañas (Rutinas, Historial, Ajustes): el mismo aspecto que el de la barra de pestañas. */
export function TabScreenHeader({ title }: { title: string }) {
  const styles = useThemedStyles(createStyles);
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: top, minHeight: HEADER_HEIGHT + top }]}>
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    header: {
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
  });
