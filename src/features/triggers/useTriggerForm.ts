import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSION_COPY } from '@/features/permissions/permission.copy';
import { firstMissingPermission } from '@/features/permissions/permission.service';
import type { PermissionKind } from '@/features/permissions/permission.types';
import type { ClockTime, Weekday } from '@/shared/types/clock.types';
import { stableStringify } from '@/shared/utils/stableStringify';

import { strategyFor } from './strategies';
import { summarySentence } from './trigger.copy';
import type { TimeWindow, TriggerDraft, TriggerKind } from './trigger.types';
import { hasTriggerErrors, normalizeTriggerDraft, validateTriggerDraft, type TriggerValidationErrors } from './trigger.validation';

const DEFAULT_TIME: ClockTime = { hour: 7, minute: 0 };
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
const DEFAULT_WINDOW: TimeWindow = { start: { hour: 6, minute: 0 }, end: { hour: 9, minute: 0 } };
const DEFAULT_NETWORK_NAME = 'Casa';
const NO_ERRORS: TriggerValidationErrors = {};

interface UseTriggerFormOptions {
  /** Aviso a editar; sin él, uno nuevo. */
  initial?: TriggerDraft;
  /** Recibe el aviso validado y con los permisos concedidos. */
  onCommit(draft: TriggerDraft): void;
  /** Lleva a P02 por el permiso que falta. Al volver, la pantalla llama a `resume`. */
  onNeedPermission(kind: PermissionKind): void;
  /** Inyectable para tests. */
  findMissingPermission?: (kinds: readonly PermissionKind[]) => Promise<PermissionKind | null>;
}

interface TriggerFormFields {
  kind: TriggerKind;
  time: ClockTime;
  days: Weekday[];
  ssid: string;
  networkName: string;
  windowEnabled: boolean;
  timeWindow: TimeWindow;
}

/** El aviso que representa lo que hay en pantalla (solo los campos del tipo elegido). */
const toDraft = ({ kind, time, days, ssid, networkName, windowEnabled, timeWindow }: TriggerFormFields): TriggerDraft =>
  kind === 'schedule'
    ? { type: kind, time, days }
    : { type: kind, ssid, networkName, window: windowEnabled ? timeWindow : null };

/** Huella para saber si cambió algo (DC-03). Los días se comparan sin importar el orden en que se tocaron. */
const fingerprint = (draft: TriggerDraft) =>
  stableStringify(draft.type === 'schedule' ? { ...draft, days: [...draft.days].sort((a, b) => a - b) } : draft);

const requiredPermissions = (draft: TriggerDraft): PermissionKind[] =>
  strategyFor(draft).needsLocation ? ['notifications', 'location'] : ['notifications'];

/**
 * Estado de P06. Cada tipo conserva lo suyo: cambiar de "Horario" a "Wi-Fi" y volver no borra nada.
 * Si al guardar falta un permiso, se va a P02 y al volver (`resume`) se guarda solo.
 */
export function useTriggerForm({
  initial,
  onCommit,
  onNeedPermission,
  findMissingPermission = firstMissingPermission,
}: UseTriggerFormOptions) {
  const [kind, setKind] = useState<TriggerKind>(initial?.type ?? 'schedule');
  const [time, setTime] = useState<ClockTime>(initial?.type === 'schedule' ? initial.time : DEFAULT_TIME);
  const [days, setDays] = useState<Weekday[]>(initial?.type === 'schedule' ? initial.days : WEEKDAYS);
  const wifi = initial?.type === 'schedule' ? undefined : initial;
  const [ssid, setSsid] = useState(wifi?.ssid ?? '');
  const [networkName, setNetworkName] = useState(wifi?.networkName ?? DEFAULT_NETWORK_NAME);
  const [windowEnabled, setWindowEnabled] = useState(Boolean(wifi?.window));
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(wifi?.window ?? DEFAULT_WINDOW);
  // Lo que había al abrir P06: base para saber si hay cambios sin guardar.
  const [initialFingerprint] = useState(() =>
    fingerprint(toDraft({ kind, time, days, ssid, networkName, windowEnabled, timeWindow })),
  );

  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  /** Permiso por el que se fue a P02 con un guardado a medias. */
  const pendingPermission = useRef<PermissionKind | null>(null);

  const draft = useMemo<TriggerDraft>(
    () => toDraft({ kind, time, days, ssid, networkName, windowEnabled, timeWindow }),
    [kind, time, days, ssid, networkName, windowEnabled, timeWindow],
  );
  const dirty = useMemo(() => fingerprint(draft) !== initialFingerprint, [draft, initialFingerprint]);

  const errors = useMemo(() => (attempted ? validateTriggerDraft(draft) : NO_ERRORS), [attempted, draft]);

  const summary = useMemo(() => {
    // Mientras el nombre está vacío, la frase no queda a medias.
    const preview = draft.type === 'schedule' || draft.networkName.trim() ? draft : { ...draft, networkName: 'tu red' };
    return summarySentence(strategyFor(preview).describe(normalizeTriggerDraft(preview)));
  }, [draft]);

  // Lo último de cada render, para que `save` y `resume` sean estables: la pantalla llama a
  // `resume` solo al recuperar el foco, y no debe re-ejecutarse en cada cambio del formulario.
  const latest = useRef({ draft, onCommit, onNeedPermission, findMissingPermission });
  useEffect(() => {
    latest.current = { draft, onCommit, onNeedPermission, findMissingPermission };
  });

  const continueSave = useCallback(async (previouslyMissing: PermissionKind | null) => {
    const { draft: current, onCommit: commit, onNeedPermission: needPermission, findMissingPermission: findMissing } =
      latest.current;
    setSaving(true);
    try {
      const missing = await findMissing(requiredPermissions(current));
      if (!missing) {
        commit(normalizeTriggerDraft(current));
      } else if (missing === previouslyMissing) {
        // Volvió de P02 sin concederlo: se queda aquí con lo llenado y el motivo a la vista.
        setPermissionError(PERMISSION_COPY[missing].reason);
      } else {
        pendingPermission.current = missing;
        needPermission(missing);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const save = useCallback(async () => {
    setAttempted(true);
    setPermissionError(null);
    if (hasTriggerErrors(validateTriggerDraft(latest.current.draft))) return;
    await continueSave(null);
  }, [continueSave]);

  /** Llamar al recuperar el foco: retoma un guardado que esperaba un permiso (P02). */
  const resume = useCallback(async () => {
    const pending = pendingPermission.current;
    if (!pending) return;
    pendingPermission.current = null;
    await continueSave(pending);
  }, [continueSave]);

  return {
    kind,
    setKind,
    time,
    setTime,
    days,
    setDays,
    ssid,
    setSsid,
    networkName,
    setNetworkName,
    windowEnabled,
    setWindowEnabled,
    timeWindow,
    setTimeWindow,
    errors,
    summary,
    saving,
    permissionError,
    save,
    resume,
    dirty,
  };
}
