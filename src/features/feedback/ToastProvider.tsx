import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Toast } from '@/components/molecules/Toast';
import { durations, easings, offsets, springs, timing } from '@/shared/theme/motion';
import { spacing } from '@/shared/theme/tokens';

import { ToastContext } from './toast.context';
import { toastDuration } from './toast.timing';
import type { ToastContextValue, ToastOptions } from './toast.types';
import { useToastBottomOffset } from './useToastBottomOffset';

// Deslizar de lado más de esto (o rápido) descarta el aviso.
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 0.5;
const SWIPE_OUT = 420;

interface ShownToast extends Required<Pick<ToastOptions, 'message' | 'tone'>> {
  action?: ToastOptions['action'];
  /** Cambia en cada show: reinicia el temporizador aunque el texto se repita. */
  id: number;
}

/**
 * Avisos breves globales (montado en la raíz: sobrevive a la navegación). Uno a la vez; se oculta solo
 * o deslizándolo de lado. Anima en el hilo de UI (Reanimated) y sigue "Quitar animaciones" del sistema.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ShownToast | null>(null);
  const nextId = useRef(0);
  // Mientras se arrastra, el aviso no se va solo.
  const [dragging, setDragging] = useState(false);
  const progress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const bottom = useToastBottomOffset();

  const remove = useCallback((id: number) => {
    // Solo quita el aviso que terminó de salir (no uno nuevo que llegó mientras tanto).
    setToast((current) => (current?.id === id ? null : current));
  }, []);

  const hideToast = useCallback(
    (id: number) => {
      progress.set(
        withTiming(0, timing(durations.fast, easings.exit), (finished) => {
          if (finished) scheduleOnRN(remove, id);
        }),
      );
    },
    [progress, remove],
  );

  const show = useCallback(
    (input: string | ToastOptions) => {
      const options = typeof input === 'string' ? { message: input } : input;
      dragX.set(0);
      setToast({ message: options.message, tone: options.tone ?? 'success', action: options.action, id: ++nextId.current });
    },
    [dragX],
  );

  const currentId = toast?.id;
  const hide = useCallback(() => {
    if (currentId !== undefined) hideToast(currentId);
  }, [currentId, hideToast]);

  // Entra al aparecer (o al cambiar de aviso).
  useEffect(() => {
    if (currentId !== undefined) progress.set(withTiming(1, timing(durations.base, easings.enter)));
  }, [currentId, progress]);

  // Se va solo al cumplir su tiempo (el plazo vuelve a empezar si se soltó sin descartarlo).
  const hasAction = Boolean(toast?.action);
  useEffect(() => {
    if (currentId === undefined || dragging) return;
    const timer = setTimeout(() => hideToast(currentId), toastDuration(hasAction));
    return () => clearTimeout(timer);
  }, [currentId, hasAction, dragging, hideToast]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy),
        onPanResponderGrant: () => setDragging(true),
        onPanResponderMove: (_, { dx }) => {
          dragX.set(dx);
        },
        onPanResponderRelease: (_, { dx, vx }) => {
          setDragging(false);
          if (currentId !== undefined && (Math.abs(dx) > SWIPE_DISTANCE || Math.abs(vx) > SWIPE_VELOCITY)) {
            dragX.set(withTiming(Math.sign(dx || vx) * SWIPE_OUT, timing(durations.fast, easings.exit)));
            hideToast(currentId);
          } else {
            dragX.set(withSpring(0, springs.press));
          }
        },
      }),
    [currentId, dragX, hideToast],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * (1 - Math.min(Math.abs(dragX.get()) / SWIPE_OUT, 1)),
    transform: [{ translateY: (1 - progress.get()) * offsets.toast }, { translateX: dragX.get() }],
  }));

  const value = useMemo<ToastContextValue>(() => ({ show, hide }), [show, hide]);

  const runAction = () => {
    toast?.action?.onPress();
    hide();
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.layer, { bottom }]}>
          <Animated.View style={animatedStyle} {...panResponder.panHandlers}>
            <Toast message={toast.message} tone={toast.tone} actionLabel={toast.action?.label} onAction={runAction} />
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
