import type { ChipTone } from '@/components/atoms/Chip';
import type { IoniconName } from '@/shared/utils/ioniconName';

import copy from './history.copy';

export interface ResultBadge {
  tone: ChipTone;
  icon: IoniconName;
  label: string;
}

type BadgeStyle = Omit<ResultBadge, 'label'>;

// records.result admite 'completed' | 'partial' | 'skipped' | 'no_response'. Tono e ícono son datos; la etiqueta, texto.
const BADGES: Record<string, BadgeStyle> = {
  completed: { tone: 'active', icon: 'checkmark-circle' },
  partial: { tone: 'critical', icon: 'alert-circle' },
  skipped: { tone: 'neutral', icon: 'play-skip-forward-circle' },
  no_response: { tone: 'neutral', icon: 'time' },
};

const UNKNOWN_BADGE: BadgeStyle = { tone: 'neutral', icon: 'help-circle' };

/** Opciones del filtro por resultado (09-3), en el orden del modelo de contenido. Se calcula al llamarla (idioma activo). */
export const resultFilters = () => Object.keys(BADGES).map((value) => ({ value, label: copy.RESULT_LABELS[value] }));

/** Chip (tono + ícono + texto) que representa el resultado de una verificación. */
export function describeResult(result: string): ResultBadge {
  const badge = BADGES[result];
  if (!badge) return { ...UNKNOWN_BADGE, label: copy.UNKNOWN_RESULT_LABEL };
  return { ...badge, label: copy.RESULT_LABELS[result] };
}
