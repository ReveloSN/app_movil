import type { ChipTone } from '@/components/atoms/Chip';
import type { IoniconName } from '@/shared/utils/ioniconName';

export interface ResultBadge {
  tone: ChipTone;
  icon: IoniconName;
  label: string;
}

// records.result admite 'completed' | 'partial' | 'skipped' | 'no_response'.
const BADGES: Record<string, ResultBadge> = {
  completed: { tone: 'active', icon: 'checkmark-circle', label: 'Completa' },
  partial: { tone: 'critical', icon: 'alert-circle', label: 'Parcial' },
  skipped: { tone: 'neutral', icon: 'play-skip-forward-circle', label: 'Omitida' },
  no_response: { tone: 'neutral', icon: 'time', label: 'Sin respuesta' },
};

const UNKNOWN_BADGE: ResultBadge = { tone: 'neutral', icon: 'help-circle', label: 'Sin resultado' };

/** Chip (tono + ícono + texto) que representa el resultado de una verificación. */
export function describeResult(result: string): ResultBadge {
  return BADGES[result] ?? UNKNOWN_BADGE;
}
