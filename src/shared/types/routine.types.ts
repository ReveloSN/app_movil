export interface Routine {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  active: boolean;
  /** ISO 8601. */
  lastCompletedAt: string | null;
  /** ISO 8601. */
  createdAt: string;
}

export interface CreateRoutineInput {
  name: string;
  icon?: string | null;
  color?: string | null;
  active?: boolean;
}

export type UpdateRoutineInput = Partial<CreateRoutineInput & Pick<Routine, 'lastCompletedAt'>>;
