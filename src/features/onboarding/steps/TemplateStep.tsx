import { StyleSheet, Text, View } from 'react-native';

import type { PresetTemplate } from '@/features/routine-templates/routine-templates.types';
import { TemplateList } from '@/features/routine-templates/TemplateList';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import onboardingCopy from '../onboarding.copy';

/** Paso 2: el selector de P10 tal cual; "Usar plantilla" elige y avanza. */
export function TemplateStep({ onUse }: { onUse(template: PresetTemplate): void }) {
  const styles = useThemedStyles(createStyles);

  return (
    <TemplateList
      onUse={onUse}
      departuresOnly
      header={
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {onboardingCopy.TEMPLATES_TITLE}
          </Text>
          <Text style={styles.body}>{onboardingCopy.TEMPLATES_BODY}</Text>
        </View>
      }
    />
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    header: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
