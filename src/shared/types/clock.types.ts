/** Hora local del día, sin fecha ni zona horaria. */
export interface ClockTime {
  /** 0–23. */
  hour: number;
  /** 0–59. */
  minute: number;
}

/** Día de la semana como en Date#getDay(): 0 = domingo … 6 = sábado. Así se guarda en triggers.days. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
