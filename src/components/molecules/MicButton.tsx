import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { hapticToggleOff, hapticToggleOn } from '@/shared/haptics/haptics';
import { durations, easings } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface MicButtonProps {
  listening: boolean;
  onPress(): void;
  /** Lectura en reposo (ej. "Dictar por voz"). */
  label: string;
  /** Lectura mientras escucha (ej. "Dejar de dictar"). */
  listeningLabel: string;
  /** Texto visible junto al botón mientras escucha (ej. "Escuchando…"): el estado no depende solo de la animación. */
  listeningText: string;
  /** Estado para lector de pantalla: "escuchando" / "detenido". */
  stateText: { listening: string; stopped: string };
  disabled?: boolean;
}

/** Botón de micrófono (≥ 48 dp) con estado visible como texto y pulso opcional (sin él si se quitan animaciones). */
export function MicButton({ listening, onPress, label, listeningLabel, listeningText, stateText, disabled = false }: MicButtonProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (listening && !reducedMotion) {
      pulse.set(withRepeat(withTiming(1, { duration: durations.slow * 3, easing: easings.standard }), -1, false));
    } else {
      cancelAnimation(pulse);
      pulse.set(0);
    }
    return () => cancelAnimation(pulse);
  }, [listening, reducedMotion, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.get()),
    transform: [{ scale: 1 + 0.5 * pulse.get() }],
  }));

  function handlePress() {
    if (listening) hapticToggleOff();
    else hapticToggleOn();
    onPress();
  }

  return (
    <View style={styles.row}>
      <View style={styles.holder}>
        {listening && !reducedMotion ? <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} /> : null}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={listening ? listeningLabel : label}
          accessibilityState={{ selected: listening, disabled }}
          accessibilityValue={{ text: listening ? stateText.listening : stateText.stopped }}
          disabled={disabled}
          onPress={handlePress}
          style={[styles.button, listening && styles.buttonActive, disabled && styles.disabled]}
        >
          <Ionicons name={listening ? 'stop' : 'mic'} size={iconSizes.md} color={listening ? colors.onPrimary : colors.primary} />
        </PressableScale>
      </View>
      {listening ? (
        <Text style={styles.listening} accessibilityLiveRegion="polite">
          {listeningText}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    holder: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      ...StyleSheet.absoluteFill,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
    },
    button: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryTint,
    },
    buttonActive: {
      backgroundColor: colors.primary,
    },
    disabled: {
      opacity: 0.5,
    },
    listening: {
      ...typography.labelMedium,
      color: colors.primary,
    },
  });
