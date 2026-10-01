import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme/tokens';

type Tone = 'error' | 'info';

const ICON_BY_TONE = { error: 'alert-circle', info: 'information-circle' } as const;
const COLOR_BY_TONE = { error: colors.error, info: colors.primary } as const;

interface StatusMessageProps {
  tone: Tone;
  message: string;
}

/** Mensaje a nivel de formulario/pantalla. Siempre ícono + texto. */
export function StatusMessage({ tone, message }: StatusMessageProps) {
  const color = COLOR_BY_TONE[tone];

  return (
    <View
      style={[styles.container, { borderColor: color }]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={ICON_BY_TONE[tone]} size={20} color={color} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
