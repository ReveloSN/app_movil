import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { ListActionRow } from '@/components/molecules/ListActionRow';
import { TriggerRow } from '@/components/molecules/TriggerRow';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { UNDO_LABEL } from '@/features/feedback/feedback.copy';
import { useToast } from '@/features/feedback/toast.context';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { strategyFor } from './strategies';
import { ADD_TRIGGER_LABEL, MAX_TRIGGERS_REACHED, summarySentence, TRIGGER_REMOVED, TRIGGERS_SECTION_TITLE } from './trigger.copy';
import type { TriggerDraftEntry } from './trigger.types';
import { MAX_TRIGGERS } from './trigger.validation';
import { useTriggerDrafts } from './TriggerDraftsProvider';

interface RoutineTriggersSectionProps {
  /** Formulario de P04 al que pertenecen los avisos. */
  formId: string;
  error?: string;
}

const openTrigger = (formId: string, key?: string) =>
  router.push({ pathname: '/routine/trigger', params: key ? { formId, key } : { formId } });

/** Bloque de avisos de P04 (04-5): lista agrupada (0–3), cada uno editable en P06. */
export function RoutineTriggersSection({ formId, error }: RoutineTriggersSectionProps) {
  const styles = useThemedStyles(createStyles);
  const { drafts, remove, upsert } = useTriggerDrafts(formId);
  const toast = useToast();
  const full = drafts.length >= MAX_TRIGGERS;

  // Quitar no pide confirmación: se hace al instante y el aviso breve permite deshacerlo.
  function removeWithUndo(draft: TriggerDraftEntry) {
    remove(draft.key);
    toast.show({ message: TRIGGER_REMOVED, tone: 'info', action: { label: UNDO_LABEL, onPress: () => upsert(draft) } });
  }

  return (
    <View style={styles.section}>
      <SectionLabel
        label={TRIGGERS_SECTION_TITLE}
        trailing={`${drafts.length}/${MAX_TRIGGERS}`}
        accessibilityLabel={`${TRIGGERS_SECTION_TITLE}, ${drafts.length} de ${MAX_TRIGGERS}`}
      />
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <View style={styles.card}>
        {drafts.map((draft) => {
          const strategy = strategyFor(draft);
          return (
            <TriggerRow
              key={draft.key}
              icon={strategy.icon}
              summary={summarySentence(strategy.describe(draft))}
              typeLabel={strategy.label}
              onEdit={() => openTrigger(formId, draft.key)}
              onRemove={() => removeWithUndo(draft)}
            />
          );
        })}
        <ListActionRow
          label={ADD_TRIGGER_LABEL}
          onPress={() => openTrigger(formId)}
          disabled={full}
          disabledHint={MAX_TRIGGERS_REACHED}
        />
      </View>
      {full ? <Text style={styles.hint}>{MAX_TRIGGERS_REACHED}</Text> : null}
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
