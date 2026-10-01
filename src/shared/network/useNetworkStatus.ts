import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
}

/**
 * Estado de conexión del dispositivo. Arranca en true y solo pasa a false con un evento
 * explícito: así no aparece el aviso de "sin conexión" en un parpadeo al abrir la app.
 * NetInfo informa `null` cuando aún no sabe: se trata como conectado.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);

  return { isConnected };
}
