import { minutesOfDay } from '@/shared/utils/formatClock';

import type { TriggerDraft } from './trigger.types';

/** Una rutina admite de 0 a 3 avisos. */
export const MAX_TRIGGERS = 3;
export const NETWORK_NAME_MAX_LENGTH = 24;
/** Límite del estándar 802.11 (en bytes; se aproxima con caracteres). */
export const SSID_MAX_LENGTH = 32;

export interface TriggerValidationErrors {
  days?: string;
  ssid?: string;
  networkName?: string;
  window?: string;
}

export function validateTriggerDraft(draft: TriggerDraft): TriggerValidationErrors {
  const errors: TriggerValidationErrors = {};

  if (draft.type === 'schedule') {
    if (draft.days.length === 0) errors.days = 'Elige al menos un día.';
    return errors;
  }

  const ssid = draft.ssid.trim();
  if (!ssid) errors.ssid = 'Escribe el nombre de la red Wi-Fi o detecta la actual.';
  else if (ssid.length > SSID_MAX_LENGTH) errors.ssid = `Máximo ${SSID_MAX_LENGTH} caracteres.`;

  const name = draft.networkName.trim();
  if (!name) errors.networkName = 'Ponle un nombre a la red (ej. Casa).';
  else if (name.length > NETWORK_NAME_MAX_LENGTH) errors.networkName = `Máximo ${NETWORK_NAME_MAX_LENGTH} caracteres.`;

  if (draft.window && minutesOfDay(draft.window.start) === minutesOfDay(draft.window.end)) {
    errors.window = 'La franja debe empezar y terminar a horas distintas.';
  }
  return errors;
}

export const hasTriggerErrors = (errors: TriggerValidationErrors) => Object.keys(errors).length > 0;

/** Borrador listo para guardar: textos sin espacios sobrantes. */
export function normalizeTriggerDraft(draft: TriggerDraft): TriggerDraft {
  if (draft.type === 'schedule') return { ...draft, days: [...draft.days].sort((a, b) => a - b) };
  return { ...draft, ssid: draft.ssid.trim(), networkName: draft.networkName.trim() };
}
