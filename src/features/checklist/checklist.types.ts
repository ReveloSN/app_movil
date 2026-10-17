export interface ChecklistItemState {
  id: string;
  label: string;
  icon: string | null;
  critical: boolean;
  /** 07-5: se muestra bajo la etiqueta. */
  note: string | null;
  checked: boolean;
}

/** Valor guardado en records.result (el constraint admite además 'no_response', que no sale de esta pantalla). */
export type VerificationOutcome = 'completed' | 'partial' | 'skipped';

/** Cómo terminó el usuario: "Listo" u "Omitir por hoy". */
export type FinishIntent = 'done' | 'skip';

/** Entrada de records.items_checked: copia del ítem al momento de verificar. */
export type CheckedItemEntry = {
  itemId: string;
  label: string;
  critical: boolean;
  checked: boolean;
};

export interface ChecklistProgress {
  checked: number;
  total: number;
}

/** Lo que necesita la pantalla de Resumen (P08). */
export interface VerificationSummary {
  outcome: VerificationOutcome;
  checked: number;
  total: number;
  omittedLabels: string[];
  /** Los omitidos que eran críticos (P08 los marca con bandera). */
  omittedCriticalLabels: string[];
  durationSeconds: number;
}
