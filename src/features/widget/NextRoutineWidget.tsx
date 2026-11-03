import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { palettes } from '@/shared/theme/tokens';

import { ACTION_TOGGLE_ITEM, verifyUri, type ToggleItemData } from './widget.constants';
import * as copy from './widget.copy';
import type { WidgetItem, WidgetState } from './widget.state';

// El widget vive en la pantalla de inicio del teléfono: usa siempre la paleta clara de la app.
const colors = palettes.light;

function ItemRow({ routineId, item }: { routineId: string; item: WidgetItem }) {
  const data: ToggleItemData = { routineId, itemId: item.id };
  return (
    <FlexWidget
      clickAction={ACTION_TOGGLE_ITEM}
      clickActionData={data}
      accessibilityLabel={copy.itemSpoken(item.label, item.critical, item.checked)}
      style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', paddingVertical: 6 }}
    >
      {/* Casilla con forma (check o círculo vacío): el estado no depende del color. */}
      <TextWidget
        text={item.checked ? '✓' : '○'}
        style={{ fontSize: 18, fontWeight: 'bold', color: item.checked ? colors.primary : colors.textSecondary, width: 28 }}
      />
      <TextWidget
        text={copy.itemLabel(item.label, item.critical)}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 15,
          fontWeight: item.checked ? 'bold' : 'normal',
          color: item.checked ? colors.primary : colors.textPrimary,
        }}
      />
    </FlexWidget>
  );
}

/** Próxima rutina con sus ítems: tocar un ítem lo marca, tocar el título abre la verificación. */
export function NextRoutineWidget({ state }: { state: WidgetState | null }) {
  if (!state) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        accessibilityLabel={copy.EMPTY_SPOKEN}
        style={{
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          backgroundColor: colors.card,
          borderRadius: 24,
        }}
      >
        <TextWidget text={copy.EMPTY_TITLE} style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary }} />
        <TextWidget text={copy.EMPTY_HINT} style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        padding: 14,
        backgroundColor: colors.card,
        borderRadius: 24,
      }}
    >
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: verifyUri(state.routineId) }}
        accessibilityLabel={copy.headerSpoken(state.routineName, state.checked, state.total)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent' }}
      >
        <TextWidget
          text={state.routineName}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 17, fontWeight: 'bold', color: colors.textPrimary }}
        />
        <TextWidget text={copy.progress(state.checked, state.total)} style={{ fontSize: 13, color: colors.textSecondary }} />
      </FlexWidget>
      {state.items.map((item) => (
        <ItemRow key={item.id} routineId={state.routineId} item={item} />
      ))}
      {state.hiddenCount > 0 ? (
        <TextWidget
          text={copy.moreItems(state.hiddenCount)}
          clickAction="OPEN_URI"
          clickActionData={{ uri: verifyUri(state.routineId) }}
          style={{ fontSize: 13, color: colors.primary, fontWeight: 'bold' }}
        />
      ) : null}
    </FlexWidget>
  );
}
