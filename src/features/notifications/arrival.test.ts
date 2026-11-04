import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { saveArmedTriggers } from '@/features/triggers/armedTriggers.store';
import type { ArrivalRoutine } from '@/features/triggers/trigger.types';

import { arrivalAllowedAt, handleArrivalDetected } from './arrival.service';
import { DEFAULT_PREFS } from './notification.prefs';
import { fireArrival, WIFI_COOLDOWN_MS } from './occurrence.lifecycle';
import { loadOccurrences } from './occurrence.store';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { HIGH: 4 },
  scheduleNotificationAsync: jest.fn(async ({ identifier }: { identifier: string }) => identifier),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  dismissNotificationAsync: jest.fn(async () => undefined),
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

const NOW = new Date(2026, 10, 3, 19, 0).getTime();
const MIN = 60_000;
const target = { routineId: 'r1', routineName: 'Llegar a casa', itemLabels: ['Poner a cargar el celular', 'Guardar las llaves'] };

beforeEach(async () => {
  await AsyncStorage.clear();
  schedule.mockClear();
});

describe('fireArrival: una sola notificación por llegada', () => {
  it('avisa una vez y no repite dentro del cooldown de 10 minutos', async () => {
    expect(await fireArrival(target, 'u1', NOW, DEFAULT_PREFS)).toBe(true);
    expect(await fireArrival(target, 'u1', NOW + 3 * MIN, DEFAULT_PREFS)).toBe(false);
    expect(await fireArrival(target, 'u1', NOW + WIFI_COOLDOWN_MS - 1, DEFAULT_PREFS)).toBe(false);
    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('pasado el cooldown vuelve a avisar', async () => {
    await fireArrival(target, 'u1', NOW, DEFAULT_PREFS);
    expect(await fireArrival(target, 'u1', NOW + WIFI_COOLDOWN_MS, DEFAULT_PREFS)).toBe(true);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('el cooldown es por rutina: otra rutina de llegada sí avisa', async () => {
    await fireArrival(target, 'u1', NOW, DEFAULT_PREFS);
    expect(await fireArrival({ ...target, routineId: 'r2' }, 'u1', NOW + MIN, DEFAULT_PREFS)).toBe(true);
  });

  it('el cooldown sigue aunque la notificación ya se haya cerrado', async () => {
    await fireArrival(target, 'u1', NOW, DEFAULT_PREFS);
    await AsyncStorage.removeItem('notification-occurrences'); // como si «Hecho» la hubiera cerrado
    expect(await fireArrival(target, 'u1', NOW + 2 * MIN, DEFAULT_PREFS)).toBe(false);
  });

  it('con «No molestar» no suena ni gasta el cooldown', async () => {
    expect(await fireArrival(target, 'u1', NOW, { ...DEFAULT_PREFS, doNotDisturb: true })).toBe(false);
    expect(schedule).not.toHaveBeenCalled();
    expect(await fireArrival(target, 'u1', NOW + MIN, DEFAULT_PREFS)).toBe(true);
  });

  it('guarda la llegada como tal: sin recordatorios y con la rutina', async () => {
    await fireArrival(target, 'u1', NOW, DEFAULT_PREFS);
    expect(schedule).toHaveBeenCalledTimes(1); // solo la principal, sin recordatorios de «sin respuesta»
    const [occurrence] = await loadOccurrences();
    expect(occurrence).toMatchObject({ kind: 'arrival', routineId: 'r1', itemCount: 2, ownerId: 'u1' });
  });
});

describe('llegada detectada (Wi-Fi o geocerca)', () => {
  const arrival = (routineId: string, windows: ArrivalRoutine['windows'] = []): ArrivalRoutine => ({
    routineId,
    routineName: routineId,
    itemLabels: ['Llaves'],
    windows,
  });

  it('sin copia de avisos armados no hace nada', async () => {
    expect(await handleArrivalDetected('geofence', NOW)).toBe(0);
  });

  it('avisa cada rutina de llegada activa, y la geocerca y el Wi-Fi no duplican', async () => {
    await saveArmedTriggers({ ownerId: 'u1', triggers: [], arrivals: [arrival('r1'), arrival('r2')] });
    expect(await handleArrivalDetected('geofence', NOW)).toBe(2);
    // El Wi-Fi detecta la misma llegada un minuto después.
    expect(await handleArrivalDetected('wifi', NOW + MIN)).toBe(0);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('respeta la franja de los avisos de Wi-Fi de la rutina', async () => {
    const evening = { start: { hour: 17, minute: 0 }, end: { hour: 23, minute: 0 } };
    await saveArmedTriggers({ ownerId: 'u1', triggers: [], arrivals: [arrival('r1', [evening])] });
    expect(await handleArrivalDetected('geofence', new Date(2026, 10, 3, 10, 0).getTime())).toBe(0);
    expect(await handleArrivalDetected('geofence', new Date(2026, 10, 3, 19, 0).getTime())).toBe(1);
  });

  it('arrivalAllowedAt: sin avisos o con uno sin franja, a cualquier hora', () => {
    const at = new Date(2026, 10, 3, 3, 0);
    const morning = { start: { hour: 6, minute: 0 }, end: { hour: 9, minute: 0 } };
    expect(arrivalAllowedAt({ windows: [] }, at)).toBe(true);
    expect(arrivalAllowedAt({ windows: [morning, null] }, at)).toBe(true);
    expect(arrivalAllowedAt({ windows: [morning] }, at)).toBe(false);
  });
});
