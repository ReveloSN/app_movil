import { View, type LayoutChangeEvent } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { ItemSummaryRow } from '@/components/molecules/ItemSummaryRow';
import { spacing } from '@/shared/theme/tokens';

import { ReorderableItemList } from './ReorderableItemList';
import { resolveItemIcon } from './item-icons';
import * as copy from './routine.copy';
import { MAX_ITEMS, MAX_ITEMS_MESSAGE } from './routine.validation';
import type { RoutineValidationErrors } from './routines.types';
import type { ItemFormEntry } from './useRoutineForm';

interface RoutineItemsSectionProps {
  items: readonly ItemFormEntry[];
  errors: Pick<RoutineValidationErrors, 'items' | 'itemLabels'>;
  canAddItem: boolean;
  /** Posición del bloque (para llevar ahí al primer error). */
  onLayout(event: LayoutChangeEvent): void;
  onEdit(entry: ItemFormEntry): void;
  onAdd(): void;
  onRemove(key: string): void;
  /** Reordenar: lleva el ítem a esa posición de la lista que se ve. */
  onMove(key: string, toIndex: number): void;
}

/** 04-3 en P04: contador, errores, lista de ítems (críticos arriba) y "Añadir ítem". */
export function RoutineItemsSection({ items, errors, canAddItem, onLayout, onEdit, onAdd, onRemove, onMove }: RoutineItemsSectionProps) {
  return (
    <>
      <View onLayout={onLayout}>
        <SectionLabel
          label={copy.ITEMS_SECTION_TITLE}
          trailing={`${items.length}/${MAX_ITEMS}`}
          accessibilityLabel={`${copy.ITEMS_SECTION_TITLE}, ${items.length} de ${MAX_ITEMS}`}
        />
      </View>
      {errors.items ? <StatusMessage tone="error" message={errors.items} /> : null}

      {items.length === 0 ? <StatusMessage tone="info" message={copy.EMPTY_ITEMS_MESSAGE} /> : null}
      {/* Al añadir, quitar o reordenar los ítems entran, salen y se deslizan a su sitio. */}
      <ReorderableItemList
        items={items}
        gap={spacing.lg}
        onMove={onMove}
        renderRow={(item, index, handle) => (
          <ItemSummaryRow
            leading={handle}
            label={item.label}
            icon={resolveItemIcon(item.icon).icon}
            critical={item.critical}
            criticalLabel={copy.CRITICAL_LABEL}
            note={item.note}
            error={errors.itemLabels?.[index]}
            onPress={() => onEdit(item)}
            editHint={copy.editItemHint(item.label)}
            onRemove={() => onRemove(item.key)}
            removeLabel={copy.removeItemLabel(item.label)}
          />
        )}
      />

      {/* ER-05: al llegar al máximo, se explica por qué ya no se puede añadir. */}
      {canAddItem ? null : <StatusMessage tone="info" message={MAX_ITEMS_MESSAGE} />}
      <SecondaryButton icon="add" label={copy.ADD_ITEM_LABEL} onPress={onAdd} disabled={!canAddItem} />
    </>
  );
}
