// Microcopy de Ajustes (P11). Sin código en el Documento de Contenido salvo donde se indica.

import type { AuthUser } from '@/features/auth/auth.types';

export const SETTINGS_LOAD_ERROR = 'No pudimos cargar tus ajustes. Revisa tu conexión e inténtalo de nuevo.';
export const SETTINGS_SAVE_ERROR = 'No se pudo guardar el cambio. Revisa tu conexión e inténtalo de nuevo.';

// 11-1
export const NETWORKS_TITLE = 'Redes de casa';
export const NETWORKS_EMPTY = 'Aún no tienes redes. Se agregan al crear un aviso de Wi-Fi.';
export const NETWORKS_LOAD_ERROR = 'No pudimos cargar tus redes.';
export const RENAME_LABEL = 'Renombrar';
export const DELETE_LABEL = 'Eliminar';
export const SAVE_LABEL = 'Guardar';
export const CANCEL_LABEL = 'Cancelar';
export const networkLastSeen = (when: string | null) =>
  when ? `Última vez conectado: ${when}` : 'Aún no detectada en este teléfono';
export const networkUsage = (count: number) =>
  count === 0 ? 'Sin avisos' : count === 1 ? 'La usa 1 aviso' : `La usan ${count} avisos`;
export const networkInUseMessage = (name: string, count: number) =>
  `«${name}» la ${count === 1 ? 'usa 1 aviso' : `usan ${count} avisos`}. Cambia o quita esos avisos antes de eliminarla.`;
export const deleteNetworkMessage = (name: string) => `¿Eliminar la red «${name}»?`;
export const NETWORK_SAVE_ERROR = 'No se pudo guardar el cambio de la red. Inténtalo de nuevo.';

// 11-2
export const PERMISSIONS_SECTION_TITLE = 'Permisos';

// 11-3, 11-4, 11-5
export const NOTIFICATIONS_SECTION_TITLE = 'Avisos';
export const DO_NOT_DISTURB_LABEL = 'No molestar';
export const DO_NOT_DISTURB_HINT = 'Mientras esté activo, ningún aviso suena.';
export const SNOOZE_LABEL = 'Posponer';
export const snoozeOptionLabel = (minutes: number) => `${minutes} min`;
export const SOUND_LABEL = 'Sonido';

// 11-6
export const HELP_LABEL = 'Ayuda';

export const ACCOUNT_SECTION_TITLE = 'Cuenta';
export const SIGNED_IN_AS_LABEL = 'Sesión iniciada como';
export const SIGN_OUT_LABEL = 'Cerrar sesión';
export const GUEST_SIGN_OUT_MESSAGE = 'Si cierras sesión perderás tus rutinas: un invitado no puede volver a entrar.';
export const accountLabel = (user: AuthUser | null) =>
  !user ? '—' : user.isAnonymous ? 'Invitado (sin cuenta)' : (user.email ?? '—');
const unsyncedSignOutMessage = (count: number) =>
  `Tienes ${count} ${count === 1 ? 'cambio' : 'cambios'} sin sincronizar. Quedan guardados en este teléfono y se subirán cuando vuelvas a entrar con esta cuenta.`;
/** Qué confirmar antes de cerrar sesión; null si no hace falta preguntar. */
export const signOutWarning = (user: AuthUser | null, unsyncedCount: number): string | null =>
  user?.isAnonymous ? GUEST_SIGN_OUT_MESSAGE : unsyncedCount > 0 ? unsyncedSignOutMessage(unsyncedCount) : null;
