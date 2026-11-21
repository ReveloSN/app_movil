// Microcopy de Ajustes (P11). Sin código en el Documento de Contenido salvo donde se indica.

import type { AuthUser } from '@/features/auth/auth.types';
import { localized } from '@/shared/i18n/localized';

const GUEST_SIGN_OUT_ES = 'Si cierras sesión perderás tus rutinas: un invitado no puede volver a entrar.';
const GUEST_SIGN_OUT_EN = "If you sign out you'll lose your routines: a guest can't sign back in.";

const unsyncedSignOutEs = (count: number) =>
  `Tienes ${count} ${count === 1 ? 'cambio' : 'cambios'} sin sincronizar. Quedan guardados en este teléfono y se subirán cuando vuelvas a entrar con esta cuenta.`;
const unsyncedSignOutEn = (count: number) =>
  `You have ${count} unsynced ${count === 1 ? 'change' : 'changes'}. They stay saved on this phone and will upload when you sign back in with this account.`;

export default localized(
  {
    SETTINGS_LOAD_ERROR: 'No pudimos cargar tus ajustes. Revisa tu conexión e inténtalo de nuevo.',
    SETTINGS_SAVE_ERROR: 'No se pudo guardar el cambio. Revisa tu conexión e inténtalo de nuevo.',
    LOADING_SETTINGS_LABEL: 'Cargando ajustes',
    RETRY_LABEL: 'Reintentar',

    // 11-1
    NETWORKS_TITLE: 'Redes de casa',
    LOADING_NETWORKS_LABEL: 'Cargando redes',
    NETWORKS_EMPTY: 'Aún no tienes redes. Se agregan al crear un aviso de Wi-Fi.',
    NETWORKS_LOAD_ERROR: 'No pudimos cargar tus redes.',
    RENAME_LABEL: 'Renombrar',
    DELETE_LABEL: 'Eliminar',
    SAVE_LABEL: 'Guardar',
    CANCEL_LABEL: 'Cancelar',
    networkLastSeen: (when: string | null) => (when ? `Última vez conectado: ${when}` : 'Aún no detectada en este teléfono'),
    networkUsage: (count: number) => (count === 0 ? 'Sin avisos' : count === 1 ? 'La usa 1 aviso' : `La usan ${count} avisos`),
    networkInUseMessage: (name: string, count: number) =>
      `«${name}» la ${count === 1 ? 'usa 1 aviso' : `usan ${count} avisos`}. Cambia o quita esos avisos antes de eliminarla.`,
    deleteNetworkMessage: (name: string) => `¿Eliminar la red «${name}»?`,
    NETWORK_SAVE_ERROR: 'No se pudo guardar el cambio de la red. Inténtalo de nuevo.',
    NETWORK_NAME_REQUIRED: 'Ponle un nombre a la red (ej. Casa).',
    networkNameTooLong: (max: number) => `Máximo ${max} caracteres.`,

    // 11-2
    PERMISSIONS_SECTION_TITLE: 'Permisos',

    // Verificación una por una. Sin código en el Documento de Contenido: propuesto, pendiente de validar.
    VERIFICATION_SECTION_TITLE: 'Verificación',
    DECK_MODE_LABEL: 'Verificar una por una',
    DECK_MODE_HINT: 'Cada ítem aparece en una tarjeta: desliza a la derecha si lo llevas y a la izquierda si no.',

    // 11-3, 11-4, 11-5
    NOTIFICATIONS_SECTION_TITLE: 'Avisos',
    DO_NOT_DISTURB_LABEL: 'No molestar',
    DO_NOT_DISTURB_HINT: 'Mientras esté activo, ningún aviso suena.',
    SNOOZE_LABEL: 'Posponer',
    snoozeOptionLabel: (minutes: number) => `${minutes} min`,
    SOUND_LABEL: 'Sonido',

    // 11-6
    HELP_LABEL: 'Ayuda',

    // "Nombre" de Ajustes (modelo de contenido). Propuestos, pendientes de validar.
    PROFILE_SECTION_TITLE: 'Tu nombre',
    DISPLAY_NAME_LABEL: 'Nombre',
    DISPLAY_NAME_PLACEHOLDER: 'Opcional',
    DISPLAY_NAME_HINT: 'Lo usamos para saludarte en Inicio.',

    ACCOUNT_SECTION_TITLE: 'Cuenta',
    SIGNED_IN_AS_LABEL: 'Sesión iniciada como',
    SIGN_OUT_LABEL: 'Cerrar sesión',
    GUEST_SIGN_OUT_MESSAGE: GUEST_SIGN_OUT_ES,
    accountLabel: (user: AuthUser | null) =>
      !user ? '—' : user.isAnonymous ? 'Invitado (sin cuenta)' : (user.email ?? '—'),
    /** Qué confirmar antes de cerrar sesión; null si no hace falta preguntar. */
    signOutWarning: (user: AuthUser | null, unsyncedCount: number): string | null =>
      user?.isAnonymous ? GUEST_SIGN_OUT_ES : unsyncedCount > 0 ? unsyncedSignOutEs(unsyncedCount) : null,

    // Apariencia (tema claro, oscuro o del sistema).
    APPEARANCE_SECTION_TITLE: 'Apariencia',
    APPEARANCE_GROUP_LABEL: 'Tema de la aplicación',
    THEME_LIGHT_LABEL: 'Claro',
    THEME_DARK_LABEL: 'Oscuro',
    THEME_SYSTEM_LABEL: 'Sistema',
    THEME_SYSTEM_HINT: 'Con «Sistema», la app usa el tema claro u oscuro de tu teléfono.',
  },
  {
    SETTINGS_LOAD_ERROR: "We couldn't load your settings. Check your connection and try again.",
    SETTINGS_SAVE_ERROR: "The change couldn't be saved. Check your connection and try again.",
    LOADING_SETTINGS_LABEL: 'Loading settings',
    RETRY_LABEL: 'Try again',

    NETWORKS_TITLE: 'Home networks',
    LOADING_NETWORKS_LABEL: 'Loading networks',
    NETWORKS_EMPTY: "You don't have any networks yet. They're added when you create a Wi-Fi alert.",
    NETWORKS_LOAD_ERROR: "We couldn't load your networks.",
    RENAME_LABEL: 'Rename',
    DELETE_LABEL: 'Delete',
    SAVE_LABEL: 'Save',
    CANCEL_LABEL: 'Cancel',
    networkLastSeen: (when: string | null) => (when ? `Last connected: ${when}` : 'Not detected on this phone yet'),
    networkUsage: (count: number) => (count === 0 ? 'No alerts' : count === 1 ? 'Used by 1 alert' : `Used by ${count} alerts`),
    networkInUseMessage: (name: string, count: number) =>
      `“${name}” is used by ${count === 1 ? '1 alert' : `${count} alerts`}. Change or remove those alerts before deleting it.`,
    deleteNetworkMessage: (name: string) => `Delete the network “${name}”?`,
    NETWORK_SAVE_ERROR: "The network change couldn't be saved. Try again.",
    NETWORK_NAME_REQUIRED: 'Give the network a name (e.g. Home).',
    networkNameTooLong: (max: number) => `Maximum ${max} characters.`,

    PERMISSIONS_SECTION_TITLE: 'Permissions',

    VERIFICATION_SECTION_TITLE: 'Checking',
    DECK_MODE_LABEL: 'Check one by one',
    DECK_MODE_HINT: "Each item shows up on a card: swipe right if you have it and left if you don't.",

    NOTIFICATIONS_SECTION_TITLE: 'Alerts',
    DO_NOT_DISTURB_LABEL: 'Do not disturb',
    DO_NOT_DISTURB_HINT: 'While this is on, no alert makes a sound.',
    SNOOZE_LABEL: 'Snooze',
    snoozeOptionLabel: (minutes: number) => `${minutes} min`,
    SOUND_LABEL: 'Sound',

    HELP_LABEL: 'Help',

    PROFILE_SECTION_TITLE: 'Your name',
    DISPLAY_NAME_LABEL: 'Name',
    DISPLAY_NAME_PLACEHOLDER: 'Optional',
    DISPLAY_NAME_HINT: 'We use it to greet you on Home.',

    ACCOUNT_SECTION_TITLE: 'Account',
    SIGNED_IN_AS_LABEL: 'Signed in as',
    SIGN_OUT_LABEL: 'Sign out',
    GUEST_SIGN_OUT_MESSAGE: GUEST_SIGN_OUT_EN,
    accountLabel: (user: AuthUser | null) =>
      !user ? '—' : user.isAnonymous ? 'Guest (no account)' : (user.email ?? '—'),
    signOutWarning: (user: AuthUser | null, unsyncedCount: number): string | null =>
      user?.isAnonymous ? GUEST_SIGN_OUT_EN : unsyncedCount > 0 ? unsyncedSignOutEn(unsyncedCount) : null,

    APPEARANCE_SECTION_TITLE: 'Appearance',
    APPEARANCE_GROUP_LABEL: 'App theme',
    THEME_LIGHT_LABEL: 'Light',
    THEME_DARK_LABEL: 'Dark',
    THEME_SYSTEM_LABEL: 'System',
    THEME_SYSTEM_HINT: 'With “System”, the app uses your phone’s light or dark theme.',
  },
);
