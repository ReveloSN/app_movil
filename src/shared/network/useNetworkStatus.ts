import './netinfo.config';

import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
}

/**
 * Estado de conexión del dispositivo. Arranca en true y solo pasa a false con un evento
 * explícito: así no aparece el aviso de "sin conexión" en un parpadeo al abrir la app.
 * Cuenta como desconectado si no hay red (isConnected) o si hay red pero sin salida a
 * internet (isInternetReachable, ej. Wi-Fi sin internet). NetInfo informa `null` cuando
 * aún no sabe: en ambos campos se trata como conectado.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  return { isConnected };
}
