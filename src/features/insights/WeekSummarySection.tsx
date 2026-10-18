import { WeekSummaryCard, type WeekSummaryCardState } from '@/components/molecules/WeekSummaryCard';
import { AiConsentSheet } from '@/features/ai/AiConsentSheet';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import * as copy from './insights.copy';
import { useWeeklySummary } from './useWeeklySummary';

/** "Tu semana" en el Historial: resumen guardado por semana; generarlo lo decide la persona. */
export function WeekSummarySection({ records, now }: { records: readonly VerificationRecord[]; now: Date }) {
  const week = useWeeklySummary(records, now);
  const counts = copy.weekCounts(week.stats.completed, week.stats.partial, week.stats.skipped);

  const state: WeekSummaryCardState = week.loading
    ? { kind: 'loading' }
    : week.generating
      ? { kind: 'generating', label: copy.WEEK_LOADING }
      : week.summary
        ? {
            kind: 'summary',
            counts,
            resumen: week.summary.resumen,
            recomendacion: week.summary.recomendacion,
            sourceLabel: week.summary.source === 'ai' ? copy.WEEK_SOURCE_AI : copy.WEEK_SOURCE_LOCAL,
            ai: week.summary.source === 'ai',
          }
        : week.empty
          ? { kind: 'empty', message: copy.WEEK_EMPTY }
          : { kind: 'ready', counts, generateLabel: copy.WEEK_GENERATE, onGenerate: week.generate };

  return (
    <>
      <WeekSummaryCard title={copy.WEEK_TITLE} state={state} notice={week.notice} />
      <AiConsentSheet {...week.consent} />
    </>
  );
}
