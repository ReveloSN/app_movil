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
