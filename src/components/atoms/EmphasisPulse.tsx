import { useEffect, useRef, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { durations, easings, springs, timing } from '@/shared/theme/motion';

interface EmphasisPulseProps {
  /** Al pasar de false a true, el contenido late una vez. */
  active: boolean;
  children: ReactNode;
}

/** Énfasis único y sutil (ej. "Listo" cuando todo está marcado). No bloquea el toque. */
export function EmphasisPulse({ active, children }: EmphasisPulseProps) {
  const scale = useSharedValue(1);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      scale.set(withSequence(withTiming(1.04, timing(durations.fast, easings.enter)), withSpring(1, springs.gentle)));
    }
    wasActive.current = active;
  }, [active, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
