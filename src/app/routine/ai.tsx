import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { SuggestionChips } from '@/components/molecules/SuggestionChips';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import * as copy from '@/features/ai/ai.copy';
import { putAiDraft } from '@/features/ai/aiDraft.store';
import { useAiDraft } from '@/features/ai/useAiDraft';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const PROMPT_MAX_LENGTH = 200;

/** "Crear con IA": una frase → borrador que se abre en P04 como rutina nueva (sin guardar). */
export default function CreateWithAiScreen() {
  const styles = useThemedStyles(createStyles);
  const { isConnected } = useNetworkStatus();
  const { create, loading, error, clearError } = useAiDraft();
  const [prompt, setPrompt] = useState('');
  const [missing, setMissing] = useState(false);

  async function submit() {
    if (!prompt.trim()) {
      setMissing(true);
      return;
    }
    const seed = await create(prompt);
    if (seed) router.replace({ pathname: '/routine/new', params: { aiDraftId: putAiDraft(seed) } });
  }

  function change(text: string) {
    setPrompt(text);
    setMissing(false);
    clearError();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label={copy.PROMPT_LABEL}
          placeholder={copy.PROMPT_PLACEHOLDER}
          value={prompt}
          onChangeText={change}
          maxLength={PROMPT_MAX_LENGTH}
          showCounter
          multiline
          error={missing ? copy.PROMPT_REQUIRED : undefined}
          editable={!loading}
        />
        <Text style={styles.hint}>{copy.PROMPT_HINT}</Text>

        <SectionLabel label={copy.EXAMPLES_TITLE} />
        <SuggestionChips
          labels={copy.PROMPT_EXAMPLES}
          onPick={(index) => change(copy.PROMPT_EXAMPLES[index])}
          accessibilityLabelFor={copy.exampleLabel}
        />
      </ScrollView>

      <ScreenFooter bordered>
        {error ? <StatusMessage tone="error" message={error} /> : null}
        {isConnected ? null : <StatusMessage tone="info" message={copy.OFFLINE_HINT} />}
        {loading ? (
          <Text style={styles.hint} accessibilityLiveRegion="polite">
            {copy.CREATING_LABEL}
          </Text>
        ) : null}
        <PrimaryButton label={copy.CREATE_DRAFT_LABEL} onPress={() => void submit()} loading={loading} disabled={!isConnected} />
      </ScreenFooter>
    </KeyboardAvoidingView>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
