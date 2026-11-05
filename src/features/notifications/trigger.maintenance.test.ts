import AsyncStorage from '@react-native-async-storage/async-storage';

import { ensureHomeGeofence } from '@/features/geofence/geofence.service';
import { saveArmedTriggers } from '@/features/triggers/armedTriggers.store';

import { writeNotificationRecord } from './record.writer';
import { runTriggerMaintenance } from './trigger.maintenance';
import { updateOccurrences } from './occurrence.store';
import type { Occurrence } from './occurrence.types';

jest.mock('@/db/app.repositories', () => ({ remoteRepositories: {} }));
jest.mock('@/db/local/local.store', () => ({ getLocalStore: jest.fn() }));
jest.mock('@/db/local/pendingSync.migration', () => ({ migratePendingRecords: jest.fn(async () => undefined) }));
jest.mock('@/db/sync/sync.push', () => ({ pushOutbox: jest.fn(async () => undefined) }));
jest.mock('@/features/geofence/geofence.service', () => ({ ensureHomeGeofence: jest.fn(async () => 'active') }));
jest.mock('./wifi.monitor', () => ({ checkWifiTriggers: jest.fn(async () => 0) }));
jest.mock('./record.writer', () => ({ writeNotificationRecord: jest.fn(async () => undefined) }));
jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  dismissNotificationAsync: jest.fn(async () => undefined),
}));

const NOW = new Date(2026, 10, 3, 20, 0).getTime();
const occurrence = (key: string, kind?: 'arrival'): Occurrence => ({
  key,
  triggerId: `t-${key}`,
  routineId: `r-${key}`,
  routineName: 'Rutina',
  itemCount: 2,
  ownerId: 'u1',
  firesAt: NOW - 3_600_000,
  deadline: NOW - 1,
  notificationIds: [],
  signature: 'sig',
  kind,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  (writeNotificationRecord as jest.Mock).mockClear();
});

describe('mantenimiento: lo vencido sin respuesta', () => {
  it('una salida vencida se registra como «sin respuesta»; una llegada se descarta sin registro', async () => {
    await updateOccurrences(async () => ({ entries: [occurrence('salida'), occurrence('llegada', 'arrival')], result: null }));

    await runTriggerMaintenance(NOW);

    expect(writeNotificationRecord).toHaveBeenCalledTimes(1);
    expect(writeNotificationRecord).toHaveBeenCalledWith('r-salida', 'u1', 'no_response', NOW - 1);
  });
});

describe('mantenimiento: geocerca de casa', () => {
  const arrival = { routineId: 'r1', routineName: 'Llegar', itemLabels: [], windows: [] };

  it('pide la geocerca solo si hay una rutina de llegada activa', async () => {
    await saveArmedTriggers({ ownerId: 'u1', triggers: [], arrivals: [arrival] });
    await runTriggerMaintenance(NOW);
    expect(ensureHomeGeofence).toHaveBeenLastCalledWith('u1', true);

    await saveArmedTriggers({ ownerId: 'u1', triggers: [], arrivals: [] });
    await runTriggerMaintenance(NOW);
    expect(ensureHomeGeofence).toHaveBeenLastCalledWith('u1', false);
  });
});
