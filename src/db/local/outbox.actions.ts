import type { OutboxOp } from './local-document.types';
import type { LocalStore } from './local.store';
import { discardOp, retryOp } from './outbox.dependencies';

/** Vuelve a intentar una operación fallida (y las que bloqueaba) en la próxima sincronización. */
export const retryOutboxOp = (store: LocalStore, opId: string) =>
  store.update((doc) => ({ doc: { ...doc, outbox: retryOp(doc.outbox, opId) }, result: undefined }));

/**
 * Descarta una operación fallida y las que dependen de ella; devuelve lo descartado. Lo local que
 * quedó sin respaldo (ej. la rutina que el servidor rechazó) lo limpia la próxima bajada: gana el servidor.
 */
export const discardOutboxOp = (store: LocalStore, opId: string): Promise<OutboxOp[]> =>
  store.update((doc) => {
    const { outbox, discarded } = discardOp(doc.outbox, opId);
    return { doc: { ...doc, outbox }, result: discarded };
  });

/** Lo que se descartaría, sin descartarlo (para avisar cuántas cosas son antes de confirmar). */
export const previewDiscard = async (store: LocalStore, opId: string): Promise<OutboxOp[]> =>
  discardOp((await store.read()).outbox, opId).discarded;
