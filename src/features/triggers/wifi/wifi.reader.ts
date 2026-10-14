import '@/shared/network/netinfo.config';

import NetInfo, { NetInfoStateType, type NetInfoState } from '@react-native-community/netinfo';

/**
 * - wifi: conectado a una red cuyo nombre se pudo leer.
 * - off-wifi: seguro que no hay Wi-Fi (datos móviles o sin red).
 * - unknown: hay Wi-Fi pero el sistema oculta el nombre (falta permiso de ubicación, ubicación
 *   apagada, o app en segundo plano sin "Permitir todo el tiempo"). No permite decidir nada.
 */
export type WifiReading = { status: 'wifi'; ssid: string } | { status: 'off-wifi' } | { status: 'unknown' };

export function toWifiReading(state: NetInfoState): WifiReading {
  if (state.type === NetInfoStateType.wifi) {
    // NetInfo ya quita las comillas de Android y devuelve null en vez de "<unknown ssid>".
    const ssid = state.details?.ssid?.trim();
    return ssid ? { status: 'wifi', ssid } : { status: 'unknown' };
  }
  if (state.type === NetInfoStateType.unknown || state.isConnected === null) return { status: 'unknown' };
  return { status: 'off-wifi' };
}

/** Lee la red actual pidiéndola de nuevo al sistema (no el último valor en caché). */
export async function readWifi(): Promise<WifiReading> {
  return toWifiReading(await NetInfo.refresh());
}
