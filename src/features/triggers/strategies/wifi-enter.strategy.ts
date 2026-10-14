import { createWifiStrategy } from './wifi.strategy';

/** Avisa al conectarse a la red (llegar). El texto de la notificación no viene del Documento de Contenido. */
export const wifiEnterStrategy = createWifiStrategy({
  kind: 'wifi_enter',
  label: 'Llegar al Wi-Fi',
  icon: 'log-in-outline',
  phrasePrefix: 'cuando llegues a',
  leadPrefix: 'Te conectaste al Wi-Fi de',
  isTransition: (wasOnNetwork, isOnNetwork) => !wasOnNetwork && isOnNetwork,
});
