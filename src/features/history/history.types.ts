import type { VerificationRecord } from '@/shared/types/verification-record.types';

/** Registro con el nombre e ícono de su rutina ya resueltos. */
export interface HistoryEntry extends VerificationRecord {
  routineName: string;
  routineIcon: string | null;
}

export interface HistoryGroup {
  /** Día local en formato YYYY-MM-DD. */
  date: string;
  /** Del más reciente al más antiguo. */
  records: HistoryEntry[];
}

export interface HistoryState {
  groups: HistoryGroup[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
}
