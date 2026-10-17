import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import * as aiCopy from '@/features/ai/ai.copy';
import { updateAiPrefs, useAiPrefs } from '@/features/ai/ai.prefs';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** "Sugerencias con IA": interruptor local (este teléfono). Apagado, la IA no aparece en la app. */
export function AiSettingsSection() {
  const styles = useThemedStyles(createStyles);
  const { enabled } = useAiPrefs();
  const [error, setError] = useState<string | null>(null);

  function toggle(value: boolean) {
    setError(null);
    updateAiPrefs({ enabled: value }).catch(() => setError(aiCopy.SETTINGS_SAVE_ERROR));
  }

  return (
    <View style={styles.section}>
      <SectionLabel label={aiCopy.SETTINGS_SECTION_TITLE} />
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <View style={styles.card}>
        <SwitchRow icon="sparkles-outline" label={aiCopy.SETTINGS_SWITCH_LABEL} value={enabled} onValueChange={toggle} />
        <Text style={styles.hint}>{aiCopy.SETTINGS_HINT}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
