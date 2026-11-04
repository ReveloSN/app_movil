import type { OutboxFailure } from '../local/local-document.types';
import { RepositoryError } from '../repositories/repository.types';

/** PostgREST (caché de esquema) y Postgres cuando falta una columna. */
const MISSING_COLUMN_CODES = new Set(['PGRST204', '42703']);
/** PostgREST (caché de esquema) y Postgres cuando falta una tabla. */
const MISSING_TABLE_CODES = new Set(['PGRST205', '42P01']);

/**
 * Lo que agrega la migración 20261103000000 y un servidor viejo todavía no tiene:
 * - routineKind: la columna routines.kind.
 * - forgotEvents: la tabla forgot_events.
 */
export type SchemaGap = 'routineKind' | 'forgotEvents';

/**
 * El rechazo se debe a que el servidor aún no tiene la migración (la app puede publicarse antes).
 * No es un error de los datos: la operación se reintenta en la próxima sincronización.
 * Solo se reconocen la columna y la tabla nuevas; cualquier otra columna o tabla faltante sigue siendo un fallo.
 */
export function schemaGapOf({ code, message }: OutboxFailure): SchemaGap | null {
  if (code === null) return null;
  if (MISSING_COLUMN_CODES.has(code) && /\bkind\b/.test(message)) return 'routineKind';
  if (MISSING_TABLE_CODES.has(code) && message.includes('forgot_events')) return 'forgotEvents';
  return null;
}

/** Igual que schemaGapOf, para un error lanzado por un repositorio. */
export const schemaGapOfError = (cause: unknown): SchemaGap | null =>
  cause instanceof RepositoryError ? schemaGapOf({ code: cause.code ?? null, message: cause.message }) : null;
