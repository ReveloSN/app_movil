import copy from '../trigger.copy';
import { createWifiStrategy } from './wifi.strategy';

/** Avisa al desconectarse de la red (salir de casa). */
export const wifiExitStrategy = createWifiStrategy({
  kind: 'wifi_exit',
  label: () => copy.WIFI_EXIT_LABEL,
  icon: 'log-out-outline',
  phrase: (networkName) => copy.wifiExitPhrase(networkName),
  lead: (networkName) => copy.wifiExitLead(networkName),
  isTransition: (wasOnNetwork, isOnNetwork) => wasOnNetwork && !isOnNetwork,
});
