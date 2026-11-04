import { deleteRoutineCascade } from '@/features/routines/routine-delete.service';
import { DEFAULT_ROUTINE_KIND } from '@/shared/types/routine.types';

import type { LocalTableName, OutboxFailure, OutboxOp, OutboxOpOf } from '../local/local-document.types';
import type { LocalStore } from '../local/local.store';
import { classifyOutbox } from '../local/outbox.dependencies';
import type { RemoteForgotEventRepository } from '../repositories/forgot-event.repository';
import type { RemoteHomeNetworkRepository } from '../repositories/home-network.repository';
import type { RemoteItemRepository } from '../repositories/item.repository';
import { isNetworkError, RepositoryError, type UpdateOutcome } from '../repositories/repository.types';
import type { RemoteRoutineRepository } from '../repositories/routine.repository';
import type { RemoteSettingsRepository } from '../repositories/settings.repository';
import type { RemoteTriggerRepository } from '../repositories/trigger.repository';
import type { VerificationRecordRepository } from '../repositories/verification-record.repository';
import { adoptRemoteNetwork } from './sync.remap';
import { schemaGapOf, schemaGapOfError } from './sync.schema';

/** Lo que necesita la sincronización del servidor (los repositorios de Supabase). */
export interface RemoteDeps {
  routines: RemoteRoutineRepository;
  items: RemoteItemRepository;
  triggers: RemoteTriggerRepository;
  homeNetworks: RemoteHomeNetworkRepository;
  settings: RemoteSettingsRepository;
  records: Pick<VerificationRecordRepository, 'create' | 'deleteByRoutine' | 'getAll'>;
  forgotEvents: RemoteForgotEventRepository;
}

export interface PushReport {
  sent: number;
  /** Cambios locales que perdieron contra uno más reciente del servidor (o la fila ya no existía). */
  stale: OutboxOp[];
  /** Rechazados en esta pasada: quedan en la cola, marcados y visibles. */
  failed: OutboxOp[];
  /**
   * El servidor todavía no tiene la migración que necesitan (ej. la tabla de olvidos): quedan en la
   * cola sin marcarse como fallidos y se reintentan en la próxima sincronización.
   */
  deferred: OutboxOp[];
  /** Se cortó por falta de red: lo que falta se intenta en la próxima. */
  offline: boolean;
}

type Outcome =
  | { type: 'done' }
  | { type: 'stale' }
  | { type: 'remap'; to: string }
  | { type: 'failed'; failure: OutboxFailure }
  | { type: 'deferred' }
  /**
   * La rutina se subió sin su tipo (el servidor aún no tiene la columna kind). `sent`: si llegó el
   * resto del cambio. El tipo queda pendiente en la cola (ver parkKind).
   */
  | { type: 'kindPending'; id: string; kind: unknown; sent: boolean }
  | { type: 'offline' };

const DONE: Outcome = { type: 'done' };
const STALE: Outcome = { type: 'stale' };

/** Un envío que quedó a medias (la app se cerró) se libera pasado esto y se vuelve a intentar. */
const STALE_SENDING_MS = 2 * 60 * 1000;

interface RowRepository {
  create(input: Record<string, unknown>): Promise<unknown>;
  updateIfOlder(id: string, changes: Record<string, unknown>, at: string): Promise<UpdateOutcome>;
  delete(id: string): Promise<void>;
}

const repositoryFor = (remote: RemoteDeps, table: LocalTableName) => remote[table] as unknown as RowRepository;

const isConflict = (cause: unknown) => cause instanceof RepositoryError && cause.kind === 'conflict';

/** La red ya existía con el mismo SSID: se adopta la del servidor. Si es la misma fila, ya estaba subida. */
async function resolveNetworkConflict(op: OutboxOpOf<'insert'>, remote: RemoteDeps, cause: unknown): Promise<Outcome> {
  const networks = await remote.homeNetworks.getAll();
  if (networks.some((network) => network.id === op.id)) return DONE;
  const twin = networks.find((network) => network.ssid === op.values.ssid);
  if (!twin) throw cause;
  return { type: 'remap', to: twin.id };
}

