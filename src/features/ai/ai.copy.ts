// Microcopy de la IA. Sin código en el Documento de Contenido: propuesto, pendiente de validar.
// Voz (§02): breve, tuteo, errores que orientan ("directo, con solución").

import type { AiErrorKind } from './ai.types';

// Puntos de entrada (siempre secundarios).
export const CREATE_WITH_AI_LABEL = 'Crear con IA';
export const SUGGEST_WITH_AI_LABEL = 'Sugerir con IA';
export const AI_BADGE_LABEL = 'Sugerido con IA';

// Pantalla "Crear con IA".
export const CREATE_TITLE = 'Crear con IA';
export const PROMPT_LABEL = '¿Qué rutina necesitas?';
export const PROMPT_PLACEHOLDER = 'Ej. Salgo a la universidad a las 6:30';
export const PROMPT_HINT = 'Cuéntalo en una frase. Luego revisas y ajustas cada ítem.';
export const EXAMPLES_TITLE = 'Ejemplos';
export const PROMPT_EXAMPLES = [
  'Salgo a la universidad',
  'Saliendo con mi perro',
  'Voy al gimnasio después del trabajo',
  'Antes de dormir reviso la casa',
] as const;
export const exampleLabel = (example: string) => `Usar el ejemplo «${example}»`;
export const CREATE_DRAFT_LABEL = 'Crear borrador';
export const CREATING_LABEL = 'Preparando tu borrador…';
export const PROMPT_REQUIRED = 'Escribe qué rutina necesitas.';

// P04 con un borrador de IA.
export const DRAFT_REVIEW_HINT = 'Revisa cada ítem: quita o edita lo que no te sirva. Nada se guarda hasta que toques «Guardar cambios».';
export const WIFI_SUGGESTION_HINT = 'Te sugerimos un aviso al salir del Wi-Fi de casa. Añádelo en Avisos.';

// P04-4.
export const SUGGESTING_LABEL = 'Buscando sugerencias…';
export const NO_AI_SUGGESTIONS = 'No encontramos más ideas para esta rutina.';

// Sin conexión (los botones se desactivan; lo estático sigue funcionando).
export const OFFLINE_HINT = 'La IA necesita internet. Las sugerencias de siempre siguen disponibles.';

// Aviso de privacidad de primer uso ("tono Permisos": transparente).
export const CONSENT_TITLE = 'Sugerencias con IA';
export const CONSENT_SENT = 'Enviamos solo lo que escribes (la descripción, el nombre de la rutina y sus ítems) y, para los resúmenes y consejos, estadísticas agregadas: conteos y los ítems que más omites.';
export const CONSENT_NOT_SENT = 'No enviamos tu ubicación, tus redes Wi-Fi ni tu historial completo.';
export const CONSENT_PROVIDER = 'Lo procesa Gemini, de Google, en su capa gratuita: Google puede usar ese texto para mejorar sus servicios. No escribas datos personales.';
export const CONSENT_ACCEPT = 'Aceptar y continuar';
export const CONSENT_DECLINE = 'Ahora no';

// Ajustes.
export const SETTINGS_SECTION_TITLE = 'Inteligencia artificial';
export const SETTINGS_SWITCH_LABEL = 'Sugerencias con IA';
export const SETTINGS_HINT = 'Crear rutinas y sugerir ítems con IA. Necesita internet.';
export const SETTINGS_SAVE_ERROR = 'No se pudo guardar el cambio. Inténtalo de nuevo.';

const ERROR_MESSAGES: Record<AiErrorKind, string> = {
  offline: 'Sin conexión. Conéctate a internet y vuelve a intentar.',
  timeout: 'La IA tardó demasiado. Vuelve a intentar en un momento.',
  quota_exceeded: 'Usaste todas las sugerencias con IA de hoy. Mañana tendrás más; mientras, usa una plantilla.',
  not_a_routine: 'No parece una rutina. Cuenta a dónde vas o qué estás por hacer, por ejemplo «Salgo al trabajo».',
  invalid_output: 'La IA no dio una respuesta útil. Vuelve a intentar o cambia un poco el texto.',
  invalid_input: 'El texto es demasiado largo. Acórtalo y vuelve a intentar.',
  unauthorized: 'Tu sesión expiró. Vuelve a entrar para usar la IA.',
  server: 'La IA no está disponible ahora. Vuelve a intentar más tarde.',
};

export const aiErrorMessage = (kind: AiErrorKind): string => ERROR_MESSAGES[kind];
