import { useEffect, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, easings, timing } from '@/shared/theme/motion';
import { type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface AnimatedCounterProps {
  /** Valor final; la cuenta sale de 0 al montar y del valor anterior cuando cambia. */
  value: number;
  /** Cómo se escribe cada número, ej. `(n) => \`${n} %\``. Por defecto, entero sin formato. */
  format?: (n: number) => string;
  /** Duración de la cuenta en ms. */
  duration?: number;
  style?: StyleProp<TextStyle>;
  /** Texto para el lector de pantalla. Por defecto, el valor final ya formateado. */
  accessibilityLabel?: string;
}

const defaultFormat = (n: number) => String(Math.round(n));

/**
 * Número que cuenta hasta `value`. La animación corre en el hilo de UI; solo se re-renderiza al cambiar
 * el entero que se muestra, para poder usar `format` (que es JS). El lector de pantalla oye siempre el
 * valor final, nunca los números intermedios. Con "Quitar animaciones" muestra el valor final directo.
 */
export function AnimatedCounter({
  value,
  format = defaultFormat,
  duration = durations.slow,
  style,
  accessibilityLabel,
}: AnimatedCounterProps) {
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const current = useSharedValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) {
      current.set(value);
      return;
    }
    // Arranca desde lo que se estaba mostrando (0 al montar, el valor anterior si cambió).
    current.set(
      withTiming(value, timing(duration, easings.enter), (finished) => {
        // Al terminar, el valor exacto (puede no ser entero) para que coincida con el final.
        if (finished) scheduleOnRN(setShown, value);
      }),
    );
  }, [value, duration, reduced, current]);

  useAnimatedReaction(
    () => Math.round(current.get()),
    (rounded, previous) => {
      if (rounded !== previous) scheduleOnRN(setShown, rounded);
    },
  );

  const finalText = format(value);
  return (
    <Text
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? finalText}
      style={[styles.text, style]}
    >
      {reduced ? finalText : format(shown)}
    </Text>
  );
}

const createStyles = ({ colors, typography }: AppTheme) =>
  StyleSheet.create({
    text: {
      ...typography.h1,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
  });
