import type { ClockTime } from '@/shared/types/clock.types';
import { DEFAULT_ROUTINE_KIND, type RoutineKind } from '@/shared/types/routine.types';

import type { TimeWindow, TriggerKind } from './trigger.types';

/** Aviso con el que arranca el editor (P06): al llegar, el de llegar al Wi-Fi de casa. */
export const defaultTriggerKindFor = (routineKind: RoutineKind = DEFAULT_ROUTINE_KIND): TriggerKind =>
  routineKind === 'arrival' ? 'wifi_enter' : 'schedule';

const MORNING_WINDOW: TimeWindow = { start: { hour: 6, minute: 0 }, end: { hour: 9, minute: 0 } };
const EVENING_START: ClockTime = { hour: 16, minute: 0 };
const EVENING_END: ClockTime = { hour: 23, minute: 0 };

/** Franja propuesta al activar «Solo en una franja horaria»: por la mañana para salir, por la tarde para llegar. */
export const defaultWindowFor = (routineKind: RoutineKind = DEFAULT_ROUTINE_KIND): TimeWindow =>
  routineKind === 'arrival' ? { start: EVENING_START, end: EVENING_END } : MORNING_WINDOW;
