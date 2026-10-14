import { endSentence } from '@/shared/utils/endSentence';
import { minutesOfDay } from '@/shared/utils/formatClock';
import type { IoniconName } from '@/shared/utils/ioniconName';

import { windowSuffix } from '../trigger.copy';
import type { TimeWindow, WifiTriggerDraft, WifiTriggerKind } from '../trigger.types';
import type { TriggerStrategy } from './trigger.strategy';

/** true si `at` cae dentro de la franja. Admite franjas que cruzan la medianoche (22:00–06:00). */
export function isWithinWindow(window: TimeWindow | null, at: Date): boolean {
  if (!window) return true;
  const now = at.getHours() * 60 + at.getMinutes();
  const start = minutesOfDay(window.start);
  const end = minutesOfDay(window.end);
  return start <= end ? now >= start && now <= end : now >= start || now <= end;
}

interface WifiStrategyConfig {
  kind: WifiTriggerKind;
  label: string;
  icon: IoniconName;
  /** "cuando salgas de" */
  phrasePrefix: string;
  /** "Te desconectaste del Wi-Fi de" */
  leadPrefix: string;
  /** Transición que dispara, comparando con el SSID de la red del aviso. */
  isTransition(wasOnNetwork: boolean, isOnNetwork: boolean): boolean;
}

/** Base común de los avisos por Wi-Fi: solo cambia la transición y los textos. */
export function createWifiStrategy(config: WifiStrategyConfig): TriggerStrategy<WifiTriggerDraft> {
  return {
    kind: config.kind,
    label: config.label,
    icon: config.icon,
    needsLocation: true,
    describe: ({ networkName, window }) => `${config.phrasePrefix} ${networkName}${windowSuffix(window)}`,
    notificationLead: ({ networkName }) => endSentence(`${config.leadPrefix} ${networkName}`),
    occurrencesBetween: () => [],
    firesOnNetworkChange: ({ ssid, window }, previousSsid, currentSsid, at) =>
      config.isTransition(previousSsid === ssid, currentSsid === ssid) && isWithinWindow(window, at),
  };
}
