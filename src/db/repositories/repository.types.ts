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

export type RepositoryOperation = 'create' | 'getAll' | 'update' | 'delete';

/** Error uniforme de la capa de datos, independiente del proveedor. */
export class RepositoryError extends Error {
  constructor(
    readonly entity: string,
    readonly operation: RepositoryOperation,
    readonly code: string | undefined,
    message: string,
  ) {
    super(`[${entity}.${operation}] ${message}`);
    this.name = 'RepositoryError';
  }
}
