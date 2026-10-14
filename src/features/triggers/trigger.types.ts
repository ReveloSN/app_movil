import type { ClockTime, Weekday } from '@/shared/types/clock.types';

/** Valor guardado en triggers.type. */
export type TriggerKind = 'schedule' | 'wifi_exit' | 'wifi_enter';

export type WifiTriggerKind = Extract<TriggerKind, 'wifi_exit' | 'wifi_enter'>;

export interface TimeWindow {
  start: ClockTime;
  end: ClockTime;
}

export interface ScheduleTriggerDraft {
  type: 'schedule';
  time: ClockTime;
  days: Weekday[];
}

export interface WifiTriggerDraft {
  type: WifiTriggerKind;
  /** Nombre técnico de la red (lo que reporta el teléfono). */
  ssid: string;
  /** Cómo la llama la persona (ej. "Casa"): es lo que se ve en avisos y notificaciones. */
  networkName: string;
  /** Franja (06-5): solo avisa dentro de ella. null = a cualquier hora. */
  window: TimeWindow | null;
}

/** Aviso tal como se edita en P06, antes de existir en la base de datos. */
export type TriggerDraft = ScheduleTriggerDraft | WifiTriggerDraft;

/** Borrador que corresponde a cada tipo (los dos de Wi-Fi comparten forma). */
export type DraftOf<K extends TriggerKind> = K extends 'schedule' ? ScheduleTriggerDraft : WifiTriggerDraft;

/** Aviso en el formulario de P04, con una clave estable para React. */
export type TriggerDraftEntry = TriggerDraft & { key: string };

/**
 * Aviso guardado y "armado" en el teléfono: lo necesario para notificar sin red ni sesión
 * (la tarea en segundo plano no puede esperar a Supabase).
 */
export type ArmedTrigger = TriggerDraft & {
  triggerId: string;
  routineId: string;
  routineName: string;
  itemLabels: string[];
};
