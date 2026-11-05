import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { durations, easings, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  value: number;
  max: number;
  /** Texto al centro, ej. "3/8". */
  centerLabel: string;
  /** Texto hablado, ej. "3 de 8 ítems listos". */
  accessibilityLabel: string;
  /** Diámetro en dp. */
  size?: number;
  strokeWidth?: number;
}

const clampRatio = (value: number, max: number) => (max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0);

/**
 * Anillo de avance: el trazo crece con una animación corta y el número va al centro, así el avance
 * no depende solo del color. El lector de pantalla lo oye una vez, como barra de progreso.
 */
export function ProgressRing({ value, max, centerLabel, accessibilityLabel, size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = clampRatio(value, max);
  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.set(withTiming(ratio, timing(durations.slow, easings.standard)));
  }, [ratio, progress]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: Math.min(Math.max(value, 0), max), text: accessibilityLabel }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.primaryTint} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // El trazo arranca arriba (las 12) y avanza en sentido horario.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.label}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, typography }: AppTheme) =>
  StyleSheet.create({
    svg: { position: 'absolute' },
    center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    label: { ...typography.h1, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  });
