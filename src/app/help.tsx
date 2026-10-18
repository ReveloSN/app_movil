import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HELP_ENTRIES } from '@/features/settings/help.content';
import { useScrollEndPadding } from '@/shared/hooks/useScrollEndPadding';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** Ayuda (11-6): preguntas frecuentes. Se abre desde Ajustes. */
export default function HelpScreen() {
  const styles = useThemedStyles(createStyles);
  const endPadding = useScrollEndPadding();

  return (
    <ScrollView contentContainerStyle={[styles.content, endPadding]}>
      {HELP_ENTRIES.map((entry) => (
        <View key={entry.question} style={styles.card}>
          <Text style={styles.question} accessibilityRole="header">
            {entry.question}
          </Text>
          <Text style={styles.answer}>{entry.answer}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    content: {
      gap: spacing.md,
      padding: spacing.xl,
    },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    question: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    answer: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
