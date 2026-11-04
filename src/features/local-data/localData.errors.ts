import { UnsupportedDocumentVersionError } from '@/db/local/local-document.migration';

/**
 * Los datos de este teléfono los escribió una versión MÁS NUEVA de la app (p. ej. se instaló una anterior
 * encima). No se leen ni se tocan para no perderlos: la salida es actualizar la app, no reintentar.
 */
export const NEWER_DATA_MESSAGE = 'Esta versión de la app es más antigua que tus datos; actualízala para seguir.';

export const isNewerDataError = (cause: unknown): boolean => cause instanceof UnsupportedDocumentVersionError;

/** El mensaje para mostrar cuando falla la lectura local: el dedicado si es una versión más nueva; si no, `fallback`. */
export const localLoadErrorMessage = (cause: unknown, fallback: string): string =>
  isNewerDataError(cause) ? NEWER_DATA_MESSAGE : fallback;
