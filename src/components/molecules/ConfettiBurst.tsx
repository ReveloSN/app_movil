import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { durations, easings, timing } from '@/shared/theme/motion';
import { useAppTheme } from '@/shared/theme/useAppTheme';

export const CONFETTI_COUNT = 24;
const GRAVITY = 140;
const FLIGHT_MS = durations.slow * 3;

interface Particle {
  /** Dirección de salida (rad) y alcance (dp). */
  angle: number;
  distance: number;
  /** Giro final (grados) y lado de la pieza (dp). */
  spin: number;
  side: number;
  colorIndex: number;
}

/** Partículas deterministas (sin Math.random): mismo estallido en cada render y fácil de probar. */
export function confettiParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const unit = (index * 0.618033988749895) % 1; // reparto uniforme sin repetirse
    return {
      angle: -Math.PI * (0.1 + 0.8 * unit), // abanico hacia arriba
      distance: 90 + ((index * 37) % 7) * 18,
      spin: ((index % 2 === 0 ? 1 : -1) * (180 + ((index * 53) % 5) * 90)),
      side: 8 + (index % 3) * 3,
      colorIndex: index,
    };
  });
}

function Piece({ particle, color, progress }: { particle: Particle; color: string; progress: { get(): number } }) {
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      // Sale rápido y cae con la gravedad; se desvanece al final. Solo transform y opacity.
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [
        { translateX: Math.cos(particle.angle) * particle.distance * p },
        { translateY: Math.sin(particle.angle) * particle.distance * p + GRAVITY * p * p },
        { rotate: `${particle.spin * p}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: particle.side, height: particle.side, backgroundColor: color }, style]} />;
}

/**
 * Estallido de confeti desde el centro del contenedor (~24 piezas, un solo valor animado en el hilo de UI).
 * Con "Quitar animaciones" no se dibuja nada. Es decorativo y no recibe toques.
 */
export function ConfettiBurst() {
  const reducedMotion = useReducedMotion();
  const { colors } = useAppTheme();
  const particles = useMemo(() => confettiParticles(CONFETTI_COUNT), []);
  const palette = [colors.primary, colors.categoryAmber, colors.categoryBlue, colors.categoryPurple, colors.categoryGreen];
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    progress.set(withTiming(1, timing(FLIGHT_MS, easings.enter)));
  }, [reducedMotion, progress]);

  if (reducedMotion) return null;
  return (
    <View
      style={styles.layer}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="confetti-burst"
    >
      {particles.map((particle) => (
        <Piece key={particle.colorIndex} particle={particle} color={palette[particle.colorIndex % palette.length]} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