async function insertRow(op: OutboxOpOf<'insert'>, values: Record<string, unknown>, remote: RemoteDeps): Promise<Outcome> {
  try {
    await repositoryFor(remote, op.table).create(values);
    return DONE;
  } catch (cause) {
    if (!isConflict(cause)) throw cause;
    if (op.table === 'homeNetworks') return resolveNetworkConflict(op, remote, cause);
    if (op.table === 'settings') {
      // Otra instalación ya creó la fila del usuario: el insert se aplica como update ("gana el más reciente").
      const { id: _id, updatedAt: _updatedAt, ...changes } = op.values;
      return (await remote.settings.updateIfOlder(op.id, changes, op.at)) === 'applied' ? DONE : STALE;
    }
    return DONE; // Mismo id: un intento anterior ya llegó.
  }
}

/** El servidor rechazó el cambio de una rutina porque todavía no tiene la columna kind. */
const lacksKindColumn = (table: LocalTableName, values: Record<string, unknown>, cause: unknown) =>
  table === 'routines' && 'kind' in values && schemaGapOfError(cause) === 'routineKind';

const withoutKind = ({ kind: _kind, ...rest }: Record<string, unknown>) => rest;

/**
 * Servidor sin la columna kind: la rutina se crea igual, sin su tipo (la base la deja de salida), para
 * que sus ítems, avisos e historial no queden bloqueados. Si era de llegada, el tipo queda pendiente.
 */
async function sendInsert(op: OutboxOpOf<'insert'>, remote: RemoteDeps): Promise<Outcome> {
  try {
    return await insertRow(op, op.values, remote);
  } catch (cause) {
    if (!lacksKindColumn(op.table, op.values, cause)) throw cause;
  }
  const outcome = await insertRow(op, withoutKind(op.values), remote);
  const { kind } = op.values;
  return outcome.type !== 'done' || kind === DEFAULT_ROUTINE_KIND ? outcome : { type: 'kindPending', id: op.id, kind, sent: true };
}

/** Igual que el insert: sin la columna kind se sube el resto del cambio y el tipo queda pendiente. */
async function sendUpdate(op: OutboxOpOf<'update'>, remote: RemoteDeps): Promise<Outcome> {
  const apply = async (changes: Record<string, unknown>) =>
    (await repositoryFor(remote, op.table).updateIfOlder(op.id, changes, op.at)) === 'applied' ? DONE : STALE;
  try {
    return await apply(op.changes);
  } catch (cause) {
    if (!lacksKindColumn(op.table, op.changes, cause)) throw cause;
  }
  const rest = withoutKind(op.changes);
  const sent = Object.keys(rest).length > 0;
  // Si el resto perdió contra un cambio más reciente, el tipo (de la misma hora) también pierde.
  if (sent && (await apply(rest)).type === 'stale') return STALE;
  return { type: 'kindPending', id: op.id, kind: op.changes.kind, sent };
}

const FOREIGN_KEY_VIOLATION = '23503';

/**
 * Insertar un olvido es idempotente (un duplicado no falla). Si la verificación a la que apunta no
 * existe en el servidor (ej. se descartó su subida), el olvido se guarda igual, sin ese enlace.
 */
async function sendForgot(op: OutboxOpOf<'insertForgot'>, remote: RemoteDeps): Promise<Outcome> {
  try {
    await remote.forgotEvents.create(op.event);
  } catch (cause) {
    if (isConflict(cause)) return DONE;
    const missingRecord = cause instanceof RepositoryError && cause.code === FOREIGN_KEY_VIOLATION && op.event.recordId !== null;
    if (!missingRecord) throw cause;
    await remote.forgotEvents.create({ ...op.event, recordId: null });
  }
  return DONE;
}

