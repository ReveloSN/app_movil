import { RepositoryError } from '../../repositories/repository.types';
import type { RemoteDeps } from '../sync.push';

type Row = Record<string, unknown> & { id: string };
type Table = 'routines' | 'items' | 'triggers' | 'homeNetworks' | 'settings' | 'records';

export const conflictError = (table = 'routines') => new RepositoryError(table, 'create', 'conflict', '23505', 'duplicate key');
export const networkError = (table = 'routines') =>
  new RepositoryError(table, 'create', 'network', undefined, 'Network request failed');
export const rejectedError = (code: string, table = 'routines') =>
  new RepositoryError(table, 'create', 'other', code, `rejected (${code})`);

/**
 * Servidor falso en memoria para probar la sincronización: guarda filas por tabla, anota cada
 * llamada ("tabla.método:id") y permite que la próxima llamada que coincida falle con un error dado.
 * Como la base real, no admite dos redes con el mismo SSID.
 */
export function fakeRemote(initial: Partial<Record<Table, Row[]>> = {}) {
  const tables: Record<Table, Row[]> = {
    routines: [],
    items: [],
    triggers: [],
    homeNetworks: [],
    settings: [],
    records: [],
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

  function repo(table: Table) {
    const rows = () => tables[table];
    return {
      async create(input: Record<string, unknown>) {
        const id = String(input.id ?? input.userId ?? `${table}-${rows().length + 1}`);
        await track(table, 'create', id);
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
        return rows().map((row) => ({ ...row }));
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
  } as unknown as RemoteDeps;

  return {
    remote,
    tables,
    calls,
    failNext(match: string, error: unknown) {
      failures.push({ match, error });
    },
    /** La próxima llamada a `match` ("tabla.método") espera hasta que se llame a la función devuelta. */
    holdNext(match: string): () => void {
      let release!: () => void;
      gates.set(match, new Promise<void>((resolve) => (release = resolve)));
      return () => release();
    },
  };
}
