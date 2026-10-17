import type { VerificationOutcome, VerificationSummary } from './checklist.types';

/** Parámetros de ruta de /routine/[id]/summary (siempre strings). */
export type SummaryParams = {
  id: string;
  outcome: VerificationOutcome;
  checked: string;
  total: string;
  duration: string;
  /** JSON con las etiquetas no marcadas. */
  omitted: string;
  /** JSON con las etiquetas no marcadas que eran críticas. */
  omittedCritical: string;
};

export const toSummaryParams = (routineId: string, summary: VerificationSummary): SummaryParams => ({
  id: routineId,
  outcome: summary.outcome,
  checked: String(summary.checked),
  total: String(summary.total),
  duration: String(summary.durationSeconds),
  omitted: JSON.stringify(summary.omittedLabels),
  omittedCritical: JSON.stringify(summary.omittedCriticalLabels),
});

const OUTCOMES: readonly VerificationOutcome[] = ['completed', 'partial', 'skipped'];

const toCount = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
};

const toLabels = (value: string | undefined): string[] => {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === 'string') : [];
  } catch {
    return [];
  }
};

/** Lee los parámetros de forma tolerante (pueden venir de un deep link manipulado). */
export function fromSummaryParams(params: Partial<Record<keyof SummaryParams, string>>): VerificationSummary {
  const outcome = OUTCOMES.find((value) => value === params.outcome) ?? 'partial';
  return {
    outcome,
    checked: toCount(params.checked),
    total: toCount(params.total),
    durationSeconds: toCount(params.duration),
    omittedLabels: toLabels(params.omitted),
    omittedCriticalLabels: toLabels(params.omittedCritical),
  };
}
