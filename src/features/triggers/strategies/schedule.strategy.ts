import { endSentence } from '@/shared/utils/endSentence';
import { formatClock, isOneOClock } from '@/shared/utils/formatClock';

import { atClock, formatDays } from '../trigger.copy';
import type { ScheduleTriggerDraft } from '../trigger.types';
import type { TriggerStrategy } from './trigger.strategy';

const ALL_DAYS = 7;

/** Aviso por horario: a una hora fija los días elegidos. */
export const scheduleStrategy: TriggerStrategy<ScheduleTriggerDraft> = {
  kind: 'schedule',
  label: 'Horario',
  icon: 'alarm-outline',
  needsLocation: false,

  describe: ({ time, days }) =>
    days.length === ALL_DAYS ? `todos los días ${atClock(time)}` : `todos los ${formatDays(days)} ${atClock(time)}`,

  notificationLead: ({ time }) => endSentence(`${isOneOClock(time) ? 'Es la' : 'Son las'} ${formatClock(time)}`),

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
