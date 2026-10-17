import type { HomeNetwork } from '@/shared/types/home-network.types';
import type { Item } from '@/shared/types/item.types';
import type { Routine } from '@/shared/types/routine.types';
import type { Settings } from '@/shared/types/settings.types';
import type { Trigger } from '@/shared/types/trigger.types';
import type { CreateVerificationRecordInput, VerificationRecord } from '@/shared/types/verification-record.types';

/** Copia local de los datos del usuario (entidades del dominio, no filas de la base). */
export interface LocalTables {
  routines: Routine[];
  items: Item[];
  triggers: Trigger[];
  homeNetworks: HomeNetwork[];
  /** Como máximo una fila: la del usuario. */
  settings: Settings[];
}

export type LocalTableName = keyof LocalTables;

/** Fila a la que apunta una operación. En ajustes, el id es el userId. */
export interface RowRef {
  table: LocalTableName;
  id: string;
}

/** Verificación pendiente de subir. El id lo genera el cliente: reintentar nunca la duplica. */
export type PendingRecord = CreateVerificationRecordInput & { id: string };

/** Rechazo permanente del servidor (no de red): la operación queda visible hasta reintentar o descartar. */
export interface OutboxFailure {
  code: string | null;
  message: string;
}

/** Qué hay que hacer en el servidor. Los valores van en forma de input del dominio (camelCase). */
export type OutboxChange =
  | { kind: 'insert'; table: LocalTableName; id: string; values: Record<string, unknown> }
  | { kind: 'update'; table: LocalTableName; id: string; changes: Record<string, unknown> }
  | { kind: 'delete'; table: LocalTableName; id: string }
  /** Borra la rutina con sus ítems, avisos e historial (en el servidor, con deleteRoutineCascade). */
  | { kind: 'deleteRoutine'; id: string }
  | { kind: 'insertRecord'; record: PendingRecord };

export interface OutboxMeta {
  opId: string;
  /** ISO 8601: cuándo se encoló. */
  queuedAt: string;
  /** ISO 8601: hora del cambio en el dispositivo. Decide los conflictos ("gana el más reciente"). */
  at: string;
  attempts: number;
  failed?: OutboxFailure;
  /**
   * ISO 8601: se está enviando desde entonces. Mientras tanto no se mezcla ni se quita (puede haber
   * llegado al servidor). Si quedó así por un cierre a medias, el push la libera pasado un rato.
   */
  sendingSince?: string;
}

export type OutboxOp = OutboxChange & OutboxMeta;

/** Operación de un tipo concreto (ej. OutboxOpOf<'update'>). */
export type OutboxOpOf<K extends OutboxChange['kind']> = Extract<OutboxChange, { kind: K }> & OutboxMeta;

export interface LocalDocument {
  version: 1;
  tables: LocalTables;
  /** Cambios pendientes de subir, en el orden en que deben enviarse. */
  outbox: OutboxOp[];
  /** ISO 8601 de la última descarga completa del servidor (Fase 4). */
  lastPulledAt: string | null;
  /**
   * Historial (P09) sin red: lo bajado del servidor más lo verificado aquí. Lo pendiente de subir se sabe
   * por la cola. Los documentos anteriores no lo tienen (se llena en la siguiente bajada).
   */
  records?: VerificationRecord[];
}
