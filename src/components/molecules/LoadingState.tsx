import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface LoadingStateProps {
  accessibilityLabel?: string;
}

export function LoadingState({ accessibilityLabel = 'Cargando' }: LoadingStateProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    // Transición suave entre cargando, vacío, error y contenido: cada estado entra con un fundido.
    <Animated.View entering={fadeIn} style={styles.container} accessible accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </Animated.View>
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
