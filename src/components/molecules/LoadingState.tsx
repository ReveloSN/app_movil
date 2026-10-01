import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface LoadingStateProps {
  accessibilityLabel?: string;
}

export function LoadingState({ accessibilityLabel = 'Cargando' }: LoadingStateProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container} accessible accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
