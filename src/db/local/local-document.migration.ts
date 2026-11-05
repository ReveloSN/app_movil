import { DEFAULT_ROUTINE_KIND, type Routine } from '@/shared/types/routine.types';

import type { LocalDocument } from './local-document.types';

/** Versión del documento que escribe esta versión de la app. */
export const LOCAL_DOCUMENT_VERSION = 2;

/**
 * El documento lo escribió una versión más nueva de la app (ej. se instaló una anterior encima).
 * No se sabe leerlo: no se vacía ni se reescribe, para no perder los datos de la persona.
 */
export class UnsupportedDocumentVersionError extends Error {
  constructor(readonly version: number) {
    super(`El documento local es de la versión ${version} y esta app solo entiende hasta la ${LOCAL_DOCUMENT_VERSION}.`);
    this.name = 'UnsupportedDocumentVersionError';
  }
}

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);

/** v1 → v2: olvidos en el documento (vacío) y tipo de rutina (las de antes eran todas de salida). */
function fromV1(doc: Raw): Raw {
  const tables = isObject(doc.tables) ? doc.tables : {};
  const routines = Array.isArray(tables.routines)
    ? (tables.routines as Partial<Routine>[]).map((routine) => ({ kind: DEFAULT_ROUTINE_KIND, ...routine }))
    : tables.routines;
  return { ...doc, version: 2, tables: { ...tables, routines }, forgotEvents: [] };
}

/**
 * Lleva lo guardado a la versión actual, paso a paso. Devuelve null si no parece un documento
 * (corrupto: se trata como vacío, como antes). Lanza UnsupportedDocumentVersionError si es de una
 * versión futura. Solo transforma en memoria: se guarda en la próxima escritura.
 */
export function migrateDocument(raw: unknown): LocalDocument | null {
  if (!isObject(raw) || typeof raw.version !== 'number') return null;
  if (raw.version > LOCAL_DOCUMENT_VERSION) throw new UnsupportedDocumentVersionError(raw.version);

  let doc = raw;
  if (doc.version === 1) doc = fromV1(doc);
  return isLocalDocument(doc) ? doc : null;
}

function isLocalDocument(value: Raw): value is Raw & LocalDocument {
  return (
    value.version === LOCAL_DOCUMENT_VERSION &&
    isObject(value.tables) &&
    Array.isArray(value.outbox) &&
    (value.forgotEvents === undefined || Array.isArray(value.forgotEvents))
  );
}
