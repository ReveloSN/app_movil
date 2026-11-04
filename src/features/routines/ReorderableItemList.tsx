import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { hapticReorderDrop, hapticReorderPick, hapticReorderStep } from '@/shared/haptics/haptics';
import { durations, listItemEntering, listItemExiting, listLayout, springs, timing } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { criticalGroupRange } from './item-order';
import * as copy from './routine.copy';

/** Ms de pulsación sobre el asa antes de levantar la fila (así el scroll vertical sigue libre). */
const LONG_PRESS_MS = 200;
const LIFT_SCALE = 1.03;

interface DragState {
  /** Índice de la fila levantada (-1: ninguna). */
  active: SharedValue<number>;
  /** Índice donde quedaría si se soltara ahora. */
  over: SharedValue<number>;
  dragY: SharedValue<number>;
  /** Posición y alto de cada fila (medidos), en el espacio de la lista. */
  tops: SharedValue<number[]>;
  heights: SharedValue<number[]>;
}

interface Entry {
  key: string;
  label: string;
  critical: boolean;
}

interface ReorderableItemListProps<T extends Entry> {
  /** En el orden en que se ven (críticos arriba). */
  items: readonly T[];
  /** Separación entre filas (dp), la misma del estilo de la lista. */
  gap: number;
  renderRow(item: T, index: number, handle: ReactNode): ReactNode;
  /** Lleva el ítem a `toIndex`. Se llama una sola vez al soltar (o al tocar Subir/Bajar). */
  onMove(key: string, toIndex: number): void;
}

/**
 * Lista con reordenamiento: se mantiene pulsada el asa y se arrastra (la fila se levanta con sombra y
 * escala, las demás se apartan). El arrastre nunca es la única vía: tocar el asa muestra "Subir" y
 * "Bajar" (≥ 48 dp) y el asa expone las mismas acciones a los lectores de pantalla. Un ítem solo se mueve
 * dentro de su grupo (críticos / no críticos), porque la lista siempre muestra los críticos arriba.
 */
export function ReorderableItemList<T extends Entry>({ items, gap, renderRow, onMove }: ReorderableItemListProps<T>) {
  const active = useSharedValue(-1);
  const over = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const tops = useSharedValue<number[]>([]);
  const heights = useSharedValue<number[]>([]);
  const drag = useMemo<DragState>(() => ({ active, over, dragY, tops, heights }), [active, over, dragY, tops, heights]);
  // Al soltar, las filas cambian de sitio de golpe: sin transición de layout para que no salten.
  const [settling, setSettling] = useState(false);

  const order = items.map((item) => item.key).join('|');
  useLayoutEffect(() => {
    // El nuevo orden ya está pintado: se quitan los desplazamientos temporales.
    active.set(-1);
    over.set(-1);
    dragY.set(0);
  }, [order, active, over, dragY]);
  // Con el nuevo orden ya pintado, las transiciones de layout vuelven (añadir y quitar siguen animando).
  useEffect(() => {
    const timer = setTimeout(() => setSettling(false), 0);
    return () => clearTimeout(timer);
  }, [order]);

  function measure(index: number, y: number, height: number) {
    const nextTops = tops.get().slice();
    nextTops[index] = y;
    tops.set(nextTops);
    const nextHeights = heights.get().slice();
    nextHeights[index] = height;
    heights.set(nextHeights);
  }

  function drop(index: number, target: number) {
    hapticReorderDrop();
    if (target === index) {
      active.set(-1);
      over.set(-1);
      dragY.set(0);
      return;
    }
    setSettling(true);
    onMove(items[index].key, target);
    AccessibilityInfo.announceForAccessibility(copy.itemMovedMessage(items[index].label, target + 1, items.length));
  }

  function step(index: number, target: number) {
    if (target === index) return;
    onMove(items[index].key, target);
    AccessibilityInfo.announceForAccessibility(copy.itemMovedMessage(items[index].label, target + 1, items.length));
  }

  return (
    <View style={{ gap }}>
      {items.map((item, index) => (
        <ReorderableRow
          key={item.key}
          item={item}
          index={index}
          count={items.length}
          range={criticalGroupRange(items, index)}
          gap={gap}
          drag={drag}
          settling={settling}
          onMeasure={measure}
          onDrop={drop}
          onStep={step}
          renderRow={(handle) => renderRow(item, index, handle)}
        />
      ))}
    </View>
  );
}

interface ReorderableRowProps {
  item: Entry;
  index: number;
  count: number;
  range: [number, number];
  gap: number;
  drag: DragState;
  settling: boolean;
  onMeasure(index: number, y: number, height: number): void;
  onDrop(index: number, target: number): void;
  onStep(index: number, target: number): void;
  renderRow(handle: ReactNode): ReactNode;
}

