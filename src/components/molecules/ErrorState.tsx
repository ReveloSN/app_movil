import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ErrorStateProps {
  message: string;
  onRetry(): void;
  retryLabel?: string;
}

/** Estado de error de pantalla completa con reintento. */
export function ErrorState({ message, onRetry, retryLabel = 'Reintentar' }: ErrorStateProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.content} accessibilityRole="alert">
        <Ionicons name="cloud-offline-outline" size={iconSizes.xl} color={colors.danger} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <PrimaryButton label={retryLabel} onPress={onRetry} />
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.xl,
      padding: spacing.xxl,
      backgroundColor: colors.background,
    },
    content: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    message: {
      ...typography.body,
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
