import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { TextButton } from '@/components/atoms/TextButton';
import { SwipeCard } from './SwipeCard';
import { displayIconForItem } from '@/features/routines/item-icon-guess';
import { hapticToggleOff, hapticToggleOn } from '@/shared/haptics/haptics';
import { fadeIn } from '@/shared/theme/motion';
import { type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { carriedBy, type SwipeDirection } from './checklist.deck';
import * as copy from './checklist.copy';
import type { ChecklistItemState } from './checklist.types';
import { useChecklistDeck } from './useChecklistDeck';

interface ChecklistDeckProps {
  items: readonly ChecklistItemState[];
  setItemChecked(itemId: string, checked: boolean): void;
}

/**
 * Verificación "una por una": un ítem a la vez; derecha = lo llevo, izquierda = no lo llevo. Los botones de
 * abajo hacen lo mismo que el deslizar (accesibilidad), y "Deshacer" devuelve la última respuesta.
 */
export function ChecklistDeck({ items, setItemChecked }: ChecklistDeckProps) {
  const styles = useThemedStyles(createStyles);
  const { current, answer, undo, canUndo } = useChecklistDeck(items, setItemChecked);

  function respond(direction: SwipeDirection) {
    if (carriedBy(direction)) hapticToggleOn();
    else hapticToggleOff();
    answer(direction);
  }

  return (
    <View style={styles.container}>
      {current ? (
        <>
          <Text style={styles.hint}>{copy.SWIPE_HINT}</Text>
          <SwipeCard
            key={current.id}
            label={current.label}
            icon={displayIconForItem(current.icon, current.label)}
            critical={current.critical}
            criticalLabel={copy.CRITICAL_LABEL}
            note={current.note}
            carryLabel={copy.CARRY_LABEL}
            notCarryLabel={copy.NOT_CARRY_LABEL}
            onSwipe={respond}
          />
          <View style={styles.actions}>
            <View style={styles.half}>
              <SecondaryButton label={copy.NOT_CARRY_LABEL} icon="close" onPress={() => respond('left')} />
            </View>
            <View style={styles.half}>
              {/* Secundario: la acción primaria de la pantalla sigue siendo "Listo", en el pie. */}
              <SecondaryButton label={copy.CARRY_LABEL} icon="checkmark" onPress={() => respond('right')} />
            </View>
          </View>
        </>
      ) : (
        <Animated.View entering={fadeIn} style={styles.done}>
          <Text style={styles.doneTitle} accessibilityRole="header">
            {copy.DECK_DONE_TITLE}
          </Text>
          <Text style={styles.doneMessage}>{copy.DECK_DONE_MESSAGE}</Text>
        </Animated.View>
      )}
      {canUndo ? <TextButton label={copy.UNDO_LABEL} onPress={undo} /> : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    hint: {
      ...typography.label,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    half: {
      flex: 1,
    },
    done: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    doneTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    doneMessage: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  });
