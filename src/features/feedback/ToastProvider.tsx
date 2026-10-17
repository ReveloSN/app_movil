import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Toast } from '@/components/molecules/Toast';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { spacing } from '@/shared/theme/tokens';

import { ToastContext } from './toast.context';
import { toastDuration } from './toast.timing';
import type { ToastContextValue, ToastOptions } from './toast.types';
import { useToastBottomOffset } from './useToastBottomOffset';

const ENTER_MS = 200;
const EXIT_MS = 160;
const OFFSET_Y = 16;

interface ShownToast extends Required<Pick<ToastOptions, 'message' | 'tone'>> {
  action?: ToastOptions['action'];
  /** Cambia en cada show: reinicia el temporizador aunque el texto se repita. */
  id: number;
}

/**
 * Avisos breves globales (montado en la raíz: sobrevive a la navegación). Uno a la vez; se oculta solo.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ShownToast | null>(null);
  const nextId = useRef(0);
  // Valor animado estable (useState, no useRef: se lee al dibujar).
  const [progress] = useState(() => new Animated.Value(0));
  const translateY = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [OFFSET_Y, 0] }), [progress]);
  const reducedMotion = useReducedMotion();
  const bottom = useToastBottomOffset();

  const hide = useCallback(() => {
    if (reducedMotion) {
      progress.setValue(0);
      setToast(null);
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: EXIT_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setToast(null);
      },
    );
  }, [progress, reducedMotion]);

  const show = useCallback((input: string | ToastOptions) => {
    const options = typeof input === 'string' ? { message: input } : input;
    setToast({ message: options.message, tone: options.tone ?? 'success', action: options.action, id: ++nextId.current });
  }, []);

  // Entra al aparecer (o al cambiar de aviso) y se va solo al cumplir su tiempo.
  useEffect(() => {
    if (!toast) return;
    progress.stopAnimation();
    if (reducedMotion) progress.setValue(1);
    else Animated.timing(progress, { toValue: 1, duration: ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const timer = setTimeout(hide, toastDuration(Boolean(toast.action)));
    return () => clearTimeout(timer);
  }, [toast, progress, reducedMotion, hide]);

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
          <Animated.View
            style={{
              opacity: progress,
              transform: [{ translateY }],
            }}
          >
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
