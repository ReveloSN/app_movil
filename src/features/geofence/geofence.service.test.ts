import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { ensureHomeGeofence, HOME_GEOFENCE_TASK, readGeofenceStatus, registerHomeGeofence, stopHomeGeofence } from './geofence.service';
import { saveArmedTriggers } from '@/features/triggers/armedTriggers.store';

import { saveHomeGeofence } from './homeGeofence.store';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  hasStartedGeofencingAsync: jest.fn(),
  startGeofencingAsync: jest.fn(),
  stopGeofencingAsync: jest.fn(),
}));

const mocked = Location as unknown as Record<string, jest.Mock>;
const ARRIVAL = { routineId: 'r1', routineName: 'Llegar', itemLabels: [], windows: [] };
const armWith = (arrivals: (typeof ARRIVAL)[]) => saveArmedTriggers({ ownerId: 'u1', triggers: [], arrivals });
const HOME = { latitude: 4.711, longitude: -74.07, radius: 250 };

function setup({ foreground = true, background = true, services = true, started = false } = {}) {
  mocked.getForegroundPermissionsAsync.mockResolvedValue({ granted: foreground });
  mocked.getBackgroundPermissionsAsync.mockResolvedValue({ granted: background });
  mocked.hasServicesEnabledAsync.mockResolvedValue(services);
  mocked.hasStartedGeofencingAsync.mockResolvedValue(started);
  mocked.startGeofencingAsync.mockResolvedValue(undefined);
  mocked.stopGeofencingAsync.mockResolvedValue(undefined);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  // Por defecto hay una rutina de llegada activa.
  await armWith([ARRIVAL]);
  Object.values(mocked).forEach((fn) => typeof fn?.mockReset === 'function' && fn.mockReset());
});

describe('registro de la geocerca de casa', () => {
  it('registra una región «home» solo para entrar, con el radio guardado', async () => {
    setup();
    await saveHomeGeofence('u1', HOME);

    expect(await registerHomeGeofence('u1')).toBe('active');
    expect(mocked.startGeofencingAsync).toHaveBeenCalledWith(HOME_GEOFENCE_TASK, [
      { identifier: 'home', latitude: 4.711, longitude: -74.07, radius: 250, notifyOnEnter: true, notifyOnExit: false },
    ]);
  });

  it('sin casa no registra nada y quita la geocerca', async () => {
    setup({ started: true });
    expect(await registerHomeGeofence('u1')).toBe('no-home');
    expect(mocked.startGeofencingAsync).not.toHaveBeenCalled();
    expect(mocked.stopGeofencingAsync).toHaveBeenCalledWith(HOME_GEOFENCE_TASK);
  });

  it('sin permiso de segundo plano degrada a solo Wi-Fi: no registra y no lanza', async () => {
    setup({ background: false });
    await saveHomeGeofence('u1', HOME);

    expect(await registerHomeGeofence('u1')).toBe('no-permission');
    expect(mocked.startGeofencingAsync).not.toHaveBeenCalled();
    expect(await readGeofenceStatus('u1')).toBe('no-permission');
  });

  it('sin permiso de primer plano tampoco registra', async () => {
    setup({ foreground: false });
    await saveHomeGeofence('u1', HOME);
    expect(await registerHomeGeofence('u1')).toBe('no-permission');
  });

  it('con la ubicación del teléfono apagada queda inactiva', async () => {
    setup({ services: false });
    await saveHomeGeofence('u1', HOME);
    expect(await registerHomeGeofence('u1')).toBe('inactive');
    expect(mocked.startGeofencingAsync).not.toHaveBeenCalled();
  });

  it('si el sistema rechaza el registro, queda inactiva sin lanzar', async () => {
    setup();
    mocked.startGeofencingAsync.mockRejectedValue(new Error('rechazado'));
    await saveHomeGeofence('u1', HOME);
    expect(await registerHomeGeofence('u1')).toBe('inactive');
  });

  it('en el mantenimiento: si ya está registrada no la toca; si no, la registra', async () => {
    setup({ started: true });
    await saveHomeGeofence('u1', HOME);
    expect(await ensureHomeGeofence('u1')).toBe('active');
    expect(mocked.startGeofencingAsync).not.toHaveBeenCalled();

    mocked.hasStartedGeofencingAsync.mockResolvedValue(false);
    expect(await ensureHomeGeofence('u1')).toBe('active');
    expect(mocked.startGeofencingAsync).toHaveBeenCalledTimes(1);
  });

  it('sin rutina de llegada activa no registra la geocerca aunque haya casa y permisos, y la quita', async () => {
    setup({ started: true });
    await saveHomeGeofence('u1', HOME);
    await armWith([]);

    expect(await registerHomeGeofence('u1')).toBe('no-arrival');
    expect(mocked.startGeofencingAsync).not.toHaveBeenCalled();
    expect(mocked.stopGeofencingAsync).toHaveBeenCalledWith(HOME_GEOFENCE_TASK);
    expect(await readGeofenceStatus('u1')).toBe('no-arrival');
  });

  it('en el mantenimiento: ya registrada pero sin rutina de llegada, la quita; al volver una, la registra', async () => {
    setup({ started: true });
    await saveHomeGeofence('u1', HOME);

    expect(await ensureHomeGeofence('u1', false)).toBe('no-arrival');
    expect(mocked.stopGeofencingAsync).toHaveBeenCalledTimes(1);

    mocked.hasStartedGeofencingAsync.mockResolvedValue(false);
    expect(await ensureHomeGeofence('u1', true)).toBe('active');
    expect(mocked.startGeofencingAsync).toHaveBeenCalledTimes(1);
  });

  it('sin copia de avisos armados se asume que no hay rutina de llegada', async () => {
    setup();
    await saveHomeGeofence('u1', HOME);
    await AsyncStorage.clear();
    await saveHomeGeofence('u1', HOME);
    expect(await registerHomeGeofence('u1')).toBe('no-arrival');
  });

  it('detenerla nunca lanza', async () => {
    setup({ started: true });
    mocked.stopGeofencingAsync.mockRejectedValue(new Error('x'));
    await expect(stopHomeGeofence()).resolves.toBeUndefined();
  });

  it('el estado refleja casa, permisos y registro', async () => {
    setup({ started: true });
    expect(await readGeofenceStatus('u1')).toBe('no-home');
    await saveHomeGeofence('u1', HOME);
    expect(await readGeofenceStatus('u1')).toBe('active');
    mocked.hasStartedGeofencingAsync.mockResolvedValue(false);
    expect(await readGeofenceStatus('u1')).toBe('inactive');
  });
});
