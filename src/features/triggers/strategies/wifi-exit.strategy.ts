import { createWifiStrategy } from './wifi.strategy';

/** Avisa al desconectarse de la red (salir de casa). */
export const wifiExitStrategy = createWifiStrategy({
  kind: 'wifi_exit',
  label: 'Salir del Wi-Fi',
  icon: 'log-out-outline',
  phrasePrefix: 'cuando salgas de',
  leadPrefix: 'Te desconectaste del Wi-Fi de',
  isTransition: (wasOnNetwork, isOnNetwork) => wasOnNetwork && !isOnNetwork,
});
