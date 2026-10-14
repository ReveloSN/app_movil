import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { normalizeSnooze, SNOOZE_OPTIONS } from '@/features/notifications/notification.prefs';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './settings.copy';
import { useSettings } from './useSettings';

// SegmentedControl trabaja con strings; el valor guardado es número de minutos.
const SNOOZE_SEGMENTS = SNOOZE_OPTIONS.map((minutes) => ({ value: String(minutes), label: copy.snoozeOptionLabel(minutes) }));

/** No molestar (11-3), Posponer (11-4) y Sonido (11-5): guardados en `settings` y aplicados a los avisos. */
export function NotificationPrefsSection() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { settings, loading, error, saveError, retry, update } = useSettings();

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.NOTIFICATIONS_SECTION_TITLE} />
      {saveError ? <StatusMessage tone="error" message={saveError} /> : null}
      <View style={styles.card}>
        {!settings ? (
          loading ? (
            <ActivityIndicator color={colors.primary} accessibilityLabel="Cargando ajustes" />
          ) : (
            <View style={styles.group}>
              <StatusMessage tone="error" message={error ?? copy.SETTINGS_LOAD_ERROR} />
              <SecondaryButton icon="refresh" label="Reintentar" onPress={retry} />
            </View>
          )
        ) : (
          <>
            {/* 11-3 */}
            <SwitchRow
              icon="moon-outline"
              label={copy.DO_NOT_DISTURB_LABEL}
              value={settings.doNotDisturb}
              onValueChange={(doNotDisturb) => void update({ doNotDisturb })}
            />
            <Text style={styles.hint}>{copy.DO_NOT_DISTURB_HINT}</Text>

            {/* 11-4 */}
            <Text style={styles.label}>{copy.SNOOZE_LABEL}</Text>
            <SegmentedControl
              accessibilityLabel={copy.SNOOZE_LABEL}
              options={SNOOZE_SEGMENTS}
              value={String(normalizeSnooze(settings.snoozeMinutes))}
              onChange={(value) => void update({ snoozeMinutes: Number(value) })}
            />

            {/* 11-5 */}
            <SwitchRow
              icon="volume-high-outline"
              label={copy.SOUND_LABEL}
              value={settings.sound}
              onValueChange={(sound) => void update({ sound })}
            />
          </>
        )}
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
    group: {
      gap: spacing.md,
    },
    label: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
