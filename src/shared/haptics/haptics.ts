import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Háptico ligero que respeta el ajuste del sistema: en Android usa performHapticFeedback (si la
// persona desactivó la respuesta táctil, no vibra). Es un extra: si falla, no afecta lo que se hizo.
function perform(android: Haptics.AndroidHaptics, fallback: () => Promise<void>) {
  const run = Platform.OS === 'android' ? () => Haptics.performAndroidHapticsAsync(android) : fallback;
  run().catch((cause: unknown) => {
    if (__DEV__) console.warn('[haptics]', cause);
  });
}

/** Al marcar un ítem. */
export const hapticToggleOn = () => perform(Haptics.AndroidHaptics.Toggle_On, Haptics.selectionAsync);

/** Al desmarcar un ítem. */
export const hapticToggleOff = () => perform(Haptics.AndroidHaptics.Toggle_Off, Haptics.selectionAsync);

/** Al completar una rutina. */
export const hapticConfirm = () =>
  perform(Haptics.AndroidHaptics.Confirm, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** Al cambiar de pestaña (tocando o deslizando). */
export const hapticTick = () => perform(Haptics.AndroidHaptics.Segment_Tick, Haptics.selectionAsync);

/** Al cruzar el umbral de un deslizamiento: avisa que, si suelta ahora, se confirma. Sutil. */
export const hapticSwipeArm = () => perform(Haptics.AndroidHaptics.Segment_Tick, Haptics.selectionAsync);

/** Al levantar una fila para reordenarla. */
export const hapticReorderPick = () => perform(Haptics.AndroidHaptics.Gesture_Start, Haptics.selectionAsync);

/** Cada vez que la fila arrastrada pasa a otra posición. */
export const hapticReorderStep = () => perform(Haptics.AndroidHaptics.Segment_Tick, Haptics.selectionAsync);

/** Al soltar la fila en su nueva posición. */
export const hapticReorderDrop = () => perform(Haptics.AndroidHaptics.Gesture_End, Haptics.selectionAsync);
