import { useEffect, useMemo, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { durations, easings, springs, timing } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

// Arrastrar hacia abajo más de esto (o rápido) cierra la hoja.
const DRAG_CLOSE_DISTANCE = 96;
const DRAG_CLOSE_VELOCITY = 0.8;
const OFFSCREEN = 800;

interface BottomSheetProps {
  visible?: boolean;
  /** Atrás de Android, toque en el fondo o arrastre: la pantalla decide si cierra (ej. DC-03). */
  onRequestClose(): void;
  /**
   * true si cerrar no necesita preguntar: al arrastrar, la hoja sale de la pantalla antes de cerrarse.
   * false (ej. con cambios sin guardar): vuelve a su sitio y se llama a onRequestClose para preguntar.
   */
  dismissible?: boolean;
  /** Texto del fondo tocable para lector de pantalla (ej. "Cerrar"). Sin él, el fondo no cierra. */
  closeLabel?: string;
  header?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hoja inferior (P05, detalle de registro, aviso de IA): el fondo se atenúa, la hoja sube desde abajo y
 * se puede cerrar arrastrándola desde su asa o su encabezado. Sigue "Quitar animaciones".
 *
 * La entrada la mueve un solo valor (`dragY`) que arranca fuera de pantalla: con `entering` de Reanimated
 * dentro de un Modal, Android dibujaba la hoja un instante en su sitio y luego la bajaba para subirla.
 */
export function BottomSheet({
  visible = true,
  onRequestClose,
  dismissible = true,
  closeLabel,
  header,
  children,
  style,
}: BottomSheetProps) {
  const styles = useThemedStyles(createStyles);
  // Arranca fuera de pantalla: el primer cuadro nunca muestra la hoja en su sitio final.
  const dragY = useSharedValue(OFFSCREEN);

  useEffect(() => {
    if (!visible) return;
    dragY.set(withTiming(0, timing(durations.slow, easings.enter)));
    // Al cerrar (o desmontar) vuelve abajo: la próxima apertura no hereda un arrastre anterior.
    return () => dragY.set(OFFSCREEN);
  }, [visible, dragY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 6 && Math.abs(dy) > Math.abs(dx),
        onPanResponderMove: (_, { dy }) => {
          dragY.set(Math.max(0, dy));
        },
        onPanResponderRelease: (_, { dy, vy }) => {
          const wantsClose = dy > DRAG_CLOSE_DISTANCE || vy > DRAG_CLOSE_VELOCITY;
          if (wantsClose && dismissible) {
            dragY.set(
              withTiming(OFFSCREEN, timing(durations.base, easings.exit), (finished) => {
                if (finished) scheduleOnRN(onRequestClose);
              }),
            );
            return;
          }
          dragY.set(withSpring(0, springs.press));
          if (wantsClose) onRequestClose();
        },
      }),
    [dismissible, dragY, onRequestClose],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.get() }] }));
  // El fondo sigue a la hoja: aparece al subir y se apaga al arrastrar hacia abajo.
  const scrimStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - dragY.get() / OFFSCREEN) }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable
            style={styles.flex}
            onPress={closeLabel ? onRequestClose : undefined}
            accessible={Boolean(closeLabel)}
            accessibilityRole={closeLabel ? 'button' : undefined}
            accessibilityLabel={closeLabel}
          />
        </Animated.View>
        <Animated.View style={[styles.sheet, style, sheetStyle]} accessibilityViewIsModal>
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            {header}
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, radii, spacing }: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    flex: {
      flex: 1,
    },
    scrim: {
      backgroundColor: colors.scrim,
    },
    sheet: {
      maxHeight: '90%',
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      backgroundColor: colors.surface,
    },
    handle: {
      alignSelf: 'center',
      width: spacing.xxl + spacing.sm,
      height: spacing.xs,
      marginTop: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.border,
    },
  });
