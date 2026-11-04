import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { applyNotificationResponse, responseKind } from './notification.actions';
import { ACTION_DONE, ARRIVAL_CATEGORY_ID } from './notification.config';
import { ARRIVAL_MAX_LISTED, ARRIVAL_TITLE, arrivalBody } from './notification.copy';
import { DEFAULT_PREFS } from './notification.prefs';
import { fireArrival } from './occurrence.lifecycle';
import { loadOccurrences } from './occurrence.store';
import { writeNotificationRecord } from './record.writer';

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  scheduleNotificationAsync: jest.fn(async ({ identifier }: { identifier: string }) => identifier),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  dismissNotificationAsync: jest.fn(async () => undefined),
}));
jest.mock('./record.writer', () => ({ writeNotificationRecord: jest.fn(async () => undefined) }));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const labels = (count: number) => Array.from({ length: count }, (_, index) => `Recordatorio ${index + 1}`);
const NOW = new Date(2026, 10, 3, 19, 0).getTime();

beforeEach(async () => {
  await AsyncStorage.clear();
  schedule.mockClear();
  (writeNotificationRecord as jest.Mock).mockClear();
});

describe('contenido de la notificación de llegada', () => {
  it('con 1 recordatorio va directo', () => {
    expect(arrivalBody(['Poner a cargar el celular'])).toBe('Poner a cargar el celular');
  });

  it('con 5 los lista todos, uno por línea', () => {
    const lines = arrivalBody(labels(5)).split('\n');
    expect(lines[0]).toBe('5 recordatorios:');
    expect(lines.slice(1)).toEqual(labels(5).map((label) => `• ${label}`));
  });

  it('con 12 (el máximo) lista los primeros y resume el resto con «y X más»', () => {
    const lines = arrivalBody(labels(12)).split('\n');
    expect(lines[0]).toBe('12 recordatorios:');
    expect(lines).toHaveLength(1 + ARRIVAL_MAX_LISTED + 1);
    expect(lines[lines.length - 1]).toBe(`y ${12 - ARRIVAL_MAX_LISTED} más`);
    expect(lines[ARRIVAL_MAX_LISTED]).toBe(`• Recordatorio ${ARRIVAL_MAX_LISTED}`);
  });

  it('sin recordatorios, un texto de respaldo', () => {
    expect(arrivalBody([])).toBe('Revisa tus recordatorios de llegada.');
  });

  it('se programa con el título, la categoría con «Hecho» y su propio canal', async () => {
    const target = { routineId: 'r1', routineName: 'Llegar a casa', itemLabels: labels(2) };
    await fireArrival(target, 'u1', NOW, DEFAULT_PREFS);
    const [request] = schedule.mock.calls[0];
    expect(request.content).toMatchObject({
      title: ARRIVAL_TITLE,
      subtitle: 'Llegar a casa',
      body: arrivalBody(labels(2)),
      categoryIdentifier: ARRIVAL_CATEGORY_ID,
    });
    expect(request.trigger).toEqual({ channelId: 'arrival-reminder' });

    await fireArrival({ ...target, routineId: 'r2' }, 'u1', NOW, { ...DEFAULT_PREFS, sound: false });
    expect(schedule.mock.calls[1][0].trigger).toEqual({ channelId: 'arrival-reminder-silent' });
  });
});

describe('acción «Hecho»', () => {
  const response = (actionIdentifier: string, occurrenceKey: string) =>
    ({
      actionIdentifier,
      notification: { date: 1, request: { identifier: `${occurrenceKey}#0`, content: { data: { occurrenceKey, routineId: 'r1' } } } },
    }) as unknown as Notifications.NotificationResponse;

  it('se reconoce como respuesta «done»', () => {
    expect(responseKind(ACTION_DONE)).toBe('done');
  });

  it('cierra la llegada, la quita de la bandeja y NO crea ningún registro', async () => {
    await fireArrival({ routineId: 'r1', routineName: 'Llegar', itemLabels: labels(2) }, 'u1', NOW, DEFAULT_PREFS);
    const [occurrence] = await loadOccurrences();

    const outcome = await applyNotificationResponse(response(ACTION_DONE, occurrence.key), NOW + 1000);

    expect(outcome).toEqual({ kind: 'done', routineId: 'r1' });
    expect(await loadOccurrences()).toEqual([]);
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalled();
    expect(writeNotificationRecord).not.toHaveBeenCalled();
  });

  it('«Hecho» dos veces no falla', async () => {
    const key = 'arrival:r1@1';
    await applyNotificationResponse(response(ACTION_DONE, key));
    await expect(applyNotificationResponse(response(ACTION_DONE, key))).resolves.toEqual({ kind: 'done', routineId: 'r1' });
    expect(writeNotificationRecord).not.toHaveBeenCalled();
  });
});
