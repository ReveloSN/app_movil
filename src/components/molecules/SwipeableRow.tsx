import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { hapticSwipeArm } from '@/shared/haptics/haptics';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { springs } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { shouldCommitSwipe, swipeThreshold } from '@/shared/utils/swipeDecision';

const TOGGLE_ACTION = 'toggle';

/**
 * Acciones de accesibilidad para marcar o desmarcar: el deslizar nunca es la única vía. Se pasan al
 * elemento accesible de la fila (el que tiene role checkbox).
 */
export function useToggleAccessibility(checked: boolean, onToggle: () => void) {
  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === TOGGLE_ACTION) onToggle();
    },
    [onToggle],
  );
  return useMemo(
    () => ({
      accessibilityActions: [{ name: TOGGLE_ACTION, label: checked ? 'Desmarcar' : 'Marcar' }],
      onAccessibilityAction,
    }),
    [checked, onAccessibilityAction],
  );
}

interface SwipeableRowProps {
  /** Si está marcada, deslizar la desmarca (el fondo muestra el ícono de deshacer). */
  checked: boolean;
  /** Radio de las esquinas de la fila, para que el fondo revelado coincida. */
  radius: number;
  onToggle(): void;
  children: ReactNode;
}

/**
 * Envuelve una fila de verificación: deslizar a la derecha la marca (o desmarca). Revela un fondo con
 * ícono, la fila vuelve con el resorte de motion.ts y el toque normal sigue funcionando. Con "Quitar
 * animaciones" el gesto sigue y la vuelta es inmediata. El scroll vertical gana si el dedo sube o baja
 * (failOffsetY) y el gesto solo se activa tras un recorrido horizontal (activeOffsetX).
 */
export function SwipeableRow({ checked, radius, onToggle, children }: SwipeableRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const dragX = useSharedValue(0);
  const width = useSharedValue(0);
  const armed = useSharedValue(false);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(14)
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
          const dx = Math.max(0, event.translationX);
          dragX.set(dx);
          const nowArmed = dx >= swipeThreshold(width.get());
          if (nowArmed !== armed.get()) {
            armed.set(nowArmed);
            if (nowArmed) scheduleOnRN(hapticSwipeArm);
          }
        })
        .onEnd((event) => {
          if (shouldCommitSwipe(event.translationX, event.velocityX, width.get())) scheduleOnRN(onToggle);
        })
        .onFinalize(() => {
          armed.set(false);
          dragX.set(reducedMotion ? 0 : withSpring(0, springs.press));
        }),
    [armed, dragX, onToggle, reducedMotion, width],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.get() }],
  }));
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.get(), [0, swipeThreshold(width.get()) || 1], [0, 1], 'clamp'),
  }));

  return (
    <View
      style={[styles.wrapper, { borderRadius: radius }]}
      onLayout={(event) => width.set(event.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.background, { borderRadius: radius }, backgroundStyle]}
      >
        <Ionicons name={checked ? 'arrow-undo' : 'checkmark'} size={iconSizes.lg} color={colors.onPrimary} />
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      overflow: 'hidden',
    },
    background: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'center',
      paddingLeft: spacing.lg,
      backgroundColor: colors.primary,
    },
  });
