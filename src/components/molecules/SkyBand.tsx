import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SkyBandProps {
  /** Degradado del cielo de la hora (arriba y abajo). */
  top: string;
  horizon: string;
  /** Texto y velo que lo hacen legible sobre ese degradado. */
  textColor: string;
  scrimColor: string;
  scrimAlpha: number;
  /** Ej. "Sábado, 17 de octubre". */
  date: string;
  /** Ej. "Buenas tardes, Ana". */
  greeting: string;
}

/** Banda superior de Inicio: el cielo de la hora con la fecha y el saludo. */
export function SkyBand({ top, horizon, textColor, scrimColor, scrimAlpha, date, greeting }: SkyBandProps) {
  const styles = useThemedStyles(createStyles);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={styles.band} onLayout={onLayout}>
      <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height} pointerEvents="none">
        <Defs>
          <LinearGradient id="home-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={horizon} />
          </LinearGradient>
        </Defs>
        <Rect width={size.width} height={size.height} fill="url(#home-sky)" />
        <Rect width={size.width} height={size.height} fill={scrimColor} opacity={scrimAlpha} />
      </Svg>
      <Text style={[styles.date, { color: textColor }]}>{date}</Text>
      {/* 03-1 */}
      <Text style={[styles.greeting, { color: textColor }]} accessibilityRole="header">
        {greeting}
      </Text>
    </View>
  );
}

const createStyles = ({ radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    band: {
      gap: spacing.xs,
      padding: spacing.xl,
      borderRadius: radii.xxl,
      overflow: 'hidden',
    },
    date: {
      ...typography.labelMedium,
    },
    greeting: {
      ...typography.h2,
    },
  });
