// Microcopy de la IA. Sin código en el Documento de Contenido: propuesto, pendiente de validar.
// Voz (§02): breve, tuteo, errores que orientan ("directo, con solución").

import { localized } from '@/shared/i18n/localized';

import type { AiErrorKind } from './ai.types';

const ERROR_MESSAGES_ES: Record<AiErrorKind, string> = {
  offline: 'Sin conexión. Conéctate a internet y vuelve a intentar.',
  timeout: 'La IA tardó demasiado. Vuelve a intentar en un momento.',
  quota_exceeded: 'Usaste todas las sugerencias con IA de hoy. Mañana tendrás más; mientras, usa una plantilla.',
  not_a_routine: 'No parece una rutina. Cuenta a dónde vas o qué estás por hacer, por ejemplo «Salgo al trabajo».',
  invalid_output: 'La IA no dio una respuesta útil. Vuelve a intentar o cambia un poco el texto.',
  invalid_input: 'El texto es demasiado largo. Acórtalo y vuelve a intentar.',
  unauthorized: 'Tu sesión expiró. Vuelve a entrar para usar la IA.',
  server: 'La IA no está disponible ahora. Vuelve a intentar más tarde.',
};

const ERROR_MESSAGES_EN: Record<AiErrorKind, string> = {
  offline: "You're offline. Connect to the internet and try again.",
  timeout: 'The AI took too long. Try again in a moment.',
  quota_exceeded: "You've used all of today's AI suggestions. You'll get more tomorrow; for now, use a template.",
  not_a_routine: 'That doesn\'t look like a routine. Say where you\'re going or what you\'re about to do, like "I\'m heading to work".',
  invalid_output: "The AI didn't give a useful answer. Try again or tweak the text a little.",
  invalid_input: 'The text is too long. Shorten it and try again.',
  unauthorized: 'Your session expired. Sign in again to use the AI.',
  server: "The AI isn't available right now. Try again later.",
};

