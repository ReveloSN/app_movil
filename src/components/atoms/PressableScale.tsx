import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, pressFeedback, springs, timing } from '@/shared/theme/motion';

interface PressableScaleProps extends PressableProps {
  /** Estilo del contenedor animado (ej. flex: 1 dentro de una fila). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Pressable con retroalimentación al presionar: se encoge un poco y baja la opacidad (en el hilo de UI).
 * Nunca retrasa el toque: onPress se dispara como en un Pressable normal. Con "Quitar animaciones",
 * solo cambia la opacidad, al instante.
 */
export function PressableScale({ containerStyle, onPressIn, onPressOut, disabled, ...props }: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - (1 - pressFeedback.opacity) * pressed.value,
    transform: [{ scale: reducedMotion ? 1 : 1 - (1 - pressFeedback.scale) * pressed.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    pressed.value = withTiming(1, timing(durations.press));
    onPressIn?.(event);
  };
  const handlePressOut = (event: GestureResponderEvent) => {
    pressed.value = withSpring(0, springs.press);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[containerStyle, disabled ? null : animatedStyle]}>
      <Pressable {...props} disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} />
    </Animated.View>
  );
}
