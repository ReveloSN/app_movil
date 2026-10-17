import { deleteRoutineCascade } from '@/features/routines/routine-delete.service';

import type { LocalTableName, OutboxFailure, OutboxOp, OutboxOpOf } from '../local/local-document.types';
import type { LocalStore } from '../local/local.store';
import { classifyOutbox } from '../local/outbox.dependencies';
import type { RemoteHomeNetworkRepository } from '../repositories/home-network.repository';
import type { RemoteItemRepository } from '../repositories/item.repository';
import { isNetworkError, RepositoryError, type UpdateOutcome } from '../repositories/repository.types';
import type { RemoteRoutineRepository } from '../repositories/routine.repository';
import type { RemoteSettingsRepository } from '../repositories/settings.repository';
import type { RemoteTriggerRepository } from '../repositories/trigger.repository';
import type { VerificationRecordRepository } from '../repositories/verification-record.repository';
import { adoptRemoteNetwork } from './sync.remap';

/** Lo que necesita la sincronización del servidor (los repositorios de Supabase). */
export interface RemoteDeps {
  routines: RemoteRoutineRepository;
  items: RemoteItemRepository;
  triggers: RemoteTriggerRepository;
  homeNetworks: RemoteHomeNetworkRepository;
  settings: RemoteSettingsRepository;
  records: Pick<VerificationRecordRepository, 'create' | 'deleteByRoutine' | 'getAll'>;
}

export interface PushReport {
  sent: number;
  /** Cambios locales que perdieron contra uno más reciente del servidor (o la fila ya no existía). */
  stale: OutboxOp[];
  /** Rechazados en esta pasada: quedan en la cola, marcados y visibles. */
  failed: OutboxOp[];
  /** Se cortó por falta de red: lo que falta se intenta en la próxima. */
  offline: boolean;
}

type Outcome =
  | { type: 'done' }
  | { type: 'stale' }
  | { type: 'remap'; to: string }
  | { type: 'failed'; failure: OutboxFailure }
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

async function sendInsert(op: OutboxOpOf<'insert'>, remote: RemoteDeps): Promise<Outcome> {
  try {
    await repositoryFor(remote, op.table).create(op.values);
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

async function send(op: OutboxOp, remote: RemoteDeps): Promise<Outcome> {
  switch (op.kind) {
    case 'insert':
      return sendInsert(op, remote);
    case 'update':
      return (await repositoryFor(remote, op.table).updateIfOlder(op.id, op.changes, op.at)) === 'applied' ? DONE : STALE;
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
  }
}

function toOutcome(cause: unknown): Outcome {
  if (isNetworkError(cause)) return { type: 'offline' };
  const code = cause instanceof RepositoryError ? (cause.code ?? null) : null;
  return { type: 'failed', failure: { code, message: cause instanceof Error ? cause.message : String(cause) } };
}

const withoutSending = ({ sendingSince: _sendingSince, ...op }: OutboxOp) => op as OutboxOp;

const releaseStaleSending = (store: LocalStore, now: Date) =>
  store.update((doc) => {
    const stale = (op: OutboxOp) => op.sendingSince !== undefined && now.getTime() - Date.parse(op.sendingSince) > STALE_SENDING_MS;
    if (!doc.outbox.some(stale)) return { doc, result: undefined };
    return { doc: { ...doc, outbox: doc.outbox.map((op) => (stale(op) ? withoutSending(op) : op)) }, result: undefined };
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
      case 'offline':
        return { doc: { ...doc, outbox: replaceSent(withoutSending(sent)) }, result: undefined };
    }
  }, 'sync');

async function pushAll(store: LocalStore, remote: RemoteDeps, now: () => Date): Promise<PushReport> {
  await releaseStaleSending(store, now());
  const report: PushReport = { sent: 0, stale: [], failed: [], offline: false };
  const attempted = new Set<string>();

  for (;;) {
    const op = await claimNext(store, attempted, now().toISOString());
    if (!op) return report;
    attempted.add(op.opId);

    const outcome = await send(op, remote).catch(toOutcome);
    await applyOutcome(store, op, outcome);

    if (outcome.type === 'offline') return { ...report, offline: true };
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
 * rechaza (sus dependientes quedan bloqueados) y sigue con lo independiente. Un push a la vez por
 * usuario: si ya hay uno corriendo (ej. la app y la tarea en segundo plano), se espera ese.
 */
export function pushOutbox(store: LocalStore, remote: RemoteDeps, now: () => Date = () => new Date()): Promise<PushReport> {
  const current = running.get(store);
  if (current) return current;
  const run = pushAll(store, remote, now).finally(() => running.delete(store));
  running.set(store, run);
  return run;
}
