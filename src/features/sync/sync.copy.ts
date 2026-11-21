// Microcopy de la sincronización (sin código en el Documento de Contenido: textos nuevos de la Fase 4/5).

import { localized } from '@/shared/i18n/localized';

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

// Qué cambio falló (con el nombre que hay en el teléfono, si se sabe).
const named = (name: string | null, withName: (value: string) => string, withoutName: string) =>
  name ? withName(name) : withoutName;

// Por qué no se aceptó (según el código de Postgres).
const failureReasonsEs: Record<string, string> = {
  '23514': 'Supera un límite de la app (por ejemplo, más de 12 ítems o 3 avisos por rutina).',
  '23503': 'Depende de algo que ya no existe: quizá se borró en otro dispositivo.',
  '42501': 'Tu cuenta no tiene permiso para este cambio.',
};
const failureReasonsEn: Record<string, string> = {
  '23514': 'It goes over an app limit (for example, more than 12 items or 3 alerts per routine).',
  '23503': 'It depends on something that no longer exists: it may have been deleted on another device.',
  '42501': "Your account doesn't have permission for this change.",
};

export default localized(
  {
    // Mensajes tras sincronizar (flash en Inicio).
    SYNC_CONFLICT_MESSAGE: 'Algunos cambios hechos sin conexión se reemplazaron por otros más recientes de otro dispositivo.',
    syncFailedMessage: (count: number) =>
      `${count} ${plural(count, 'cambio no se pudo sincronizar', 'cambios no se pudieron sincronizar')}. Revísalo en Ajustes.`,

    // Indicador en Inicio.
    SYNCING_LABEL: 'Sincronizando…',
    pendingLabel: (count: number) => `${count} ${plural(count, 'cambio sin sincronizar', 'cambios sin sincronizar')}`,
    failedLabel: (count: number) => `${count} ${plural(count, 'cambio con error', 'cambios con error')} · Revisa Ajustes`,

    // Ajustes: bloque "Cambios sin sincronizar".
    SYNC_SECTION_TITLE: 'Cambios sin sincronizar',
    ALL_SYNCED: 'Todo está sincronizado.',
    NEVER_SYNCED: 'Aún no se ha sincronizado en este teléfono.',
    lastSyncedLabel: (when: string) => `Última sincronización: ${when}`,
    waitingLabel: (count: number) => `${count} ${plural(count, 'cambio espera', 'cambios esperan')} para subir.`,
    blockedHint: (count: number) => `${count} ${plural(count, 'espera', 'esperan')} a que se resuelva un cambio con error.`,
    OFFLINE_HINT: 'Sin conexión: se subirán solos cuando vuelva.',
    SYNC_NOW_LABEL: 'Sincronizar ahora',
    RETRY_LABEL: 'Reintentar',
    DISCARD_LABEL: 'Descartar',
    CANCEL_LABEL: 'Cancelar',

    // Historial.
    PENDING_SYNC_LABEL: 'Pendiente de sincronizar',

    CHANGE_TITLES: {
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
    },
    DELETE_ROUTINE_TITLE: 'Eliminar una rutina',
    recordTitle: (routine: string | null) =>
      named(routine, (value) => `Guardar la verificación de «${value}»`, 'Guardar una verificación'),
    forgotTitle: (label: string) => `Guardar el olvido «${label}»`,

    FAILURE_REASONS: failureReasonsEs,
    UNKNOWN_FAILURE: 'El servidor no aceptó el cambio.',

    // Confirmar "Descartar".
    DISCARD_SINGLE_MESSAGE: '¿Descartar este cambio? Se perderá y quedará lo que haya en el servidor.',
    DEPENDENT_LABELS: {
      items: (count: number) => `${count} ${plural(count, 'ítem', 'ítems')}`,
      triggers: (count: number) => `${count} ${plural(count, 'aviso', 'avisos')}`,
      records: (count: number) => `${count} ${plural(count, 'verificación', 'verificaciones')}`,
      forgotEvents: (count: number) => `${count} ${plural(count, 'olvido', 'olvidos')}`,
      routines: (count: number) => `${count} ${plural(count, 'rutina', 'rutinas')}`,
      homeNetworks: (count: number) => `${count} ${plural(count, 'red', 'redes')}`,
      settings: (count: number) => `${count} ${plural(count, 'ajuste', 'ajustes')}`,
    },
    discardWithDependentsMessage: (list: string, ofRoutine: boolean) =>
      `Se descartarán también ${list}${ofRoutine ? ' de esta rutina' : ''}. ¿Descartar?`,
  },
  {
    SYNC_CONFLICT_MESSAGE: 'Some changes you made offline were replaced by newer ones from another device.',
    syncFailedMessage: (count: number) =>
      `${count} ${plural(count, 'change could not be synced', 'changes could not be synced')}. Check Settings.`,

    SYNCING_LABEL: 'Syncing…',
    pendingLabel: (count: number) => `${count} ${plural(count, 'unsynced change', 'unsynced changes')}`,
    failedLabel: (count: number) => `${count} ${plural(count, 'change with an error', 'changes with errors')} · Check Settings`,

    SYNC_SECTION_TITLE: 'Unsynced changes',
    ALL_SYNCED: 'Everything is synced.',
    NEVER_SYNCED: "This phone hasn't synced yet.",
    lastSyncedLabel: (when: string) => `Last synced: ${when}`,
    waitingLabel: (count: number) => `${count} ${plural(count, 'change is', 'changes are')} waiting to upload.`,
    blockedHint: (count: number) => `${count} ${plural(count, 'is', 'are')} waiting for a change with an error to be resolved.`,
    OFFLINE_HINT: "You're offline: they'll upload on their own when you're back.",
    SYNC_NOW_LABEL: 'Sync now',
    RETRY_LABEL: 'Retry',
    DISCARD_LABEL: 'Discard',
    CANCEL_LABEL: 'Cancel',

    PENDING_SYNC_LABEL: 'Waiting to sync',

    CHANGE_TITLES: {
      routines: {
        insert: (name: string | null) => named(name, (value) => `Create the routine "${value}"`, 'Create a routine'),
        update: (name: string | null) => named(name, (value) => `Change the routine "${value}"`, 'Change a routine'),
        delete: () => 'Delete a routine',
      },
      items: {
        insert: (name: string | null) => named(name, (value) => `Add the item "${value}"`, 'Add an item'),
        update: (name: string | null) => named(name, (value) => `Change the item "${value}"`, 'Change an item'),
        delete: () => 'Remove an item',
      },
      triggers: {
        insert: (routine: string | null) => named(routine, (value) => `Add an alert to "${value}"`, 'Add an alert'),
        update: (routine: string | null) => named(routine, (value) => `Change an alert on "${value}"`, 'Change an alert'),
        delete: () => 'Remove an alert',
      },
      homeNetworks: {
        insert: (name: string | null) => named(name, (value) => `Add the network "${value}"`, 'Add a network'),
        update: (name: string | null) => named(name, (value) => `Change the network "${value}"`, 'Change a network'),
        delete: () => 'Delete a network',
      },
      settings: {
        insert: () => 'Save your settings',
        update: () => 'Save your settings',
        delete: () => 'Save your settings',
      },
    },
    DELETE_ROUTINE_TITLE: 'Delete a routine',
    recordTitle: (routine: string | null) => named(routine, (value) => `Save the check for "${value}"`, 'Save a check'),
    forgotTitle: (label: string) => `Save the forgotten "${label}"`,

    FAILURE_REASONS: failureReasonsEn,
    UNKNOWN_FAILURE: "The server didn't accept the change.",

    DISCARD_SINGLE_MESSAGE: 'Discard this change? It will be lost and what is on the server will stay.',
    DEPENDENT_LABELS: {
      items: (count: number) => `${count} ${plural(count, 'item', 'items')}`,
      triggers: (count: number) => `${count} ${plural(count, 'alert', 'alerts')}`,
      records: (count: number) => `${count} ${plural(count, 'check', 'checks')}`,
      forgotEvents: (count: number) => `${count} ${plural(count, 'forgotten item', 'forgotten items')}`,
      routines: (count: number) => `${count} ${plural(count, 'routine', 'routines')}`,
      homeNetworks: (count: number) => `${count} ${plural(count, 'network', 'networks')}`,
      settings: (count: number) => `${count} ${plural(count, 'setting', 'settings')}`,
    },
    discardWithDependentsMessage: (list: string, ofRoutine: boolean) =>
      `${list}${ofRoutine ? ' from this routine' : ''} will also be discarded. Discard?`,
  },
);
