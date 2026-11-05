import { createLocalStore } from '@/db/local/local.store';
import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { clearHomeGeofence, homeGeofenceKey, loadHomeGeofence, parseHomeGeofence, saveHomeGeofence } from './homeGeofence.store';

const HOME = { latitude: 4.711, longitude: -74.0721, radius: 250 };

describe('casa de la geocerca (solo en el teléfono)', () => {
  it('guarda, lee y quita la casa por usuario', async () => {
    const storage = memoryStorage();
    expect(await loadHomeGeofence('u1', storage)).toBeNull();

    await saveHomeGeofence('u1', HOME, storage);
    expect(await loadHomeGeofence('u1', storage)).toEqual(HOME);
    // Otro usuario del mismo teléfono no la ve.
    expect(await loadHomeGeofence('u2', storage)).toBeNull();
    expect(Object.keys(storage.data)).toEqual(['home-geofence:u1']);

    await clearHomeGeofence('u1', storage);
    expect(await loadHomeGeofence('u1', storage)).toBeNull();
    expect(storage.data).toEqual({});
  });

  it('no toca el documento local sincronizado ni la cola de cambios', async () => {
    const storage = memoryStorage();
    const store = createLocalStore('u1', storage);
    await store.update((doc) => ({ doc: { ...doc, lastPulledAt: '2026-11-01T00:00:00.000Z' }, result: null }));
    const before = storage.data['local-db:u1'];
    const docBefore = await store.read();
    const listener = jest.fn();
    store.subscribe(listener);

    await saveHomeGeofence('u1', HOME, storage);
    await saveHomeGeofence('u1', { ...HOME, radius: 400 }, storage);
    await clearHomeGeofence('u1', storage);

    expect(storage.data['local-db:u1']).toBe(before);
    expect(await store.read()).toEqual(docBefore);
    expect(docBefore.outbox).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('la clave de la casa no es la del documento local', () => {
    expect(homeGeofenceKey('u1')).toBe('home-geofence:u1');
    expect(homeGeofenceKey('u1')).not.toMatch(/^local-db:/);
  });

  it('un valor dañado o fuera de rango se trata como sin casa', async () => {
    const storage = memoryStorage({ [homeGeofenceKey('u1')]: '{no es json' });
    expect(await loadHomeGeofence('u1', storage)).toBeNull();

    expect(parseHomeGeofence({ latitude: 91, longitude: 0, radius: 250 })).toBeNull();
    expect(parseHomeGeofence({ latitude: 0, longitude: 181, radius: 250 })).toBeNull();
    expect(parseHomeGeofence({ latitude: 0, longitude: 0, radius: 50 })).toBeNull();
    expect(parseHomeGeofence({ latitude: 'x', longitude: 0, radius: 250 })).toBeNull();
    expect(parseHomeGeofence(null)).toBeNull();
    await expect(saveHomeGeofence('u1', { ...HOME, radius: 10 }, storage)).rejects.toThrow();
  });
});
