import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, easings, timing } from '@/shared/theme/motion';
import { useAppTheme } from '@/shared/theme/useAppTheme';

/** sin rutinas (lista con un "+"), sin resultados (lupa) o todo al día (check con destellos). */
export type EmptyIllustrationKind = 'noRoutines' | 'noResults' | 'allDone';

interface EmptyIllustrationProps {
  kind: EmptyIllustrationKind;
  size?: number;
}

const VIEW = 160;
/** Subida y bajada del flotado (dp) y respiración (escala): lo justo para sentirla viva. */
const FLOAT = 4;
const BREATHE = 1.03;

/**
 * Ilustración propia de los estados vacíos, dibujada con react-native-svg y solo con tokens de tema.
 * Flota y respira despacio; con "Quitar animaciones" queda quieta. Es decorativa: el lector de pantalla
 * la salta y lee el título y el texto.
 */
export function EmptyIllustration({ kind, size = 160 }: EmptyIllustrationProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(phase);
      phase.set(0);
      return;
    }
    phase.set(withRepeat(withTiming(1, timing(durations.slow * 5, easings.standard)), -1, true));
    return () => cancelAnimation(phase);
  }, [phase, reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (phase.get() - 0.5) * 2 * -FLOAT }, { scale: 1 + (BREATHE - 1) * phase.get() }],
  }));

  return (
    <Animated.View
      testID="empty-illustration"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Circle cx={80} cy={80} r={70} fill={colors.primaryTint} />
        {kind === 'noRoutines' ? (
          <>
            <Rect x={46} y={34} width={68} height={88} rx={12} fill={colors.card} stroke={colors.border} strokeWidth={2} />
            <Rect x={66} y={27} width={28} height={14} rx={7} fill={colors.primary} />
            {[56, 74, 92].map((y) => (
              <Rect key={y} x={57} y={y} width={12} height={12} rx={4} fill="none" stroke={colors.primary} strokeWidth={2} />
            ))}
            {[58, 76, 94].map((y) => (
              <Rect key={y} x={77} y={y} width={28} height={8} rx={4} fill={colors.border} />
            ))}
            <Circle cx={116} cy={116} r={17} fill={colors.primary} stroke={colors.card} strokeWidth={3} />
            <Line x1={116} y1={108} x2={116} y2={124} stroke={colors.onPrimary} strokeWidth={3.5} strokeLinecap="round" />
            <Line x1={108} y1={116} x2={124} y2={116} stroke={colors.onPrimary} strokeWidth={3.5} strokeLinecap="round" />
          </>
        ) : null}
        {kind === 'noResults' ? (
          <>
            <Rect x={36} y={38} width={66} height={84} rx={12} fill={colors.card} stroke={colors.border} strokeWidth={2} />
            {[54, 72, 90].map((y) => (
              <Rect key={y} x={48} y={y} width={42} height={8} rx={4} fill={colors.border} />
            ))}
            <Line x1={104} y1={104} x2={128} y2={128} stroke={colors.primary} strokeWidth={9} strokeLinecap="round" />
            <Circle cx={92} cy={92} r={28} fill={colors.accentSurface} fillOpacity={0.9} stroke={colors.primary} strokeWidth={7} />
            <Path d="M80 94 Q92 84 104 94" fill="none" stroke={colors.textMuted} strokeWidth={3.5} strokeLinecap="round" />
          </>
        ) : null}
        {kind === 'allDone' ? (
          <>
            <Circle cx={80} cy={84} r={44} fill={colors.card} stroke={colors.border} strokeWidth={2} />
            <Path d="M60 86 L75 101 L102 68" fill="none" stroke={colors.primary} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={36} cy={42} r={5} fill={colors.categoryAmber} />
            <Circle cx={128} cy={36} r={4} fill={colors.categoryAmber} />
            <Circle cx={130} cy={124} r={6} fill={colors.primary} fillOpacity={0.45} />
            <Line x1={30} y1={110} x2={30} y2={122} stroke={colors.categoryAmber} strokeWidth={3} strokeLinecap="round" />
            <Line x1={24} y1={116} x2={36} y2={116} stroke={colors.categoryAmber} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
  },
});
