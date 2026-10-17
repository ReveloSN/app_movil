import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { SuggestionChips } from '@/components/molecules/SuggestionChips';
import { AiConsentSheet } from '@/features/ai/AiConsentSheet';
import * as aiCopy from '@/features/ai/ai.copy';
import { useAiAccess } from '@/features/ai/useAiAccess';
import { useAiSuggestions } from '@/features/ai/useAiSuggestions';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { pickSuggestions } from './item-suggestions';
import * as copy from './routine.copy';
import type { ItemDraft } from './routines.types';

interface ItemSuggestionsProps {
  name: string;
  labels: readonly string[];
  /** Hay espacio para otro ítem (máx. 12). Sin espacio, el bloque no aparece. */
  canAdd: boolean;
  onPick(item: ItemDraft): void;
}

/**
 * 04-4: sugerencias estáticas (también sin conexión) y, si la IA está activa, "Sugerir con IA" con
 * hasta 4 ideas para esta rutina. Las de IA reemplazan a las estáticas mientras la rutina no cambie.
 */
export function ItemSuggestions({ name, labels, canAdd, onPick }: ItemSuggestionsProps) {
  const styles = useThemedStyles(createStyles);
  const ai = useAiAccess();
  const items = useMemo(() => labels.filter((label) => label.trim()), [labels]);
  const aiSuggestions = useAiSuggestions(name, items);
  const staticSuggestions = pickSuggestions(items);

  if (!canAdd) return null;
  const fromAi = aiSuggestions.suggestions;
  const shown: ItemDraft[] = fromAi ? fromAi.map((label) => ({ label, kind: 'carry', critical: false })) : staticSuggestions;
  const canAsk = Boolean(name.trim() || items.length > 0);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <SectionLabel label={copy.SUGGESTIONS_TITLE} />
        {fromAi ? <Chip tone="neutral" icon="sparkles-outline" label={aiCopy.AI_BADGE_LABEL} /> : null}
      </View>
      {shown.length > 0 ? (
        <SuggestionChips
          labels={shown.map((item) => item.label)}
          onPick={(index) => onPick(shown[index])}
          accessibilityLabelFor={copy.addSuggestionLabel}
        />
      ) : fromAi ? (
        <Text style={styles.hint}>{aiCopy.NO_AI_SUGGESTIONS}</Text>
      ) : null}

      {ai.visible ? (
        <>
          {aiSuggestions.error ? <StatusMessage tone="error" message={aiSuggestions.error} /> : null}
          {aiSuggestions.loading ? (
            <Text style={styles.hint} accessibilityLiveRegion="polite">
              {aiCopy.SUGGESTING_LABEL}
            </Text>
          ) : null}
          <TextButton
            label={aiCopy.SUGGEST_WITH_AI_LABEL}
            onPress={() => ai.whenConsented(() => void aiSuggestions.suggest())}
            disabled={!ai.online || !canAsk || aiSuggestions.loading}
          />
          {ai.online ? null : <Text style={styles.hint}>{aiCopy.OFFLINE_HINT}</Text>}
          <AiConsentSheet {...ai.consent} />
        </>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    block: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
