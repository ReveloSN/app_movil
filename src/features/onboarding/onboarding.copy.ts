// Onboarding (P01). Los títulos de los pasos vienen del Documento de Contenido; el resto es propio.

export const TOTAL_STEPS = 4;
export const stepProgressLabel = (step: number) => `Paso ${step} de ${TOTAL_STEPS}`;

export const SKIP_LABEL = 'Saltar';
export const BACK_LABEL = 'Atrás';

// Paso 1
export const WELCOME_TITLE = 'Antes de cruzar la puerta';
export const WELCOME_BODY =
  'Lo que se queda atrás suele ser lo mismo: llaves, cargador, la estufa. Armemos tu primera rutina para revisarlo en segundos antes de salir.';
export const START_LABEL = 'Empezar';

// Paso 2
export const TEMPLATES_TITLE = '¿Qué se te suele olvidar?';
export const TEMPLATES_BODY = 'Elige una para empezar. Después puedes ajustarla o crear más.';

// Paso 3
export const TRIGGER_TITLE = '¿Cuándo te avisamos?';
export const triggerBody = (routineName: string) => `Para «${routineName}». Puedes dejarlo para después.`;
export const suggestedTriggerText = (summary: string) => `Sugerido: ${summary}`;
export const CONFIGURE_TRIGGER_LABEL = 'Configurar aviso';
export const CONTINUE_WITHOUT_TRIGGER_LABEL = 'Continuar sin aviso';
export const CREATE_ROUTINE_LABEL = 'Crear mi rutina';

// Paso 4
export const DONE_TITLE = 'Todo listo';
export const DONE_WITH_TRIGGER = 'Cuando suene, la revisas en segundos y sales con todo.';
export const DONE_WITHOUT_TRIGGER = 'Ábrela desde Inicio cada vez que vayas a salir.';
export const GO_TO_ROUTINES_LABEL = 'Ir a mis rutinas';
