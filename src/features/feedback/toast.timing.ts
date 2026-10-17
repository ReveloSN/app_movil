/** Tiempo visible de un aviso breve. Con acción ("Deshacer") dura algo más para dar tiempo a tocarla. */
export const TOAST_DURATION_MS = 3500;
export const TOAST_WITH_ACTION_DURATION_MS = 5000;

export const toastDuration = (hasAction: boolean) => (hasAction ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS);
