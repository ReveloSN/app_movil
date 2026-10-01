import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

interface LoadingStateProps {
  accessibilityLabel?: string;
}

export function LoadingState({ accessibilityLabel = 'Cargando' }: LoadingStateProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
