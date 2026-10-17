import { useCallback, useRef, useState } from 'react';

import { useNetworkStatus } from '@/shared/network/useNetworkStatus';

import { updateAiPrefs, useAiPrefs } from './ai.prefs';

/**
 * Si la IA se muestra y si se puede usar ahora, más el aviso de privacidad de primer uso:
 * `whenConsented(acción)` corre la acción ya, o después de que la persona acepte el aviso.
 */
export function useAiAccess() {
  const { enabled, consented } = useAiPrefs();
  const { isConnected } = useNetworkStatus();
  const [asking, setAsking] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const whenConsented = useCallback(
    (action: () => void) => {
      if (consented) return action();
      pending.current = action;
      setAsking(true);
    },
    [consented],
  );

  const accept = useCallback(() => {
    setAsking(false);
    const action = pending.current;
    pending.current = null;
    updateAiPrefs({ consented: true }).then(
      () => action?.(),
      (cause: unknown) => {
        if (__DEV__) console.warn('[ai.consent]', cause);
      },
    );
  }, []);

  const decline = useCallback(() => {
    pending.current = null;
    setAsking(false);
  }, []);

  return {
    /** El interruptor de Ajustes está encendido: los puntos de entrada se muestran. */
    visible: enabled,
    /** Hay conexión: los botones funcionan (si no, se desactivan con un mensaje). */
    online: isConnected,
    whenConsented,
    consent: { visible: asking, onAccept: accept, onDecline: decline },
  };
}
