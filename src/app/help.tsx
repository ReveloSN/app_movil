import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HELP_ENTRIES, HELP_TITLE } from '@/features/settings/help.content';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** Ayuda (11-6): preguntas frecuentes. Se abre desde Ajustes. */
export default function HelpScreen() {
  const { colors, typography } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {/* El Stack raíz oculta los encabezados: esta pantalla muestra el suyo para poder volver. */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: HELP_TITLE,
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: typography.h2,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {HELP_ENTRIES.map((entry) => (
          <View key={entry.question} style={styles.card}>
            <Text style={styles.question} accessibilityRole="header">
              {entry.question}
            </Text>
            <Text style={styles.answer}>{entry.answer}</Text>
          </View>
        ))}
      </ScrollView>
    </>
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
