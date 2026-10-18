import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

type TransitionEndEvent = { data?: { closing?: boolean } };

/** Lo mínimo que se usa de la navegación de la pantalla (inyectable en pruebas). */
export interface AppearEvents {
  addListener(type: 'transitionEnd', listener: (event: TransitionEndEvent) => void): () => void;
}

/**
 * Llama a `callback` cada vez que la pantalla termina de aparecer (al entrar y al volver a ella), no al
 * empezar a recibir el foco. Sirve para navegar de nuevo justo al volver: hacerlo mientras la pantalla
 * de encima aún se está cerrando encadena dos cierres y Android falla con
 * "ScreenStackFragment added into a non-stack container".
 */
export function useAfterAppear(callback: () => void, events?: AppearEvents) {
  const navigation = useNavigation() as unknown as AppearEvents;
  const source = events ?? navigation;
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  });

  useEffect(
    () =>
      source.addListener('transitionEnd', (event) => {
        if (!event.data?.closing) latest.current();
      }),
    [source],
  );
}
