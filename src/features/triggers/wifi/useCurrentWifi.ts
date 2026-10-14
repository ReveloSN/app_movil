import { useCallback, useRef, useState } from 'react';

import { getPermission, isLocationServiceEnabled } from '@/features/permissions/permission.service';

import { readWifi } from './wifi.reader';

export type WifiDetection =
  | { status: 'idle' | 'detecting' | 'needs-permission' | 'services-off' | 'not-on-wifi' | 'hidden' }
  | { status: 'detected'; ssid: string };

/**
 * Red detectada (06-4): lee el SSID actual para sugerirlo como red del aviso.
 * Nunca muestra diálogos de permiso: si falta, lo informa y la pantalla decide (ir a P02).
 */
export function useCurrentWifi() {
  const [detection, setDetection] = useState<WifiDetection>({ status: 'idle' });
  const latest = useRef(0);

  const detect = useCallback(async () => {
    const request = ++latest.current;
    const update = (next: WifiDetection) => {
      if (request === latest.current) setDetection(next);
    };
    update({ status: 'detecting' });
    try {
      if (!(await getPermission('location')).granted) return update({ status: 'needs-permission' });
      if (!(await isLocationServiceEnabled())) return update({ status: 'services-off' });
      const reading = await readWifi();
      if (reading.status === 'wifi') return update({ status: 'detected', ssid: reading.ssid });
      update({ status: reading.status === 'off-wifi' ? 'not-on-wifi' : 'hidden' });
    } catch (cause) {
      if (__DEV__) console.warn('[wifi.detect]', cause);
      update({ status: 'hidden' });
    }
  }, []);

  return { detection, detect };
}
