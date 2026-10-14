/**
 * Ejecuta tareas asíncronas de a una, en orden de llegada: útil para leer-modificar-escribir
 * un mismo valor de AsyncStorage sin que dos operaciones se pisen.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  };
}
