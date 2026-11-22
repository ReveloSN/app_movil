import { minutesOfDay } from '@/shared/utils/formatClock';

import copy from './trigger.copy';
import { allowedTriggerKindsFor } from './trigger.defaults';
import type { TriggerDraft } from './trigger.types';
import type { RoutineKind } from '@/shared/types/routine.types';

/** Una rutina admite de 0 a 20 avisos (lo mismo que fuerza triggers_limit en la base de datos). */
export const MAX_TRIGGERS = 20;
export const NETWORK_NAME_MAX_LENGTH = 24;
/** Límite del estándar 802.11 (en bytes; se aproxima con caracteres). */
export const SSID_MAX_LENGTH = 32;

export interface TriggerValidationErrors {
  type?: string;
  days?: string;
  ssid?: string;
  networkName?: string;
  window?: string;
}

export function validateTriggerDraft(draft: TriggerDraft, routineKind?: RoutineKind): TriggerValidationErrors {
  const errors: TriggerValidationErrors = {};

  if (!allowedTriggerKindsFor(routineKind).includes(draft.type)) {
    errors.type = copy.ARRIVAL_ONLY_WIFI_ERROR;
  }

  if (draft.type === 'schedule') {
    if (draft.days.length === 0) errors.days = copy.DAYS_REQUIRED_ERROR;
    return errors;
  }

  const ssid = draft.ssid.trim();
  if (!ssid) errors.ssid = copy.SSID_REQUIRED_ERROR;
  else if (ssid.length > SSID_MAX_LENGTH) errors.ssid = copy.maxLengthError(SSID_MAX_LENGTH);

  const name = draft.networkName.trim();
  if (!name) errors.networkName = copy.NETWORK_NAME_REQUIRED_ERROR;
  else if (name.length > NETWORK_NAME_MAX_LENGTH) errors.networkName = copy.maxLengthError(NETWORK_NAME_MAX_LENGTH);

  if (draft.window && minutesOfDay(draft.window.start) === minutesOfDay(draft.window.end)) {
    errors.window = copy.WINDOW_SAME_TIMES_ERROR;
  }
  return errors;
}

export const hasTriggerErrors = (errors: TriggerValidationErrors) => Object.keys(errors).length > 0;

/** Borrador listo para guardar: textos sin espacios sobrantes. */
export function normalizeTriggerDraft(draft: TriggerDraft): TriggerDraft {
  if (draft.type === 'schedule') return { ...draft, days: [...draft.days].sort((a, b) => a - b) };
  return { ...draft, ssid: draft.ssid.trim(), networkName: draft.networkName.trim() };
}
