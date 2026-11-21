// Onboarding (P01). Los títulos de los pasos vienen del Documento de Contenido; el resto es propio.

import { localized } from '@/shared/i18n/localized';

export const TOTAL_STEPS = 4;

export default localized(
  {
    stepProgressLabel: (step: number) => `Paso ${step} de ${TOTAL_STEPS}`,

    SKIP_LABEL: 'Saltar',
    BACK_LABEL: 'Atrás',

    // Paso 1
    WELCOME_TITLE: 'Antes de cruzar la puerta',
    WELCOME_BODY:
      'Lo que se queda atrás suele ser lo mismo: llaves, cargador, la estufa. Armemos tu primera rutina para revisarlo en segundos antes de salir.',
    START_LABEL: 'Empezar',

    // Paso 2
    TEMPLATES_TITLE: '¿Qué se te suele olvidar?',
    TEMPLATES_BODY: 'Elige una para empezar. Después puedes ajustarla o crear más.',

    // Paso 3
    TRIGGER_TITLE: '¿Cuándo te avisamos?',
    triggerBody: (routineName: string) => `Para «${routineName}». Puedes dejarlo para después.`,
    suggestedTriggerText: (summary: string) => `Sugerido: ${summary}`,
    CONFIGURE_TRIGGER_LABEL: 'Configurar aviso',
    CONTINUE_WITHOUT_TRIGGER_LABEL: 'Continuar sin aviso',
    CREATE_ROUTINE_LABEL: 'Crear mi rutina',
    /** Si la rutina elegida no se puede crear (no la ve la persona salvo que falle la validación). */
    INVALID_ROUTINE_ERROR: 'Revisa la rutina elegida.',

    // Paso 4
    DONE_TITLE: 'Todo listo',
    DONE_WITH_TRIGGER: 'Cuando suene, la revisas en segundos y sales con todo.',
    DONE_WITHOUT_TRIGGER: 'Ábrela desde Inicio cada vez que vayas a salir.',
    GO_TO_ROUTINES_LABEL: 'Ir a mis rutinas',
  },
  {
    stepProgressLabel: (step: number) => `Step ${step} of ${TOTAL_STEPS}`,

    SKIP_LABEL: 'Skip',
    BACK_LABEL: 'Back',

    WELCOME_TITLE: 'Before you step out',
    WELCOME_BODY:
      "What gets left behind is usually the same: keys, charger, the stove. Let's build your first routine to check it in seconds before you leave.",
    START_LABEL: 'Get started',

    TEMPLATES_TITLE: 'What do you tend to forget?',
    TEMPLATES_BODY: 'Pick one to start. You can adjust it or create more later.',

    TRIGGER_TITLE: 'When should we alert you?',
    triggerBody: (routineName: string) => `For “${routineName}”. You can leave it for later.`,
    suggestedTriggerText: (summary: string) => `Suggested: ${summary}`,
    CONFIGURE_TRIGGER_LABEL: 'Set up alert',
    CONTINUE_WITHOUT_TRIGGER_LABEL: 'Continue without an alert',
    CREATE_ROUTINE_LABEL: 'Create my routine',
    INVALID_ROUTINE_ERROR: 'Check the routine you picked.',

    DONE_TITLE: "You're all set",
    DONE_WITH_TRIGGER: 'When it goes off, check it in seconds and head out with everything.',
    DONE_WITHOUT_TRIGGER: 'Open it from Home every time you are about to leave.',
    GO_TO_ROUTINES_LABEL: 'Go to my routines',
  },
);
