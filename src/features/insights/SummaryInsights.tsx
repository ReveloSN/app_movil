import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextButton } from '@/components/atoms/TextButton';
import { InsightCard } from '@/components/molecules/InsightCard';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { ForgotItemSheet } from './ForgotItemSheet';
import * as copy from './insights.copy';
import { useForgotItem } from './useForgotItem';
import { useRoutineInsight } from './useRoutineInsight';

interface SummaryInsightsProps {
  routineId: string;
  recordId: string | null;
}

/** En P08: la sugerencia de un olvido que se repite (si hay) y la acción terciaria "Olvidé algo". */
export function SummaryInsights({ routineId, recordId }: SummaryInsightsProps) {
  const styles = useThemedStyles(createStyles);
  const insight = useRoutineInsight(routineId);
  const forgot = useForgotItem(routineId, recordId);
  const [asking, setAsking] = useState(false);

  async function save(label: string) {
    if (await forgot.add(label)) setAsking(false);
  }

  return (
    <View style={styles.block}>
      {insight.message ? (
        <InsightCard
          icon="bulb-outline"
          message={insight.message}
          acceptLabel={copy.INSIGHT_ACCEPT}
          dismissLabel={copy.INSIGHT_DISMISS}
          onAccept={() => void insight.accept()}
          onDismiss={() => void insight.dismiss()}
          busy={insight.busy}
          error={insight.error}
        />
      ) : null}
      <TextButton label={copy.FORGOT_LABEL} onPress={() => setAsking(true)} />
      {asking ? (
        <ForgotItemSheet
          saving={forgot.saving}
          error={forgot.error}
          onSave={(label) => void save(label)}
          onClose={() => {
            forgot.clearError();
            setAsking(false);
          }}
        />
      ) : null}
    </View>
  );
}

const createStyles = ({ spacing }: AppTheme) =>
  StyleSheet.create({
    block: {
      gap: spacing.sm,
    },
  });
