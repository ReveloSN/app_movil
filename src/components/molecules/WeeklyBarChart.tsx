import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { springs, staggerDelay } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Altura mínima (dp) de una barra con valor 0: una marca fina que indica "cero" sin parecer dato. */
const MIN_MARK = 2;
/** Opacidad de la barra según su estado: resaltada (hoy) > normal > futuro (muted). */
const FILL_OPACITY = { highlighted: 1, regular: 0.55, muted: 0.25 } as const;

export interface WeeklyBarDatum {
  key: string;
  /** Etiqueta corta bajo la barra, ej. "L", "M". */
  label: string;
  value: number;
  /** Texto hablado de la barra, ej. "lunes, 2 salidas completadas". */
  a11yLabel: string;
  /** Día de hoy: barra y etiqueta destacadas. */
  highlighted?: boolean;
  /** Día futuro: barra tenue y sin número. */
  muted?: boolean;
}

interface WeeklyBarChartProps {
  data: WeeklyBarDatum[];
  /** Valor que llena la barra más alta. Por defecto, el mayor de los datos (mínimo 1). */
  maxValue?: number;
  /** Alto del área de barras en dp. */
  height?: number;
  /** Resumen hablado de todo el gráfico, ej. "Salidas de esta semana: 9 de 14". */
  summaryLabel: string;
}

interface BarProps {
  index: number;
  slot: number;
  chartHeight: number;
  barWidth: number;
  radius: number;
  /** Altura final en dp. */
  target: number;
  fill: string;
  fillOpacity: number;
  reduced: boolean;
}

/**
 * Barra que crece desde 0 con un resorte suave y un retraso escalonado por posición. Con "Quitar
 * animaciones" aparece ya en su altura. Solo se anima la altura en el hilo de UI.
 */
function Bar({ index, slot, chartHeight, barWidth, radius, target, fill, fillOpacity, reduced }: BarProps) {
  const grow = useSharedValue(reduced ? target : 0);

  useEffect(() => {
    grow.set(reduced ? target : withDelay(staggerDelay(index), withSpring(target, springs.gentle)));
  }, [target, reduced, index, grow]);

  const animatedProps = useAnimatedProps(() => {
    const height = Math.max(grow.get(), 0);
    return { y: chartHeight - height, height };
  });

  return (
    <Svg width={slot} height={chartHeight}>
      <AnimatedRect
        x={(slot - barWidth) / 2}
        width={barWidth}
        rx={radius}
        fill={fill}
        fillOpacity={fillOpacity}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

const clampRatio = (value: number, top: number) => {
  if (!Number.isFinite(value) || top <= 0) return 0;
  return Math.min(Math.max(value / top, 0), 1);
};

/**
 * Gráfico de barras de la semana (7 días típicos). Cada barra es un grupo accesible con su texto
 * hablado; el valor numérico va escrito sobre la barra, así no se transmite nada solo por color.
 * La fila de números se anuncia con `summaryLabel` y va antes de las barras en el orden de lectura.
 */
export function WeeklyBarChart({ data, maxValue, height = 120, summaryLabel }: WeeklyBarChartProps) {
  const { colors, radii } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);

  const top = maxValue !== undefined && maxValue > 0 ? maxValue : Math.max(1, ...data.map((d) => d.value));
  const slot = data.length > 0 ? width / data.length : 0;
  const barWidth = Math.min(Math.max(slot * 0.6, 6), 32);
  const radius = Math.min(radii.xs, barWidth / 2);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.root}>
      {/* El resumen va en la fila de números, no en el contenedor: un contenedor `accessible` agrupa a sus
          hijos y TalkBack podría no llegar a cada barra. Así se lee primero el resumen y luego cada día. */}
      <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={summaryLabel}>
        {data.map((d) => (
          <View key={d.key} style={styles.column}>
            {d.muted ? null : <Text style={[styles.value, d.highlighted && styles.valueToday]}>{String(d.value)}</Text>}
          </View>
        ))}
      </View>

      <View style={styles.row} onLayout={onLayout}>
        {data.map((d, index) => (
          <View key={d.key} accessible accessibilityLabel={d.a11yLabel} style={{ width: slot, height }}>
            <Bar
              index={index}
              slot={slot}
              chartHeight={height}
              barWidth={barWidth}
              radius={radius}
              target={Math.max(clampRatio(d.value, top) * height, MIN_MARK)}
              fill={colors.primary}
              fillOpacity={d.muted ? FILL_OPACITY.muted : d.highlighted ? FILL_OPACITY.highlighted : FILL_OPACITY.regular}
              reduced={reduced}
            />
          </View>
        ))}
      </View>

      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {data.map((d) => (
          <View key={d.key} style={styles.column}>
            <Text style={[styles.label, d.highlighted && styles.labelToday]}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    root: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
    },
    column: {
      flex: 1,
      alignItems: 'center',
    },
    value: {
      ...typography.caption,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    valueToday: {
      color: colors.textPrimary,
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
    },
    labelToday: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
  });
