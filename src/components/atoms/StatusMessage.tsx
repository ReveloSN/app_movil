import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

type Tone = 'error' | 'info';

const ICON_BY_TONE = { error: 'alert-circle', info: 'information-circle' } as const;

interface StatusMessageProps {
  tone: Tone;
  message: string;
}

/** Mensaje a nivel de formulario/pantalla. Siempre ícono + texto. */
export function StatusMessage({ tone, message }: StatusMessageProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const color = tone === 'error' ? colors.danger : colors.primary;

  return (
    <View
      style={[styles.container, { borderColor: color }]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={ICON_BY_TONE[tone]} size={iconSizes.md} color={color} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
      borderWidth: 1,
      borderRadius: radii.md,
      backgroundColor: colors.neutralSurface,
    },
    text: {
      ...typography.label,
      color: colors.textPrimary,
      flexShrink: 1,
    },
  });
