import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { NextRoutineWidget } from './NextRoutineWidget';
import { WIDGET_NAME } from './widget.constants';
import { loadWidgetState } from './widget.data';

/**
 * Vuelve a dibujar el widget con lo último (ej. tras marcar un ítem en la app). Es un extra: si falla o no
 * hay widget en la pantalla de inicio, no afecta a lo que se hizo.
 */
export function refreshWidget(): void {
  if (Platform.OS !== 'android') return;
  requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: async () => <NextRoutineWidget state={await loadWidgetState()} />,
  }).catch((cause: unknown) => {
    if (__DEV__) console.warn('[widget.refresh]', cause);
  });
}
