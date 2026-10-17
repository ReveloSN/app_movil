import { useEffect } from 'react';
import { StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { durations, easings, timing } from '@/shared/theme/motion';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountUpProps {
  value: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Número que cuenta desde 0 hasta `value` en el hilo de UI (sin re-renders por cuadro). Es visual:
 * quien lo usa da el valor final al lector de pantalla. Con "Quitar animaciones" aparece ya en su valor.
 */
export function CountUp({ value, style }: CountUpProps) {
  const current = useSharedValue(0);
  useEffect(() => {
    current.set(withTiming(value, timing(durations.slow, easings.enter)));
  }, [value, current]);

  const text = useDerivedValue(() => String(Math.round(current.get())));
  const animatedProps = useAnimatedProps(() => ({ text: text.get(), defaultValue: text.get() }) as object);

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue={String(value)}
      animatedProps={animatedProps}
      style={[styles.input, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
  },
});
