import { useCallback, useRef } from 'react';
import { AccessibilityInfo, type LayoutChangeEvent, type ScrollView, type TextInput } from 'react-native';

import { firstRoutineError } from './routine-feedback';
import type { RoutineValidationErrors } from './routines.types';

// Margen sobre el bloque para que su título quede a la vista al desplazarse.
const SCROLL_MARGIN = 16;

/**
 * Tras un intento de guardar con errores, lleva a la persona al primero: foco en el nombre o
 * desplazamiento hasta la lista, y lo anuncia al lector de pantalla.
 */
export function useFirstErrorFocus() {
  const scrollRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const positions = useRef<{ items?: number; triggers?: number }>({});

  // onLayout de cada bloque: guarda su posición dentro del scroll.
  const onItemsLayout = useCallback((event: LayoutChangeEvent) => {
    positions.current.items = event.nativeEvent.layout.y;
  }, []);
  const onTriggersLayout = useCallback((event: LayoutChangeEvent) => {
    positions.current.triggers = event.nativeEvent.layout.y;
  }, []);

  function focusFirstError(errors: RoutineValidationErrors) {
    const first = firstRoutineError(errors);
    if (!first) return;
    AccessibilityInfo.announceForAccessibility(first.message);
    if (first.field === 'name') {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      nameRef.current?.focus();
      return;
    }
    const y = positions.current[first.field];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_MARGIN), animated: true });
  }

  return { scrollRef, nameRef, onItemsLayout, onTriggersLayout, focusFirstError };
}
