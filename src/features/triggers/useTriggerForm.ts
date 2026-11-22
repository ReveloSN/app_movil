import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import permissionCopy from '@/features/permissions/permission.copy';
import { firstMissingPermission } from '@/features/permissions/permission.service';
import type { PermissionKind } from '@/features/permissions/permission.types';
import type { ClockTime, Weekday } from '@/shared/types/clock.types';
import type { RoutineKind } from '@/shared/types/routine.types';
import { minutesOfDay } from '@/shared/utils/formatClock';
import { stableStringify } from '@/shared/utils/stableStringify';

import { strategyFor } from './strategies';
import copy from './trigger.copy';
import { allowedTriggerKindsFor, defaultTriggerKindFor, defaultWindowFor } from './trigger.defaults';
import type { ScheduleTriggerDraft, TimeWindow, TriggerDraft, TriggerKind } from './trigger.types';
import { hasTriggerErrors, normalizeTriggerDraft, validateTriggerDraft, type TriggerValidationErrors } from './trigger.validation';

const DEFAULT_TIME: ClockTime = { hour: 7, minute: 0 };
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
const NO_ERRORS: TriggerValidationErrors = {};

interface UseTriggerFormOptions {
  /** Aviso a editar; sin él, uno nuevo. */
  initial?: TriggerDraft;
  /** Tipo de la rutina a la que pertenece: una de llegada propone «Llegar al Wi-Fi» y una franja de tarde. */
  routineKind?: RoutineKind;
  /** Recibe los avisos validados y con los permisos concedidos (varios si se añadieron más horas). */
  onCommit(drafts: TriggerDraft[]): void;
  /** Cuántas horas puede tener esta pantalla: lo que queda de cupo en la rutina. Sin límite = 1 (editar). */
  maxTimes?: number;
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

/** Un horario por hora distinta (las repetidas se guardan una sola vez), todos con los mismos días. */
const expandTimes = (draft: TriggerDraft, extraTimes: readonly ClockTime[]): TriggerDraft[] => {
  if (draft.type !== 'schedule') return [draft];
  const seen = new Set<number>();
  return [draft.time, ...extraTimes]
    .filter((time) => {
      const minutes = minutesOfDay(time);
      if (seen.has(minutes)) return false;
      seen.add(minutes);
      return true;
    })
    .map((time) => ({ ...draft, time }));
};

const requiredPermissions = (draft: TriggerDraft): PermissionKind[] =>
  strategyFor(draft).needsLocation ? ['notifications', 'location'] : ['notifications'];

/**
 * Estado de P06. Cada tipo conserva lo suyo: cambiar de "Horario" a "Wi-Fi" y volver no borra nada.
 * Si al guardar falta un permiso, se va a P02 y al volver (`resume`) se guarda solo.
 */
export function useTriggerForm({
  initial,
  routineKind,
  onCommit,
  maxTimes = 1,
  onNeedPermission,
  findMissingPermission = firstMissingPermission,
}: UseTriggerFormOptions) {
  const allowedKinds = useMemo(() => allowedTriggerKindsFor(routineKind), [routineKind]);
  // Un aviso heredado de un tipo que la rutina ya no admite (p. ej. un horario en una de llegada) se
  // reemplaza por el tipo permitido: la red y la franja arrancan con los valores por defecto.
  const initialAllowed = initial && allowedKinds.includes(initial.type) ? initial : undefined;
  const [kind, setKindState] = useState<TriggerKind>(initialAllowed?.type ?? defaultTriggerKindFor(routineKind));
  const setKind = useCallback(
    (next: TriggerKind) => setKindState((current) => (allowedKinds.includes(next) ? next : current)),
    [allowedKinds],
  );
  const [time, setTime] = useState<ClockTime>(initialAllowed?.type === 'schedule' ? initialAllowed.time : DEFAULT_TIME);
  const [days, setDays] = useState<Weekday[]>(initialAllowed?.type === 'schedule' ? initialAllowed.days : WEEKDAYS);
  // Horas además de la primera (solo al crear): cada una será su propio aviso con los mismos días.
  const [extraTimes, setExtraTimes] = useState<ClockTime[]>([]);
  const wifi = initialAllowed?.type === 'schedule' ? undefined : initialAllowed;
  const [ssid, setSsid] = useState(wifi?.ssid ?? '');
  const [networkName, setNetworkName] = useState(wifi?.networkName ?? copy.DEFAULT_NETWORK_NAME);
  const [windowEnabled, setWindowEnabled] = useState(Boolean(wifi?.window));
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(wifi?.window ?? defaultWindowFor(routineKind));
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
  const dirty = useMemo(
    () => fingerprint(draft) !== initialFingerprint || extraTimes.length > 0,
    [draft, initialFingerprint, extraTimes],
  );
  const canAddTime = kind === 'schedule' && extraTimes.length + 1 < maxTimes;
  const addTime = useCallback(() => {
    // La nueva hora arranca una hora después de la última, para que no quede repetida.
    setExtraTimes((current) => {
      const last = current[current.length - 1] ?? time;
      return [...current, { hour: (last.hour + 1) % 24, minute: last.minute }];
    });
  }, [time]);
  const setExtraTime = useCallback(
    (index: number, next: ClockTime) => setExtraTimes((current) => current.map((value, i) => (i === index ? next : value))),
    [],
  );
  const removeExtraTime = useCallback((index: number) => setExtraTimes((current) => current.filter((_, i) => i !== index)), []);
  const count = kind === 'schedule' ? expandTimes(draft, extraTimes).length : 1;

  const errors = useMemo(() => (attempted ? validateTriggerDraft(draft, routineKind) : NO_ERRORS), [attempted, draft, routineKind]);

  const summary = useMemo(() => {
    // Mientras el nombre está vacío, la frase no queda a medias.
    if (draft.type === 'schedule' && extraTimes.length > 0) {
      const times = expandTimes(draft, extraTimes).map((entry) => (entry as ScheduleTriggerDraft).time);
      return copy.summarySentence(copy.scheduleTimesDescription(draft.days, times));
    }
    const preview = draft.type === 'schedule' || draft.networkName.trim() ? draft : { ...draft, networkName: copy.NETWORK_NAME_PLACEHOLDER };
    return copy.summarySentence(strategyFor(preview).describe(normalizeTriggerDraft(preview)));
  }, [draft, extraTimes]);

  // Lo último de cada render, para que `save` y `resume` sean estables: la pantalla llama a
  // `resume` solo al recuperar el foco, y no debe re-ejecutarse en cada cambio del formulario.
  const latest = useRef({ draft, extraTimes, routineKind, onCommit, onNeedPermission, findMissingPermission });
  useEffect(() => {
    latest.current = { draft, extraTimes, routineKind, onCommit, onNeedPermission, findMissingPermission };
  });

  const continueSave = useCallback(async (previouslyMissing: PermissionKind | null) => {
    const { draft: current, extraTimes: extra, onCommit: commit, onNeedPermission: needPermission, findMissingPermission: findMissing } =
      latest.current;
    setSaving(true);
    try {
      const missing = await findMissing(requiredPermissions(current));
      if (!missing) {
        commit(expandTimes(normalizeTriggerDraft(current), extra));
      } else if (missing === previouslyMissing) {
        // Volvió de P02 sin concederlo: se queda aquí con lo llenado y el motivo a la vista.
        setPermissionError(permissionCopy.PERMISSION_COPY[missing].reason);
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
    if (hasTriggerErrors(validateTriggerDraft(latest.current.draft, latest.current.routineKind))) return;
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
    allowedKinds,
    time,
    setTime,
    extraTimes,
    canAddTime,
    addTime,
    setExtraTime,
    removeExtraTime,
    count,
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
