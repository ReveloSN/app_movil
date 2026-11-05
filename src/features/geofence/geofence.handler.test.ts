import * as TaskManager from 'expo-task-manager';

import { handleArrivalDetected } from '@/features/notifications/arrival.service';

import { handleGeofenceEvent } from './geofence.handler';
import { HOME_GEOFENCE_TASK } from './geofence.service';

jest.mock('expo-location', () => ({ GeofencingEventType: { Enter: 1, Exit: 2 } }));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('@/features/notifications/arrival.service', () => ({ handleArrivalDetected: jest.fn(async () => 1) }));

const arrival = handleArrivalDetected as jest.Mock;
const ENTER = 1;
const EXIT = 2;

beforeEach(() => arrival.mockClear());

describe('manejador de la tarea de geocerca', () => {
  it('ENTRAR a la región de casa avisa la llegada', async () => {
    expect(await handleGeofenceEvent({ data: { eventType: ENTER, region: { identifier: 'home' } } }, 123)).toBe(1);
    expect(arrival).toHaveBeenCalledWith('geofence', 123);
  });

  it('SALIR se ignora', async () => {
    expect(await handleGeofenceEvent({ data: { eventType: EXIT, region: { identifier: 'home' } } })).toBe(0);
    expect(arrival).not.toHaveBeenCalled();
  });

  it('un error de la tarea, o sin datos, no hace nada', async () => {
    expect(await handleGeofenceEvent({ error: { message: 'x' }, data: { eventType: ENTER } })).toBe(0);
    expect(await handleGeofenceEvent({ data: null })).toBe(0);
    expect(arrival).not.toHaveBeenCalled();
  });

  it('otra región no es la casa', async () => {
    expect(await handleGeofenceEvent({ data: { eventType: ENTER, region: { identifier: 'otra' } } })).toBe(0);
    expect(arrival).not.toHaveBeenCalled();
  });

  it('si avisar falla, la tarea no lanza', async () => {
    arrival.mockRejectedValueOnce(new Error('falló'));
    await expect(handleGeofenceEvent({ data: { eventType: ENTER, region: { identifier: 'home' } } })).resolves.toBe(0);
  });
});

describe('definición de la tarea', () => {
  it('se define al importar el módulo, con el nombre de la geocerca de casa', async () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./geofence.task');
    });
    const [name, executor] = (TaskManager.defineTask as jest.Mock).mock.calls[0];
    expect(name).toBe(HOME_GEOFENCE_TASK);

    await executor({ data: { eventType: ENTER, region: { identifier: 'home' } }, error: null });
    expect(arrival).toHaveBeenCalledTimes(1);
    await executor({ data: { eventType: EXIT, region: { identifier: 'home' } }, error: null });
    expect(arrival).toHaveBeenCalledTimes(1);
  });
});
