import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { IMAGE_ANCHORS, type BubbleKind } from './sceneImages';

const BUBBLE = 40;

function BubbleIcon({ kind, color }: { kind: BubbleKind; color: string }) {
  if (kind === 'key') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Circle cx={8.1} cy={9} r={4.1} stroke={color} strokeWidth={2.3} fill="none" />
        <Path d="M11.3 12.2 20 20M16 16.1l2.3-2.3M17.8 17.9l2.1-2.1" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      </Svg>
    );
  }
  if (kind === 'shield') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 2 20 5v6c0 5.1-3.4 8.5-8 11-4.6-2.5-8-5.9-8-11V5l8-3Z" fill={color} />
        <Path d="m9 12 2 2 4.5-4.5" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Rect x={5} y={10} width={14} height={11} rx={2.3} fill={color} />
      <Path d="M8 10V7a4 4 0 1 1 8 0v3" stroke={color} strokeWidth={2.2} fill="none" />
      <Circle cx={12} cy={15} r={1.5} fill="#FFFFFF" />
    </Svg>
  );
}

function Bubble({ kind, x, y, index, floating, color }: {
  kind: BubbleKind;
  x: number;
  y: number;
  index: number;
  floating: boolean;
  color: string;
}) {
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!floating) {
      cancelAnimation(bob);
      bob.set(withTiming(0.5, { duration: 300 }));
      return;
    }
    // Cada burbuja con su ritmo para que no floten al unísono.
    const duration = 1900 + index * 330;
    bob.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(bob);
  }, [floating, index, bob]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -2 + 5 * bob.get() }, { translateY: 4 - 9 * bob.get() }],
  }));

  return (
    <Animated.View style={[styles.bubble, { left: x - BUBBLE / 2, top: y - BUBBLE / 2 }, style]} pointerEvents="none">
      <BubbleIcon kind={kind} color={color} />
    </Animated.View>
  );
}

interface FloatingBubblesProps {
  toScene(u: number, v: number): { x: number; y: number };
  floating: boolean;
  night: boolean;
}

/** Llave, candado y escudo flotando junto a la casa (anclados a la imagen: se acercan con ella). */
export function FloatingBubbles({ toScene, floating, night }: FloatingBubblesProps) {
  const color = night ? '#235896' : '#076F76';
  return (
    <>
      {IMAGE_ANCHORS.bubbles.map(({ kind, x, y }, index) => {
        const point = toScene(x, y);
        return <Bubble key={kind} kind={kind} x={point.x} y={point.y} index={index} floating={floating} color={color} />;
      })}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    elevation: 5,
    shadowColor: '#164879',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
});
