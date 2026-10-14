import { loadArmedTriggers } from '@/features/triggers/armedTriggers.store';
import { strategyFor } from '@/features/triggers/strategies';
import { markNetworkSeen } from '@/features/triggers/wifi/networkLastSeen.store';
import { readWifi } from '@/features/triggers/wifi/wifi.reader';
import { loadLastSsid, saveLastSsid } from '@/features/triggers/wifi/wifiSnapshot.store';
import { createSerialQueue } from '@/shared/lib/serialQueue';

import { loadNotificationPrefs } from './notification.prefs';
import { fireTriggerNow } from './occurrence.lifecycle';

const serial = createSerialQueue();

/**
 * Compara la red actual con la última conocida y hace sonar los avisos de Wi-Fi cuya transición
 * ocurrió. Si el sistema oculta el nombre de la red, no decide nada (ni actualiza la última conocida).
 * Devuelve cuántos avisos sonaron.
 */
export function checkWifiTriggers(now: number = Date.now()): Promise<number> {
  return serial(async () => {
    const reading = await readWifi();
    if (reading.status === 'unknown') return 0;

    const current = reading.status === 'wifi' ? reading.ssid : null;
    if (current) await markNetworkSeen(current, now);
    const previous = await loadLastSsid();
    await saveLastSsid(current);
    // Primera lectura: no hay transición que comparar.
    if (previous === undefined || previous === current) return 0;

    const snapshot = await loadArmedTriggers();
    if (!snapshot) return 0;

    const prefs = await loadNotificationPrefs();
    let fired = 0;
    for (const armed of snapshot.triggers) {
      if (!strategyFor(armed).firesOnNetworkChange(armed, previous, current, new Date(now))) continue;
      if (await fireTriggerNow(armed, snapshot.ownerId, now, prefs)) fired += 1;
    }
    return fired;
  });
}
