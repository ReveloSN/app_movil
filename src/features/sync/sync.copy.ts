// Microcopy de la sincronización (sin código en el Documento de Contenido: textos nuevos de la Fase 4/5).

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

// Mensajes tras sincronizar (flash en Inicio).
export const SYNC_CONFLICT_MESSAGE =
  'Algunos cambios hechos sin conexión se reemplazaron por otros más recientes de otro dispositivo.';
export const syncFailedMessage = (count: number) =>
  `${count} ${plural(count, 'cambio no se pudo sincronizar', 'cambios no se pudieron sincronizar')}. Revísalo en Ajustes.`;

// Indicador en Inicio.
export const SYNCING_LABEL = 'Sincronizando…';
export const pendingLabel = (count: number) =>
  `${count} ${plural(count, 'cambio sin sincronizar', 'cambios sin sincronizar')}`;
export const failedLabel = (count: number) =>
  `${count} ${plural(count, 'cambio con error', 'cambios con error')} · Revisa Ajustes`;

// Ajustes: bloque "Cambios sin sincronizar".
export const SYNC_SECTION_TITLE = 'Cambios sin sincronizar';
export const ALL_SYNCED = 'Todo está sincronizado.';
export const NEVER_SYNCED = 'Aún no se ha sincronizado en este teléfono.';
export const lastSyncedLabel = (when: string) => `Última sincronización: ${when}`;
export const waitingLabel = (count: number) =>
  `${count} ${plural(count, 'cambio espera', 'cambios esperan')} para subir.`;
export const blockedHint = (count: number) =>
  `${count} ${plural(count, 'espera', 'esperan')} a que se resuelva un cambio con error.`;
export const OFFLINE_HINT = 'Sin conexión: se subirán solos cuando vuelva.';
export const SYNC_NOW_LABEL = 'Sincronizar ahora';
export const RETRY_LABEL = 'Reintentar';
export const DISCARD_LABEL = 'Descartar';
export const CANCEL_LABEL = 'Cancelar';

// Historial.
export const PENDING_SYNC_LABEL = 'Pendiente de sincronizar';

// Qué cambio falló (con el nombre que hay en el teléfono, si se sabe).
const named = (name: string | null, withName: (value: string) => string, withoutName: string) =>
  name ? withName(name) : withoutName;

export const CHANGE_TITLES = {
  routines: {
    insert: (name: string | null) => named(name, (value) => `Crear la rutina «${value}»`, 'Crear una rutina'),
    update: (name: string | null) => named(name, (value) => `Cambiar la rutina «${value}»`, 'Cambiar una rutina'),
    delete: () => 'Eliminar una rutina',
  },
  items: {
    insert: (name: string | null) => named(name, (value) => `Agregar el ítem «${value}»`, 'Agregar un ítem'),
    update: (name: string | null) => named(name, (value) => `Cambiar el ítem «${value}»`, 'Cambiar un ítem'),
    delete: () => 'Quitar un ítem',
  },
  triggers: {
    insert: (routine: string | null) => named(routine, (value) => `Agregar un aviso a «${value}»`, 'Agregar un aviso'),
    update: (routine: string | null) => named(routine, (value) => `Cambiar un aviso de «${value}»`, 'Cambiar un aviso'),
    delete: () => 'Quitar un aviso',
  },
  homeNetworks: {
    insert: (name: string | null) => named(name, (value) => `Agregar la red «${value}»`, 'Agregar una red'),
    update: (name: string | null) => named(name, (value) => `Cambiar la red «${value}»`, 'Cambiar una red'),
    delete: () => 'Eliminar una red',
  },
  settings: {
    insert: () => 'Guardar tus ajustes',
    update: () => 'Guardar tus ajustes',
    delete: () => 'Guardar tus ajustes',
  },
};
export const DELETE_ROUTINE_TITLE = 'Eliminar una rutina';
export const recordTitle = (routine: string | null) =>
  named(routine, (value) => `Guardar la verificación de «${value}»`, 'Guardar una verificación');

// Por qué no se aceptó (según el código de Postgres).
export const FAILURE_REASONS: Record<string, string> = {
  '23514': 'Supera un límite de la app (por ejemplo, más de 12 ítems o 3 avisos por rutina).',
  '23503': 'Depende de algo que ya no existe: quizá se borró en otro dispositivo.',
  '42501': 'Tu cuenta no tiene permiso para este cambio.',
};
export const UNKNOWN_FAILURE = 'El servidor no aceptó el cambio.';

// Confirmar "Descartar".
export const DISCARD_SINGLE_MESSAGE = '¿Descartar este cambio? Se perderá y quedará lo que haya en el servidor.';
export const DEPENDENT_LABELS = {
  items: (count: number) => `${count} ${plural(count, 'ítem', 'ítems')}`,
  triggers: (count: number) => `${count} ${plural(count, 'aviso', 'avisos')}`,
  records: (count: number) => `${count} ${plural(count, 'verificación', 'verificaciones')}`,
  routines: (count: number) => `${count} ${plural(count, 'rutina', 'rutinas')}`,
  homeNetworks: (count: number) => `${count} ${plural(count, 'red', 'redes')}`,
  settings: (count: number) => `${count} ${plural(count, 'ajuste', 'ajustes')}`,
};
export const discardWithDependentsMessage = (list: string, ofRoutine: boolean) =>
  `Se descartarán también ${list}${ofRoutine ? ' de esta rutina' : ''}. ¿Descartar?`;
