import copy from '../trigger.copy';
import type { ScheduleTriggerDraft } from '../trigger.types';
import type { TriggerStrategy } from './trigger.strategy';

/** Aviso por horario: a una hora fija los días elegidos. */
export const scheduleStrategy: TriggerStrategy<ScheduleTriggerDraft> = {
  kind: 'schedule',
  // El texto se lee al usarlo (no al cargar el módulo): así sigue el idioma activo.
  get label() {
    return copy.SCHEDULE_LABEL;
  },
  icon: 'alarm-outline',
  needsLocation: false,

  describe: ({ time, days }) => copy.scheduleDescription(days, time),

  notificationLead: ({ time }) => copy.scheduleLead(time),

  occurrencesBetween({ time, days }, from, until) {
    const result: Date[] = [];
    // Fechas locales: el día y la hora se interpretan en la zona horaria del teléfono.
    for (let date = new Date(from.getFullYear(), from.getMonth(), from.getDate(), time.hour, time.minute); date < until; ) {
      if (date >= from && days.includes(date.getDay() as ScheduleTriggerDraft['days'][number])) result.push(date);
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, time.hour, time.minute);
    }
    return result;
  },

  firesOnNetworkChange: () => false,
};
