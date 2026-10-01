import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const MESSAGE = 'Sin conexión a internet';

/** Franja superior de "sin conexión". Quien la usa decide cuándo montarla. */
export function OfflineBanner() {
  const { colors, iconSizes, spacing } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  // Ocupa la zona de la barra de estado: la franja queda pegada al borde superior real.
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={[styles.banner, { paddingTop: top + spacing.sm }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={MESSAGE}
    >
      <Ionicons name="cloud-offline-outline" size={iconSizes.md} color={colors.criticalText} />
      <Text style={styles.text}>{MESSAGE}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      backgroundColor: colors.criticalBg,
    },
    text: {
      ...typography.labelMedium,
      color: colors.criticalText,
    },
  });
