import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { applyNotificationResponse } from './notification.actions';

/**
 * Respuestas a notificaciones con la app abierta, o la que la abrió en frío.
 * "Verificar" o tocar el cuerpo → P07 de esa rutina. Posponer/Omitir no navegan.
 */
export function NotificationResponseHandler() {
  useEffect(() => {
    let mounted = true;
    // La misma respuesta puede llegar por getLastNotificationResponse y por el listener.
    const navigated = new Set<string>();

    const handle = (response: Notifications.NotificationResponse) => {
      Notifications.clearLastNotificationResponse();
      applyNotificationResponse(response)
        .then((outcome) => {
          const id = `${response.notification.request.identifier}|${response.notification.date}`;
          if (!mounted || outcome?.kind !== 'verify' || navigated.has(id)) return;
          navigated.add(id);
          router.push({ pathname: '/routine/[id]/verify', params: { id: outcome.routineId } });
        })
        .catch((cause: unknown) => {
          if (__DEV__) console.warn('[notifications.response]', cause);
        });
    };

    const last = Notifications.getLastNotificationResponse();
    if (last) handle(last);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return null;
}
