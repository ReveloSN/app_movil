/**
 * Contrato de acceso a datos de una entidad. El resto de la app depende solo de esto,
 * nunca del origen concreto de los datos (hoy Supabase; mañana podría sumarse una caché local).
 */
export interface Repository<TEntity, TCreate, TUpdate, TId = string> {
  create(input: TCreate): Promise<TEntity>;
  getAll(): Promise<TEntity[]>;
  update(id: TId, changes: TUpdate): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

/** Resultado de una actualización condicional: 'stale' si el servidor ya tenía un cambio más reciente (o la fila no existe). */
export type UpdateOutcome = 'applied' | 'stale';

/** Actualización "gana el más reciente": solo se aplica si la fila no tiene un cambio posterior a `at` (ISO 8601). */
export interface LastWriteWins<TUpdate, TId = string> {
  updateIfOlder(id: TId, changes: TUpdate, at: string): Promise<UpdateOutcome>;
}

export type RepositoryOperation =
  | 'create'
  | 'getAll'
  | 'listWhere'
  | 'update'
  | 'updateIfOlder'
  | 'delete'
  | 'deleteWhere';

/**
 * Tipo de fallo, independiente del proveedor:
 * - network: la petición no llegó al servidor (sin conexión, timeout). Se puede reintentar.
 * - conflict: el registro ya existe (misma clave). En un reintento idempotente equivale a éxito.
 * - referenced: no se puede borrar porque otras filas apuntan a esta (clave foránea sin cascada).
 * - other: el servidor rechazó la operación (validación, permisos…). Reintentar no sirve.
 */
export type RepositoryErrorKind = 'network' | 'conflict' | 'referenced' | 'other';

/** Error uniforme de la capa de datos, independiente del proveedor. */
export class RepositoryError extends Error {
  constructor(
    readonly entity: string,
    readonly operation: RepositoryOperation,
    readonly kind: RepositoryErrorKind,
    readonly code: string | undefined,
    message: string,
  ) {
    super(`[${entity}.${operation}] ${message}`);
    this.name = 'RepositoryError';
  }
}

/** true si el error se debe a la conexión (incluye fallos de fetch que no pasaron por el repositorio). */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof RepositoryError) return error.kind === 'network';
  return error instanceof TypeError; // fetch lanza TypeError ("Network request failed").
}
