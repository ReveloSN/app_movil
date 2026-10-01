import type { Json } from './json.types';

/** Entidad "Record" del modelo. Se renombra para no chocar con el tipo nativo Record<K, V>. */
export interface VerificationRecord {
  id: string;
  routineId: string;
  /** ISO 8601. */
  date: string;
  result: string;
  itemsChecked: Json | null;
  durationSeconds: number | null;
}

export interface CreateVerificationRecordInput {
  routineId: string;
  result: string;
  /** Por defecto, el momento de inserción. */
  date?: string;
  itemsChecked?: Json | null;
  durationSeconds?: number | null;
}

export type UpdateVerificationRecordInput = Partial<Omit<CreateVerificationRecordInput, 'routineId'>>;
