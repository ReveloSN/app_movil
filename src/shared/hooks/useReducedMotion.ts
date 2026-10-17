import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true si la persona activó "Quitar animaciones" en el sistema: las animaciones pasan a ser instantáneas. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (active) setReduced(enabled);
      },
      () => undefined,
    );
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