async function send(op: OutboxOp, remote: RemoteDeps): Promise<Outcome> {
  switch (op.kind) {
    case 'insert':
      return sendInsert(op, remote);
    case 'update':
      return sendUpdate(op, remote);
    case 'delete':
      await repositoryFor(remote, op.table).delete(op.id);
      return DONE;
    case 'deleteRoutine':
      await deleteRoutineCascade(remote, op.id);
      return DONE;
    case 'insertRecord':
      try {
        await remote.records.create(op.record);
      } catch (cause) {
        if (!isConflict(cause)) throw cause;
      }
      return DONE;
    case 'insertForgot':
      return sendForgot(op, remote);
  }
}

function toOutcome(cause: unknown): Outcome {
  if (isNetworkError(cause)) return { type: 'offline' };
  if (schemaGapOfError(cause)) return { type: 'deferred' };
  const code = cause instanceof RepositoryError ? (cause.code ?? null) : null;
  return { type: 'failed', failure: { code, message: cause instanceof Error ? cause.message : String(cause) } };
}

const withoutSending = ({ sendingSince: _sendingSince, ...op }: OutboxOp) => op as OutboxOp;

const withoutFailure = ({ failed: _failed, ...op }: OutboxOp) => op as OutboxOp;

/**
 * Antes de cada pasada: libera los envíos que quedaron a medias y quita la marca de fallo a lo que se
 * rechazó solo porque el servidor no tenía la migración (versiones anteriores lo marcaban fallido).
 */
const prepareOutbox = (store: LocalStore, now: Date) =>
  store.update((doc) => {
    const stale = (op: OutboxOp) => op.sendingSince !== undefined && now.getTime() - Date.parse(op.sendingSince) > STALE_SENDING_MS;
    const schemaFailure = (op: OutboxOp) => op.failed !== undefined && schemaGapOf(op.failed) !== null;
    if (!doc.outbox.some((op) => stale(op) || schemaFailure(op))) return { doc, result: undefined };
    const outbox = doc.outbox.map((op) => {
      const released = stale(op) ? withoutSending(op) : op;
      return schemaFailure(released) ? withoutFailure(released) : released;
    });
    return { doc: { ...doc, outbox }, result: undefined };
  }, 'sync');

/** Toma la primera operación lista y la marca como "enviándose" (así nada la mezcla ni la quita). */
const claimNext = (store: LocalStore, attempted: ReadonlySet<string>, now: string) =>
  store.update((doc) => {
    const next = classifyOutbox(doc.outbox).find(
      ({ op, status }) => status === 'ready' && op.sendingSince === undefined && !attempted.has(op.opId),
    )?.op;
    if (!next) return { doc, result: null };
    const claimed = { ...next, sendingSince: now, attempts: next.attempts + 1 };
    return { doc: { ...doc, outbox: doc.outbox.map((op) => (op.opId === next.opId ? claimed : op)) }, result: claimed };
  }, 'sync');

const inFlight = (op: OutboxOp) => op.sendingSince !== undefined;

/**
 * Deja pendiente el tipo de una rutina que el servidor (sin la columna kind) no pudo recibir. Va como un
 * update de solo kind, con la hora del cambio original, en el lugar de `sent`; si después ya hay otro
 * update de la misma rutina en la cola, el tipo se suma a ese (sin pisar un kind más nuevo), para que
 * nunca quede detrás de un cambio más reciente y pierda por "gana el más reciente".
 * Los cambios que se hagan luego se mezclan con él (outbox.compaction). Mientras esté en la cola, la
 * bajada no pisa la rutina local; cuando el servidor tenga la columna, sube como cualquier update.
 */
