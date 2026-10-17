import type { LocalDocument, OutboxOp } from '../local/local-document.types';

/** En un cambio de aviso, cambia la red a la que apunta (si era `from`). */
function swapTriggerNetwork(op: OutboxOp, from: string, to: string): OutboxOp {
  if (op.kind === 'insert' && op.table === 'triggers' && op.values.networkId === from) {
    return { ...op, values: { ...op.values, networkId: to } };
  }
  if (op.kind === 'update' && op.table === 'triggers' && op.changes.networkId === from) {
    return { ...op, changes: { ...op.changes, networkId: to } };
  }
  return op;
}

/**
 * La red creada sin conexión ya existía en el servidor con el mismo SSID (UNIQUE(user_id, ssid)):
 * se adopta el id remoto en la copia local, en los avisos que la usan y en lo pendiente de subir.
 */
export function adoptRemoteNetwork(doc: LocalDocument, from: string, to: string): LocalDocument {
  const networks = doc.tables.homeNetworks;
  const homeNetworks = networks.some((network) => network.id === to)
    ? networks.filter((network) => network.id !== from)
    : networks.map((network) => (network.id === from ? { ...network, id: to } : network));
  const triggers = doc.tables.triggers.map((trigger) =>
    trigger.networkId === from ? { ...trigger, networkId: to } : trigger,
  );
  const outbox = doc.outbox.map((op) => {
    if ((op.kind === 'update' || op.kind === 'delete') && op.table === 'homeNetworks' && op.id === from) {
      return { ...op, id: to };
    }
    return swapTriggerNetwork(op, from, to);
  });
  return { ...doc, tables: { ...doc.tables, homeNetworks, triggers }, outbox };
}
