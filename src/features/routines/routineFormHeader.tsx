import { router } from 'expo-router';

import { TextButton } from '@/components/atoms/TextButton';

import { CANCEL_LABEL } from './routine.copy';

function cancel() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

/**
 * "Cancelar" de P04. Va en las opciones fijas del layout, no en la pantalla: un `<Stack.Screen options>`
 * dentro del formulario vuelve a aplicar opciones al perder el foco y, si eso ocurre mientras la pila
 * se cierra (guardar → Inicio), Android falla con "ScreenStackFragment added into a non-stack container".
 * DC-03 sigue cubriéndolo: `router.back()` pasa por la protección de cambios sin guardar.
 */
export const renderCancelHeader = () => <TextButton label={CANCEL_LABEL} onPress={cancel} />;