function ReorderableRow({
  item,
  index,
  count,
  range,
  gap,
  drag,
  settling,
  onMeasure,
  onDrop,
  onStep,
  renderRow,
}: ReorderableRowProps) {
  const { colors, radii } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [barOpen, setBarOpen] = useState(false);
  const [first, last] = range;
  const canMoveUp = index > first;
  const canMoveDown = index < last;
  const { active, over, dragY, tops, heights } = drag;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          active.set(index);
          over.set(index);
          dragY.set(0);
          scheduleOnRN(hapticReorderPick);
        })
        .onUpdate((event) => {
          const rowTops = tops.get();
          const rowHeights = heights.get();
          if (rowTops[index] === undefined || rowTops[first] === undefined || rowTops[last] === undefined) return;
          // La fila no sale de su grupo.
          const minY = rowTops[first] - rowTops[index];
          const maxY = rowTops[last] + rowHeights[last] - rowHeights[index] - rowTops[index];
          const y = Math.min(Math.max(event.translationY, minY), maxY);
          dragY.set(y);
          const center = rowTops[index] + y + rowHeights[index] / 2;
          let target = first;
          for (let j = first; j <= last; j += 1) {
            if (center >= rowTops[j]) target = j;
          }
          if (target !== over.get()) {
            over.set(target);
            scheduleOnRN(hapticReorderStep);
          }
        })
        .onEnd(() => {
          const rowTops = tops.get();
          const rowHeights = heights.get();
          const target = over.get();
          const slotTop = target > index ? rowTops[target] + rowHeights[target] - rowHeights[index] : rowTops[target];
          const delta = rowTops[index] === undefined || slotTop === undefined ? 0 : slotTop - rowTops[index];
          dragY.set(
            withSpring(delta, springs.press, (finished) => {
              if (finished) scheduleOnRN(onDrop, index, target);
            }),
          );
        })
        .onFinalize((_event, success) => {
          if (success) return;
          // Cancelado (ej. el sistema se quedó con el toque): la fila vuelve a su sitio.
          active.set(-1);
          over.set(-1);
          dragY.set(withSpring(0, springs.press));
        }),
    [active, dragY, first, heights, index, last, onDrop, over, tops],
  );

  const outerStyle = useAnimatedStyle(() => ({ zIndex: active.get() === index ? 10 : 0 }));
  const liftStyle = useAnimatedStyle(() => {
    const current = active.get();
    if (current === index) {
      return {
        transform: [{ translateY: dragY.get() }, { scale: withTiming(LIFT_SCALE, timing(durations.press)) }],
        shadowOpacity: 0.25,
        elevation: 8,
      };
    }
    let shift = 0;
    if (current >= 0) {
      const target = over.get();
      const size = (heights.get()[current] ?? 0) + gap;
      if (current < target && index > current && index <= target) shift = -size;
      else if (current > target && index < current && index >= target) shift = size;
    }
    return {
      transform: [{ translateY: withTiming(shift, timing(durations.fast)) }, { scale: 1 }],
      shadowOpacity: 0,
      elevation: 0,
    };
  });

  function onAccessibilityAction(event: AccessibilityActionEvent) {
    const name = event.nativeEvent.actionName;
    if (name === 'moveUp' && canMoveUp) onStep(index, index - 1);
    if (name === 'moveDown' && canMoveDown) onStep(index, index + 1);
  }

  const handle = count > 1 && (
    <GestureDetector gesture={pan}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.reorderHandleLabel(item.label)}
        accessibilityHint={copy.REORDER_HANDLE_HINT}
        accessibilityState={{ expanded: barOpen }}
        accessibilityActions={[
          ...(canMoveUp ? [{ name: 'moveUp', label: copy.MOVE_UP_LABEL }] : []),
          ...(canMoveDown ? [{ name: 'moveDown', label: copy.MOVE_DOWN_LABEL }] : []),
        ]}
        onAccessibilityAction={onAccessibilityAction}
        onPress={() => setBarOpen((open) => !open)}
        style={styles.handle}
      >
        <Ionicons name="reorder-three" size={28} color={colors.textMuted} />
      </Pressable>
    </GestureDetector>
  );

  return (
    <Animated.View
      entering={listItemEntering}
      exiting={listItemExiting}
      layout={settling ? undefined : listLayout}
      style={outerStyle}
      onLayout={(event) => onMeasure(index, event.nativeEvent.layout.y, event.nativeEvent.layout.height)}
    >
      <Animated.View style={[styles.lift, { borderRadius: radii.xxl }, liftStyle]}>
        {renderRow(handle || null)}
        {barOpen && count > 1 ? (
          <View style={styles.bar}>
            <View style={styles.barButton}>
              <SecondaryButton
                icon="arrow-up"
                label={copy.MOVE_UP_LABEL}
                accessibilityLabel={`${copy.MOVE_UP_LABEL} «${item.label}»`}
                disabled={!canMoveUp}
                onPress={() => onStep(index, index - 1)}
              />
            </View>
            <View style={styles.barButton}>
              <SecondaryButton
                icon="arrow-down"
                label={copy.MOVE_DOWN_LABEL}
                accessibilityLabel={`${copy.MOVE_DOWN_LABEL} «${item.label}»`}
                disabled={!canMoveDown}
                onPress={() => onStep(index, index + 1)}
              />
            </View>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = ({ colors, spacing, sizes }: AppTheme) =>
  StyleSheet.create({
    // Fondo y sombra: la fila levantada proyecta sombra (en Android la da elevation, que necesita fondo).
    lift: {
      backgroundColor: colors.card,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
    },
    handle: {
      width: sizes.secondaryRowHeight,
      minHeight: sizes.checklistRowHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bar: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    barButton: {
      flex: 1,
    },
  });