function parkKind(outbox: readonly OutboxOp[], sent: OutboxOp, id: string, kind: unknown): OutboxOp[] {
  const index = outbox.findIndex((op) => op.opId === sent.opId);
  if (index < 0) return [...outbox]; // No puede pasar: lo que se está enviando no se quita.
  const nextIndex = outbox.findIndex(
    (op, position) => position > index && op.kind === 'update' && op.table === 'routines' && op.id === id && !inFlight(op),
  );
  if (nextIndex >= 0) {
    const next = outbox[nextIndex] as OutboxOpOf<'update'>;
    const merged: OutboxOp = { ...next, changes: { kind, ...next.changes } };
    return outbox.flatMap((op, position) => (position === index ? [] : position === nextIndex ? [merged] : [op]));
  }
  const parked: OutboxOpOf<'update'> = {
    kind: 'update',
    table: 'routines',
    id,
    changes: { kind },
    opId: sent.opId,
    queuedAt: sent.queuedAt,
    at: sent.at,
    attempts: sent.attempts,
  };
  return outbox.map((op, position) => (position === index ? parked : op));
}

const applyOutcome = (store: LocalStore, sent: OutboxOp, outcome: Outcome) =>
  store.update((doc) => {
    const others = doc.outbox.filter((op) => op.opId !== sent.opId);
    const replaceSent = (replacement: OutboxOp) => doc.outbox.map((op) => (op.opId === sent.opId ? replacement : op));
    switch (outcome.type) {
      case 'done':
      case 'stale':
        return { doc: { ...doc, outbox: others }, result: undefined };
      case 'remap':
        return { doc: adoptRemoteNetwork({ ...doc, outbox: others }, (sent as OutboxOpOf<'insert'>).id, outcome.to), result: undefined };
      case 'failed':
        return { doc: { ...doc, outbox: replaceSent({ ...withoutSending(sent), failed: outcome.failure }) }, result: undefined };
      case 'deferred':
      case 'offline':
        return { doc: { ...doc, outbox: replaceSent(withoutSending(sent)) }, result: undefined };
      case 'kindPending':
        return { doc: { ...doc, outbox: parkKind(doc.outbox, sent, outcome.id, outcome.kind) }, result: undefined };
    }
  }, 'sync');

async function pushAll(store: LocalStore, remote: RemoteDeps, now: () => Date): Promise<PushReport> {
  await prepareOutbox(store, now());
  const report: PushReport = { sent: 0, stale: [], failed: [], deferred: [], offline: false };
  const attempted = new Set<string>();

  for (;;) {
    const op = await claimNext(store, attempted, now().toISOString());
    if (!op) return report;
    attempted.add(op.opId);

    const outcome = await send(op, remote).catch(toOutcome);
    await applyOutcome(store, op, outcome);

    if (outcome.type === 'offline') return { ...report, offline: true };
    if (outcome.type === 'deferred') {
      report.deferred.push(withoutSending(op));
      // Lo que sigue podría apuntar a la fila que no se creó: se corta la pasada, como sin red.
      // De un olvido o un update no depende nada: se sigue con lo demás (si no, todo esperaría a la migración).
      if (op.kind === 'insert') return report;
      continue;
    }
    if (outcome.type === 'kindPending') {
      report.deferred.push(withoutSending(op));
      if (outcome.sent) report.sent += 1;
      continue;
    }
    if (outcome.type === 'failed') {
      report.failed.push({ ...withoutSending(op), failed: outcome.failure });
      continue;
    }
    report.sent += 1;
    if (outcome.type === 'stale') report.stale.push(withoutSending(op));
  }
}

const running = new Map<LocalStore, Promise<PushReport>>();

/**
 * Sube la outbox en orden (§2.3): para en el primer error de red, marca como fallido lo que el servidor
 * rechaza (sus dependientes quedan bloqueados) y sigue con lo independiente. Lo que el servidor aún no
 * puede recibir por falta de la migración se deja en la cola, sin marcar, para la próxima. Un push a la vez por
 * usuario: si ya hay uno corriendo (ej. la app y la tarea en segundo plano), se espera ese.
 */
export function pushOutbox(store: LocalStore, remote: RemoteDeps, now: () => Date = () => new Date()): Promise<PushReport> {
  const current = running.get(store);
  if (current) return current;
  const run = pushAll(store, remote, now).finally(() => running.delete(store));
  running.set(store, run);
  return run;
}
