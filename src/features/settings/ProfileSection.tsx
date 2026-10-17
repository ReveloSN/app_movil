import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName } from './display-name';
import * as copy from './settings.copy';
import { useSettings } from './useSettings';

/** "Nombre" (Ajustes, opcional): se guarda al terminar de escribir, en la copia local y luego se sincroniza. */
export function ProfileSection() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { settings, loading, saveError, update } = useSettings();
  // Lo que se está escribiendo; null = mostrar lo guardado.
  const [draft, setDraft] = useState<string | null>(null);
  const saved = settings?.displayName ?? '';

  function commit() {
    if (draft === null) return;
    const next = normalizeDisplayName(draft);
    setDraft(null);
    if (next !== (settings?.displayName ?? null)) void update({ displayName: next });
  }

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.PROFILE_SECTION_TITLE} />
      {saveError ? <StatusMessage tone="error" message={saveError} /> : null}
      <View style={styles.card}>
        {!settings && loading ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Cargando ajustes" />
        ) : (
          <>
            <TextField
              label={copy.DISPLAY_NAME_LABEL}
              placeholder={copy.DISPLAY_NAME_PLACEHOLDER}
              value={draft ?? saved}
              onChangeText={setDraft}
              onBlur={commit}
              onSubmitEditing={commit}
              returnKeyType="done"
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              showCounter
              autoCapitalize="words"
              editable={settings !== null}
            />
            <Text style={styles.hint}>{copy.DISPLAY_NAME_HINT}</Text>
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
