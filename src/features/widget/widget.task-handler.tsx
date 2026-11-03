import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { NextRoutineWidget } from './NextRoutineWidget';
import { ACTION_TOGGLE_ITEM, type ToggleItemData } from './widget.constants';
import { loadWidgetState, toggleWidgetItem } from './widget.data';

const isToggleData = (data: Record<string, unknown> | undefined): data is ToggleItemData =>
  typeof data?.routineId === 'string' && typeof data.itemId === 'string';

/**
 * Atiende al widget desde el sistema, también con la app cerrada (registrado en `index.ts`): al agregarlo,
 * actualizarlo o cambiarle el tamaño lo dibuja de nuevo, y un toque en un ítem lo marca o desmarca en el borrador.
 * Los toques que abren la app ("OPEN_URI", "OPEN_APP") los resuelve el sistema sin pasar por aquí.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  try {
    if (props.widgetAction === 'WIDGET_DELETED') return;
    if (
      props.widgetAction === 'WIDGET_CLICK' &&
      props.clickAction === ACTION_TOGGLE_ITEM &&
      isToggleData(props.clickActionData)
    ) {
      await toggleWidgetItem(props.clickActionData.routineId, props.clickActionData.itemId);
    }
    props.renderWidget(<NextRoutineWidget state={await loadWidgetState()} />);
  } catch (cause) {
    if (__DEV__) console.warn('[widget.task]', cause);
  }
}
