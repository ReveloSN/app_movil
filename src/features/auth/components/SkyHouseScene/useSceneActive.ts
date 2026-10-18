import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Al arrancar el estado puede ser "unknown": solo se pausa si la app está en segundo plano de verdad.
const isForeground = (state: AppStateStatus) => state !== 'background' && state !== 'inactive';

/** true mientras la pantalla tiene el foco y la app está en primer plano: si no, la escena se pausa. */
export function useSceneActive(): boolean {
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(() => isForeground(AppState.currentState));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(isForeground(state)));
    return () => subscription.remove();
  }, []);

  return focused && foreground;
}
