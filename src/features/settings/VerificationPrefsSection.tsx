import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { useViewModePreference } from '@/features/checklist/useViewModePreference';
import { type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './settings.copy';

/** Cómo se abre la verificación en este teléfono: la lista o un ítem a la vez. */
export function VerificationPrefsSection() {
  const styles = useThemedStyles(createStyles);
  const { preferred, save } = useViewModePreference();

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.VERIFICATION_SECTION_TITLE} />
      <View style={styles.card}>
        <SwitchRow
          icon="albums-outline"
          label={copy.DECK_MODE_LABEL}
          value={preferred === 'deck'}
          disabled={preferred === null}
          onValueChange={(on) => save(on ? 'deck' : 'list')}
        />
        <Text style={styles.hint}>{copy.DECK_MODE_HINT}</Text>
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
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
