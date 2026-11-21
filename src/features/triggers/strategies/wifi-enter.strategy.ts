import copy from '../trigger.copy';
import { createWifiStrategy } from './wifi.strategy';

/** Avisa al conectarse a la red (llegar). El texto de la notificación no viene del Documento de Contenido. */
export const wifiEnterStrategy = createWifiStrategy({
  kind: 'wifi_enter',
  label: () => copy.WIFI_ENTER_LABEL,
  icon: 'log-in-outline',
  phrase: (networkName) => copy.wifiEnterPhrase(networkName),
  lead: (networkName) => copy.wifiEnterLead(networkName),
  isTransition: (wasOnNetwork, isOnNetwork) => !wasOnNetwork && isOnNetwork,
});
