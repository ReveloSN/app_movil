import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { DEFAULT_PREFS } from './notification.prefs';
import { fireArrival } from './occurrence.lifecycle';

// Android: es donde existen los canales.
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

const calls: string[] = [];
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async (id: string) => {
    calls.push(`channel:${id}`);
  }),
  scheduleNotificationAsync: jest.fn(async ({ identifier }: { identifier: string }) => {
    calls.push('schedule');
    return identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
}));

const NOW = new Date(2026, 10, 3, 19, 0).getTime();
const target = (routineId: string) => ({ routineId, routineName: 'Llegar a casa', itemLabels: ['Poner a cargar el celular'] });

beforeEach(async () => {
  await AsyncStorage.clear();
  calls.length = 0;
});

describe('llegada sin interfaz (geocerca o Wi-Fi con la app cerrada)', () => {
  it('crea los canales de llegada antes de notificar, y solo una vez', async () => {
    await fireArrival(target('r1'), 'u1', NOW, DEFAULT_PREFS);

    const firstSchedule = calls.indexOf('schedule');
    expect(firstSchedule).toBeGreaterThan(0);
    expect(calls.slice(0, firstSchedule)).toEqual(
      expect.arrayContaining(['channel:arrival-reminder', 'channel:arrival-reminder-silent']),
    );

    // Idempotente: una segunda llegada no vuelve a crear canales.
    const channelCalls = (Notifications.setNotificationChannelAsync as jest.Mock).mock.calls.length;
    await fireArrival(target('r2'), 'u1', NOW, DEFAULT_PREFS);
    expect((Notifications.setNotificationChannelAsync as jest.Mock).mock.calls.length).toBe(channelCalls);
    expect(calls.filter((call) => call === 'schedule')).toHaveLength(2);
  });
});
