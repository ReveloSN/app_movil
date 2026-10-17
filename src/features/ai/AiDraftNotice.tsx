import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './ai.copy';

/** Indicador discreto en P04 cuando el borrador lo hizo la IA: qué revisar y que aún no está guardado. */
export function AiDraftNotice({ suggestsWifiExit }: { suggestsWifiExit: boolean }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <Chip tone="neutral" icon="sparkles-outline" label={copy.AI_BADGE_LABEL} />
      <Text style={styles.text}>{copy.DRAFT_REVIEW_HINT}</Text>
      {suggestsWifiExit ? <Text style={styles.text}>{copy.WIFI_SUGGESTION_HINT}</Text> : null}
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    box: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.neutralSurface,
    },
    text: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
