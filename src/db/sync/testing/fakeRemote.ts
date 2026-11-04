import { RepositoryError } from '../../repositories/repository.types';
import type { RemoteDeps } from '../sync.push';

type Row = Record<string, unknown> & { id: string };
type Table = 'routines' | 'items' | 'triggers' | 'homeNetworks' | 'settings' | 'records' | 'forgotEvents';

export const conflictError = (table = 'routines') => new RepositoryError(table, 'create', 'conflict', '23505', 'duplicate key');
export const networkError = (table = 'routines') =>
  new RepositoryError(table, 'create', 'network', undefined, 'Network request failed');
export const rejectedError = (code: string, table = 'routines') =>
  new RepositoryError(table, 'create', 'other', code, `rejected (${code})`);
/** Como responde PostgREST si la base no tiene la columna routines.kind. */
export const missingKindColumnError = (operation: 'create' | 'updateIfOlder' = 'create') =>
  new RepositoryError('routines', operation, 'other', 'PGRST204', "Could not find the 'kind' column of 'routines' in the schema cache");
/** Como responde PostgREST si la base no tiene la tabla forgot_events. */
export const missingForgotTableError = (operation: 'create' | 'getAll' = 'create') =>
  new RepositoryError('forgot_events', operation, 'other', 'PGRST205', "Could not find the table 'public.forgot_events' in the schema cache");

export interface FakeRemoteOptions {
  /**
   * false: servidor sin la migración 20261103000000 (sin routines.kind ni forgot_events), como lo
   * respondería PostgREST. migrate() la aplica después.
   */
  migrated?: boolean;
}

/**
 * Servidor falso en memoria para probar la sincronización: guarda filas por tabla, anota cada
 * llamada ("tabla.método:id") y permite que la próxima llamada que coincida falle con un error dado.
 * Como la base real, no admite dos redes con el mismo SSID, e insertar un olvido que ya existe no hace nada.
 */
export function fakeRemote(initial: Partial<Record<Table, Row[]>> = {}, options: FakeRemoteOptions = {}) {
  let migrated = options.migrated ?? true;
  const tables: Record<Table, Row[]> = {
    routines: [],
    items: [],
    triggers: [],
    homeNetworks: [],
    settings: [],
    records: [],
    forgotEvents: [],
    ...initial,
  };
  const calls: string[] = [];
  const failures: { match: string; error: unknown }[] = [];
  /** Si se define, la próxima llamada que coincida espera esta promesa antes de responder. */
  const gates = new Map<string, Promise<void>>();

  async function track(table: Table, method: string, id: string) {
    const name = `${table}.${method}`;
    calls.push(`${name}:${id}`);
    const gate = gates.get(name);
    if (gate) {
      gates.delete(name);
      await gate;
    }
    const index = failures.findIndex(({ match }) => match === name || match === `${name}:${id}`);
    if (index >= 0) throw failures.splice(index, 1)[0].error;
  }

  /** Lo que rechazaría una base sin la migración. */
  function checkSchema(table: Table, method: 'create' | 'updateIfOlder' | 'getAll', values: Record<string, unknown> = {}) {
    if (migrated) return;
    if (table === 'forgotEvents' && method !== 'updateIfOlder') throw missingForgotTableError(method);
    if (table === 'routines' && method !== 'getAll' && 'kind' in values) throw missingKindColumnError(method);
  }

  function repo(table: Table) {
    const rows = () => tables[table];
    return {
      async create(input: Record<string, unknown>) {
        const id = String(input.id ?? input.userId ?? `${table}-${rows().length + 1}`);
        await track(table, 'create', id);
        checkSchema(table, 'create', input);
        const duplicate =
          rows().some((row) => row.id === id) ||
          (table === 'homeNetworks' && rows().some((row) => row.ssid === input.ssid));
        if (duplicate) throw conflictError(table);
        const row = { ...input, id, updatedAt: input.updatedAt ?? '2026-10-14T00:00:00.000Z' } as Row;
        rows().push(row);
        return row;
      },
      async updateIfOlder(id: string, changes: Record<string, unknown>, at: string) {
        await track(table, 'updateIfOlder', id);
        checkSchema(table, 'updateIfOlder', changes);
        const row = rows().find((candidate) => candidate.id === id);
        if (!row || String(row.updatedAt) > at) return 'stale' as const;
        Object.assign(row, changes, { updatedAt: at });
        return 'applied' as const;
      },
      async delete(id: string) {
        await track(table, 'delete', id);
        tables[table] = rows().filter((row) => row.id !== id);
      },
      async deleteByRoutine(routineId: string) {
        await track(table, 'deleteByRoutine', routineId);
        tables[table] = rows().filter((row) => row.routineId !== routineId);
      },
      async getAll() {
        await track(table, 'getAll', '*');
        checkSchema(table, 'getAll');
        return rows().map((row) => ({ ...row }));
      },
    };
  }

  /** Como el upsert con ignoreDuplicates del repositorio real. */
  function forgotEvents() {
    const base = repo('forgotEvents');
    return {
      ...base,
      async create(input: Record<string, unknown>) {
        try {
          await base.create(input);
        } catch (cause) {
          if (cause instanceof RepositoryError && cause.kind === 'conflict') return;
          throw cause;
        }
      },
    };
  }

  const remote = {
    routines: repo('routines'),
    items: { ...repo('items'), getByRoutine: async () => [] },
    triggers: { ...repo('triggers'), getByRoutine: async () => [] },
    homeNetworks: repo('homeNetworks'),
    settings: repo('settings'),
    records: repo('records'),
    forgotEvents: forgotEvents(),
  } as unknown as RemoteDeps;

  return {
    remote,
    tables,
    calls,
    failNext(match: string, error: unknown) {
      failures.push({ match, error });
    },
    /** La próxima llamada a `match` ("tabla.método") espera hasta que se llame a la función devuelta. */
    /** Aplica la migración: aparece la tabla de olvidos y las rutinas sin tipo quedan de salida (el default). */
    migrate() {
      migrated = true;
      for (const row of tables.routines) row.kind ??= 'departure';
    },
    holdNext(match: string): () => void {
      let release!: () => void;
      gates.set(match, new Promise<void>((resolve) => (release = resolve)));
      return () => release();
    },
  };
}
