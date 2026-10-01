export interface Item {
  id: string;
  routineId: string;
  label: string;
  icon: string | null;
  type: string | null;
  critical: boolean;
  note: string | null;
  sortOrder: number;
}

export interface CreateItemInput {
  routineId: string;
  label: string;
  icon?: string | null;
  type?: string | null;
  critical?: boolean;
  note?: string | null;
  sortOrder?: number;
}

/** Un ítem no cambia de rutina. */
export type UpdateItemInput = Partial<Omit<CreateItemInput, 'routineId'>>;
