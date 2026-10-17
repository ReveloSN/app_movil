import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { RoutineTriggersSection } from '@/features/triggers/RoutineTriggersSection';
import { strategyFor } from '@/features/triggers/strategies';
import { summarySentence } from '@/features/triggers/trigger.copy';
import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from '../onboarding.copy';

interface TriggerStepProps {
  routineName: string;
  formId: string;
  /** Avisos ya guardados en P06. */
  drafts: readonly TriggerDraftEntry[];
  /** Aviso sugerido por la plantilla (aún no configurado). */
  suggestion: TriggerDraftEntry | undefined;
  onConfigure(): void;
  onCreate(): void;
  creating: boolean;
  error: string | null;
}

/**
 * Paso 3: el aviso se configura en P06 (precargado con el sugerido). Sin configurar ninguno,
 * "Continuar sin aviso" crea la rutina igual.
 */
export function TriggerStep({ routineName, formId, drafts, suggestion, onConfigure, onCreate, creating, error }: TriggerStepProps) {
  const styles = useThemedStyles(createStyles);
  const configured = drafts.length > 0;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.TRIGGER_TITLE}
        </Text>
        <Text style={styles.body}>{copy.triggerBody(routineName)}</Text>

        {configured ? (
          // La misma lista de P04: editar, quitar o sumar otro (hasta 3).
          <RoutineTriggersSection formId={formId} />
        ) : suggestion ? (
          <View style={styles.suggestion}>
            <Text style={styles.suggestionText}>
              {copy.suggestedTriggerText(summarySentence(strategyFor(suggestion).describe(suggestion)))}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <ScreenFooter>
        {error ? <StatusMessage tone="error" message={error} /> : null}
        {configured ? (
          <PrimaryButton label={copy.CREATE_ROUTINE_LABEL} onPress={onCreate} loading={creating} />
        ) : (
          <>
            <PrimaryButton label={copy.CONFIGURE_TRIGGER_LABEL} onPress={onConfigure} disabled={creating} />
            <SecondaryButton label={copy.CONTINUE_WITHOUT_TRIGGER_LABEL} onPress={onCreate} disabled={creating} />
          </>
        )}
      </ScreenFooter>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
    suggestion: {
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.primaryTint,
    },
    suggestionText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
  });