export default localized(
  {
    // Puntos de entrada (siempre secundarios).
    CREATE_WITH_AI_LABEL: 'Crear con IA',
    SUGGEST_WITH_AI_LABEL: 'Sugerir con IA',
    AI_BADGE_LABEL: 'Sugerido con IA',

    // Pantalla "Crear con IA".
    CREATE_TITLE: 'Crear con IA',
    PROMPT_LABEL: '¿Qué rutina necesitas?',
    PROMPT_PLACEHOLDER: 'Ej. Salgo a la universidad a las 6:30',
    PROMPT_HINT: 'Cuéntalo en una frase. Luego revisas y ajustas cada ítem.',
    EXAMPLES_TITLE: 'Ejemplos',
    PROMPT_EXAMPLES: [
      'Salgo a la universidad',
      'Saliendo con mi perro',
      'Voy al gimnasio después del trabajo',
      'Antes de dormir reviso la casa',
    ] as readonly string[],
    exampleLabel: (example: string) => `Usar el ejemplo «${example}»`,
    CREATE_DRAFT_LABEL: 'Crear borrador',
    CREATING_LABEL: 'Preparando tu borrador…',
    PROMPT_REQUIRED: 'Escribe qué rutina necesitas.',

    // P04 con un borrador de IA.
    DRAFT_REVIEW_HINT: 'Revisa cada ítem: quita o edita lo que no te sirva. Nada se guarda hasta que toques «Guardar cambios».',
    WIFI_SUGGESTION_HINT: 'Te sugerimos un aviso al salir del Wi-Fi de casa. Añádelo en Avisos.',

    // P04-4.
    SUGGESTING_LABEL: 'Buscando sugerencias…',
    NO_AI_SUGGESTIONS: 'No encontramos más ideas para esta rutina.',

    // Sin conexión (los botones se desactivan; lo estático sigue funcionando).
    OFFLINE_HINT: 'La IA necesita internet. Las sugerencias de siempre siguen disponibles.',

    // Aviso de privacidad de primer uso ("tono Permisos": transparente).
    CONSENT_TITLE: 'Sugerencias con IA',
    CONSENT_SENT:
      'Enviamos solo lo que escribes (la descripción, el nombre de la rutina y sus ítems) y, para los resúmenes y consejos, estadísticas agregadas: conteos y los ítems que más omites.',
    CONSENT_NOT_SENT: 'No enviamos tu ubicación, tus redes Wi-Fi ni tu historial completo.',
    CONSENT_PROVIDER:
      'Lo procesa Gemini, de Google, en su capa gratuita: Google puede usar ese texto para mejorar sus servicios. No escribas datos personales.',
    CONSENT_ACCEPT: 'Aceptar y continuar',
    CONSENT_DECLINE: 'Ahora no',

    // Ajustes.
    SETTINGS_SECTION_TITLE: 'Inteligencia artificial',
    SETTINGS_SWITCH_LABEL: 'Sugerencias con IA',
    SETTINGS_HINT: 'Crear rutinas y sugerir ítems con IA. Necesita internet.',
    SETTINGS_SAVE_ERROR: 'No se pudo guardar el cambio. Inténtalo de nuevo.',

    aiErrorMessage: (kind: AiErrorKind): string => ERROR_MESSAGES_ES[kind],
  },
  {
    CREATE_WITH_AI_LABEL: 'Create with AI',
    SUGGEST_WITH_AI_LABEL: 'Suggest with AI',
    AI_BADGE_LABEL: 'Suggested by AI',

    CREATE_TITLE: 'Create with AI',
    PROMPT_LABEL: 'What routine do you need?',
    PROMPT_PLACEHOLDER: 'E.g. I leave for class at 6:30',
    PROMPT_HINT: "Say it in one sentence. Then you'll review and adjust each item.",
    EXAMPLES_TITLE: 'Examples',
    PROMPT_EXAMPLES: [
      "I'm heading to class",
      "I'm leaving with my dog",
      "I'm going to the gym after work",
      'Checking the house before bed',
    ],
    exampleLabel: (example: string) => `Use the example "${example}"`,
    CREATE_DRAFT_LABEL: 'Create draft',
    CREATING_LABEL: 'Preparing your draft…',
    PROMPT_REQUIRED: 'Write what routine you need.',

    DRAFT_REVIEW_HINT: 'Review each item: remove or edit what you don\'t need. Nothing is saved until you tap "Save changes".',
    WIFI_SUGGESTION_HINT: 'We suggest an alert for when you leave your home Wi-Fi. Add it in Alerts.',

    SUGGESTING_LABEL: 'Looking for suggestions…',
    NO_AI_SUGGESTIONS: "We couldn't find more ideas for this routine.",

    OFFLINE_HINT: 'AI needs the internet. The usual suggestions are still available.',

    CONSENT_TITLE: 'AI suggestions',
    CONSENT_SENT:
      'We only send what you write (the description, the routine name and its items) and, for summaries and tips, aggregated stats: counts and the items you skip most.',
    CONSENT_NOT_SENT: "We don't send your location, your Wi-Fi networks or your full history.",
    CONSENT_PROVIDER:
      "It's processed by Google's Gemini on its free tier: Google may use that text to improve its services. Don't write personal data.",
    CONSENT_ACCEPT: 'Accept and continue',
    CONSENT_DECLINE: 'Not now',

    SETTINGS_SECTION_TITLE: 'Artificial intelligence',
    SETTINGS_SWITCH_LABEL: 'AI suggestions',
    SETTINGS_HINT: 'Create routines and suggest items with AI. Needs internet.',
    SETTINGS_SAVE_ERROR: "Couldn't save the change. Try again.",

    aiErrorMessage: (kind: AiErrorKind): string => ERROR_MESSAGES_EN[kind],
  },
);
